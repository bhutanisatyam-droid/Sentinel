"""
KYC Orchestrator — Full Verification Pipeline with Cross-Verification.

Pipeline (10 steps):
1.  Process primary doc (PAN) → Quality + OCR + Format
2.  Liveness check
3.  Face match (selfie vs document photo)
4.  Gov DB verification for primary doc (PAN via Setu sandbox)
5.  OCR-vs-Gov cross-check — catches forged/tampered primary documents
6.  [Optional] Process secondary doc (AADHAAR / PASSPORT / DL)
7.  [Optional] Gov DB verification for secondary doc
8.  [Optional] Cross-document verification (primary OCR vs secondary OCR)
9.  Sanctions screening
10. Risk scoring (incorporates cross-verification risk factors)

Architecture notes:
- PAN is ALWAYS the primary document
- Aadhaar / Passport / DL are optional secondary documents
- The GovVerificationProvider handles all 4 doc types via the same ABC
- Cross-verification happens in DocumentProcessor (fuzzywuzzy, threshold 85%)
- Results stored in session.gov_verification dict (no KYCSession schema change)
"""

from app.providers.base import (
    get_provider, OCRProvider, FaceMatchProvider, LivenessProvider,
    GovVerificationProvider, SanctionsProvider
)
from app.services.kyc_state_machine import (
    KYCSession, KYCStage, advance_stage, record_error
)
from app.services.document_processor import DocumentProcessor
from app.services.aadhaar_vault import AadhaarVaultService
from supabase import create_client, Client
from app.config import get_settings
from typing import List, Optional, Dict, Any
import uuid
import logging

settings = get_settings()
logger = logging.getLogger(__name__)


class KYCOrchestrator:
    def __init__(self):
        self.doc_processor = DocumentProcessor()
        self.liveness_provider = get_provider(LivenessProvider)
        self.face_match_provider = get_provider(FaceMatchProvider)
        self.gov_provider = get_provider(GovVerificationProvider)
        self.sanctions_provider = get_provider(SanctionsProvider)
        self.aadhaar_vault = AadhaarVaultService()

        self.supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )

    async def run_full_verification(
        self,
        user_id: str,
        document_image: bytes,
        doc_type: str,
        selfie_image: bytes,
        liveness_frames: List[bytes],
        secondary_document_image: Optional[bytes] = None,
        secondary_doc_type: Optional[str] = None,
    ) -> KYCSession:
        """
        Full KYC verification pipeline.

        Args:
            user_id: Unique user identifier
            document_image: Primary document image bytes (PAN card)
            doc_type: Primary document type — should always be "PAN"
            selfie_image: User selfie for face matching
            liveness_frames: Video frames for liveness detection
            secondary_document_image: Optional secondary doc bytes (AADHAAR/PASSPORT/DL)
            secondary_doc_type: Optional — "AADHAAR" | "PASSPORT" | "DL"

        Returns:
            KYCSession with all verification results populated
        """
        session_id = str(uuid.uuid4())
        session = KYCSession(session_id=session_id, user_id=user_id)

        try:
            # ══════════════════════════════════════════════════════════
            # STEP 1: PRIMARY DOCUMENT PROCESSING (Quality → OCR → Format)
            # ══════════════════════════════════════════════════════════
            advance_stage(session, KYCStage.DOCUMENT_UPLOADED)

            doc_result = await self.doc_processor.process_document(document_image, doc_type)

            if "error" in doc_result:
                record_error(session, KYCStage.QUALITY_CHECKED, doc_result["error"])
                advance_stage(session, KYCStage.FAILED)
                return await self._finalize_session(session)

            session.quality_score = doc_result.get("quality_score")
            session.ocr_data = doc_result
            session.format_valid = doc_result.get("format_valid", False)

            advance_stage(session, KYCStage.QUALITY_CHECKED)
            advance_stage(session, KYCStage.OCR_EXTRACTED)
            advance_stage(session, KYCStage.FORMAT_VALIDATED)

            if doc_result.get("confidence", 0) < 0.7 or not session.format_valid:
                record_error(session, KYCStage.OCR_EXTRACTED, "Low OCR confidence or Invalid Format")
                advance_stage(session, KYCStage.REQUIRES_MANUAL_REVIEW)
                return await self._finalize_session(session)

            # ══════════════════════════════════════════════════════════
            # STEP 2: LIVENESS CHECK
            # ══════════════════════════════════════════════════════════
            liveness_result = await self.liveness_provider.check_liveness(liveness_frames)
            session.liveness_score = liveness_result.get("score")

            if not liveness_result.get("real"):
                record_error(session, KYCStage.LIVENESS_PASSED, "Liveness check failed")
                advance_stage(session, KYCStage.FAILED)
                return await self._finalize_session(session)

            advance_stage(session, KYCStage.LIVENESS_PASSED)

            # ══════════════════════════════════════════════════════════
            # STEP 3: FACE MATCH (selfie vs primary document photo)
            # ══════════════════════════════════════════════════════════
            match_result = await self.face_match_provider.compare_faces(selfie_image, document_image)
            session.face_match_score = match_result.get("score")

            advance_stage(session, KYCStage.FACE_MATCHED)

            if not match_result.get("match") or session.face_match_score < 0.6:
                record_error(session, KYCStage.FACE_MATCHED, "Face match score too low")
                advance_stage(session, KYCStage.REQUIRES_MANUAL_REVIEW)
                return await self._finalize_session(session)

            # ══════════════════════════════════════════════════════════
            # STEP 4: GOV DB VERIFICATION — PRIMARY DOCUMENT
            # ══════════════════════════════════════════════════════════
            extracted_name = session.ocr_data.get("name", "")
            doc_number = session.ocr_data.get("document_number", "")
            extracted_dob = session.ocr_data.get("dob", "")

            gov_result = await self._verify_document_with_gov(
                user_id, doc_type, doc_number, extracted_name, extracted_dob
            )

            session.gov_verification = gov_result
            advance_stage(session, KYCStage.GOV_DB_VERIFIED)

            if not gov_result.get("verified"):
                error_detail = gov_result.get("error", "Unknown verification failure")
                record_error(session, KYCStage.GOV_DB_VERIFIED,
                             f"Primary doc gov verification failed: {error_detail}")
                advance_stage(session, KYCStage.FAILED)
                return await self._finalize_session(session)

            # ══════════════════════════════════════════════════════════
            # STEP 5: OCR vs GOV CROSS-CHECK (catches forgeries)
            #
            # This compares what OCR extracted from the PAN image against
            # what NSDL says that PAN number actually belongs to.
            # If someone photoshopped a different name onto a real PAN,
            # this step catches it.
            # ══════════════════════════════════════════════════════════
            ocr_gov_check = self.doc_processor.verify_ocr_against_gov(
                ocr_data=session.ocr_data,
                gov_response=gov_result,
                doc_type=doc_type,
            )

            # Store cross-check results inside gov_verification dict
            session.gov_verification["ocr_gov_cross_check"] = ocr_gov_check

            logger.info(
                f"[Session {session_id}] OCR-vs-Gov cross-check: "
                f"{ocr_gov_check['verdict']} (confidence: {ocr_gov_check['confidence']}%)"
            )

            # ══════════════════════════════════════════════════════════
            # STEPS 6-8: SECONDARY DOCUMENT (if provided)
            #
            # This entire block is skipped if no secondary doc was uploaded.
            # All results are stored in session.gov_verification under
            # "secondary_*" keys so the KYCSession dataclass doesn't change.
            # ══════════════════════════════════════════════════════════
            secondary_ocr_data = None
            secondary_gov_result = None
            cross_doc_check = None

            if secondary_document_image and secondary_doc_type:
                logger.info(
                    f"[Session {session_id}] Processing secondary document: {secondary_doc_type}"
                )

                # ── Step 6: Process secondary document (Quality → OCR → Format) ──
                secondary_result = await self.doc_processor.process_document(
                    secondary_document_image, secondary_doc_type
                )

                if "error" in secondary_result:
                    logger.warning(
                        f"[Session {session_id}] Secondary doc processing failed: "
                        f"{secondary_result.get('error')}. Continuing without secondary verification."
                    )
                    session.gov_verification["secondary_processing_error"] = secondary_result.get("error")
                else:
                    secondary_ocr_data = secondary_result

                    # ── Step 7: Gov DB verification for secondary doc ──
                    sec_name = secondary_ocr_data.get("name", "")
                    sec_number = secondary_ocr_data.get("document_number", "")
                    sec_dob = secondary_ocr_data.get("dob", "")

                    secondary_gov_result = await self._verify_document_with_gov(
                        user_id, secondary_doc_type, sec_number, sec_name, sec_dob
                    )

                    session.gov_verification["secondary_gov_result"] = secondary_gov_result
                    session.gov_verification["secondary_doc_type"] = secondary_doc_type

                    logger.info(
                        f"[Session {session_id}] Secondary gov verification: "
                        f"verified={secondary_gov_result.get('verified')}, "
                        f"source={secondary_gov_result.get('source', 'unknown')}"
                    )

                    # ── Step 8: Cross-document verification (PAN OCR vs secondary OCR) ──
                    cross_doc_check = self.doc_processor.cross_verify_documents(
                        primary_ocr=session.ocr_data,
                        secondary_ocr=secondary_ocr_data,
                        primary_doc_type=doc_type,
                        secondary_doc_type=secondary_doc_type,
                    )

                    session.gov_verification["cross_document_check"] = cross_doc_check

                    logger.info(
                        f"[Session {session_id}] Cross-document verification: "
                        f"{cross_doc_check['verdict']} (confidence: {cross_doc_check['confidence']}%)"
                    )

            # ══════════════════════════════════════════════════════════
            # STEP 9: SANCTIONS SCREENING
            # ══════════════════════════════════════════════════════════
            sanctions_result = await self.sanctions_provider.screen_entity(extracted_name)
            session.sanctions_result = sanctions_result
            advance_stage(session, KYCStage.SANCTIONS_SCREENED)

            if sanctions_result.get("hit") is True:
                record_error(session, KYCStage.SANCTIONS_SCREENED, "Sanctions hit detected")
                advance_stage(session, KYCStage.FAILED)
                return await self._finalize_session(session)
            elif sanctions_result.get("hit") == "UNKNOWN":
                record_error(session, KYCStage.SANCTIONS_SCREENED, "Sanctions check unavailable")
                advance_stage(session, KYCStage.REQUIRES_MANUAL_REVIEW)
                return await self._finalize_session(session)

            # ══════════════════════════════════════════════════════════
            # STEP 10: RISK SCORING
            #
            # Base risk + existing factors + NEW cross-verification factors.
            # Each risk factor adds to the score and logs a reason.
            # ══════════════════════════════════════════════════════════
            risk_score = 10  # Base low risk
            risk_reasons = []

            # ── Factor 1: Document image quality (existing) ──
            if session.quality_score is not None and session.quality_score < 80:
                risk_score += 20
                risk_reasons.append("Low document image quality")

            # ── Factor 2: Face match confidence (existing) ──
            if session.face_match_score is not None and session.face_match_score < 0.8:
                risk_score += 20
                risk_reasons.append("Low face match confidence")

            # ── Factor 3: PAN name mismatch with gov DB (existing field, now explicit) ──
            if gov_result.get("name_match") is False:
                risk_score += 15
                risk_reasons.append(
                    f"PAN name mismatch: OCR='{extracted_name}' vs "
                    f"GovDB='{gov_result.get('name_on_record', 'N/A')}'"
                )

            # ── Factor 4: OCR-vs-Gov cross-check inconsistency (NEW) ──
            if ocr_gov_check and ocr_gov_check.get("risk_flag"):
                risk_score += 30
                discrepancies = ocr_gov_check.get("discrepancies", [])
                risk_reasons.append(
                    f"OCR-vs-Gov inconsistency detected: {'; '.join(discrepancies)}"
                )

            # ── Factor 5: Secondary doc gov verification failed (NEW) ──
            if secondary_gov_result and not secondary_gov_result.get("verified"):
                risk_score += 20
                risk_reasons.append(
                    f"Secondary document ({secondary_doc_type}) gov verification failed"
                )

            # ── Factor 6: Cross-document discrepancy (NEW) ──
            if cross_doc_check and not cross_doc_check.get("cross_verified"):
                risk_score += 25
                discrepancies = cross_doc_check.get("discrepancies", [])
                risk_reasons.append(
                    f"Cross-document discrepancy between {doc_type} and "
                    f"{secondary_doc_type}: {'; '.join(discrepancies)}"
                )

            # ── Factor 7: Secondary doc name doesn't match gov DB (NEW) ──
            if secondary_gov_result and secondary_gov_result.get("name_match") is False:
                risk_score += 15
                risk_reasons.append(
                    f"Secondary doc ({secondary_doc_type}) name mismatch with gov DB: "
                    f"OCR='{secondary_ocr_data.get('name', 'N/A') if secondary_ocr_data else 'N/A'}' vs "
                    f"GovDB='{secondary_gov_result.get('name_on_record', secondary_gov_result.get('name', 'N/A'))}'"
                )

            # ── Cap at 100 ──
            risk_score = min(risk_score, 100)

            session.risk_score = risk_score
            session.risk_reasons = risk_reasons
            advance_stage(session, KYCStage.RISK_SCORED)

            logger.info(
                f"[Session {session_id}] Risk score: {risk_score} "
                f"({len(risk_reasons)} factor(s): {risk_reasons})"
            )

            if risk_score > 60:
                advance_stage(session, KYCStage.REQUIRES_MANUAL_REVIEW)
            else:
                advance_stage(session, KYCStage.COMPLETED)

            return await self._finalize_session(session)

        except Exception as e:
            record_error(session, session.current_stage, f"Unexpected system error: {str(e)}")
            advance_stage(session, KYCStage.FAILED)
            return await self._finalize_session(session)

    # ══════════════════════════════════════════════════════════════
    # HELPER: Route gov verification to the correct method
    # ══════════════════════════════════════════════════════════════

    async def _verify_document_with_gov(
        self,
        user_id: str,
        doc_type: str,
        doc_number: str,
        name: str,
        dob: str = "",
    ) -> Dict[str, Any]:
        """
        Routes to the correct GovVerificationProvider method based on doc_type.

        Supports: PAN (primary), AADHAAR, PASSPORT, DL (secondary).
        """
        if doc_type == "PAN":
            return await self.gov_provider.verify_pan(doc_number, name)

        elif doc_type == "AADHAAR":
            # In the real flow, this would be a DigiLocker OAuth token.
            # For demo, we pass a token keyed to the user's name.
            # The smart mock maps tokens like "arjun_token" to the right identity.
            token = self._derive_aadhaar_token(name)
            gov_result = await self.gov_provider.verify_aadhaar_offline(token)
            
            # Store verification in vault table (NEVER store Aadhaar number)
            vault_token = gov_result.get("vault_token", "")
            if vault_token and gov_result.get("verified"):
                # Check for duplicate (same Aadhaar verified before)
                is_duplicate = await self.aadhaar_vault.check_duplicate(vault_token)
                if is_duplicate:
                    gov_result["duplicate_detected"] = True
                    # Not necessarily a failure — just flag it
                
                # Store in vault table
                await self.aadhaar_vault.store_verification(
                    user_id=user_id,
                    vault_token=vault_token,
                    verification_source=gov_result.get("source", "UNKNOWN"),
                    verified_name=gov_result.get("name", ""),
                    verified_dob=gov_result.get("dob", ""),
                )
            return gov_result

        elif doc_type == "PASSPORT":
            return await self.gov_provider.verify_passport(doc_number, name, dob)

        elif doc_type == "DL":
            return await self.gov_provider.verify_driving_license(doc_number, name, dob)

        else:
            logger.warning(f"Unknown doc_type '{doc_type}' — skipping gov verification")
            return {
                "verified": False,
                "error": f"Unsupported document type: {doc_type}",
                "source": "NONE",
            }

    @staticmethod
    def _derive_aadhaar_token(name: str) -> str:
        """
        Maps a user's name to their DigiLocker token.
        In production, this would be replaced by the actual OAuth token
        from the DigiLocker redirect callback.
        """
        name_lower = name.strip().lower()

        token_map = {
            "arjun":  "arjun_token",
            "priya":  "priya_token",
            "vikram": "vikram_token",
            "meera":  "meera_token",
            "ahmed":  "ahmed_token",
            "sneha":  "sneha_token",
        }

        for keyword, token in token_map.items():
            if keyword in name_lower:
                return token

        # Default fallback
        return "default_token"

    async def _finalize_session(self, session: KYCSession) -> KYCSession:
        """Persist result to DB and Audit Log."""
        try:
            # Write KYC document record
            doc_record = {
                "user_id": session.user_id,
                "session_id": session.session_id,
                "status": session.current_stage.value if hasattr(session.current_stage, 'value') else str(session.current_stage),
                "risk_score": session.risk_score,
                "face_match_score": session.face_match_score,
                "liveness_score": session.liveness_score,
                "quality_score": session.quality_score,
                "ocr_confidence": session.ocr_data.get("confidence") if session.ocr_data else None,
            }
            
            # If Aadhaar, store vault_token reference (NOT the masked number)
            if session.gov_verification and session.gov_verification.get("vault_token"):
                doc_record["vault_token"] = session.gov_verification["vault_token"]
            
            self.supabase.table("kyc_sessions").upsert(doc_record).execute()
        except Exception as e:
            # Log but don't fail the session
            print(f"Warning: Failed to persist session {session.session_id}: {e}")
        
        return session
