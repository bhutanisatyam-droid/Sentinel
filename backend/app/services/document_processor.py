"""
Document Processor with Cross-Document Verification.

Three capabilities:
1. Single document processing (quality → OCR → format validation) — EXISTING
2. Cross-document verification (PAN OCR vs secondary doc OCR) — NEW
3. OCR-to-Gov verification (what OCR extracted vs what govt DB says) — NEW

Cross-verification catches:
- Forged documents (name on uploaded PAN ≠ name NSDL has on file)
- Tampered documents (valid PAN number but name swapped)
- Multi-identity fraud (PAN says "Arjun" but Aadhaar says "Vikram")
- OCR errors (low confidence extraction led to wrong data)
"""

from app.providers.base import get_provider, OCRProvider
from typing import Dict, Any, Tuple
import re
import cv2
import numpy as np
from datetime import datetime
from fuzzywuzzy import fuzz
import logging

logger = logging.getLogger(__name__)

# Minimum confidence threshold — below this, we try the fallback engine
MIN_CONFIDENCE_THRESHOLD = 0.3


class DocumentProcessor:
    def __init__(self):
        self.ocr_provider: OCRProvider = get_provider(OCRProvider)
        self.fallback_provider: OCRProvider = None
        # Lazily load Tesseract fallback (only if needed)
        try:
            from app.providers.tesseract_ocr import TesseractOCRProvider
            self.fallback_provider = TesseractOCRProvider()
            logger.info("Tesseract OCR fallback loaded successfully")
        except Exception as e:
            logger.warning(f"Tesseract fallback unavailable: {e}")

    # ================================================================
    # SINGLE DOCUMENT PROCESSING — with fallback chain
    # ================================================================

    async def process_document(self, image_bytes: bytes, doc_type: str) -> Dict[str, Any]:
        """
        Runs quality check, OCR extraction (with fallback), and regex validation.
        
        OCR Chain:
          1. Google Vision API (primary)
          2. If error or confidence < 0.3 → Tesseract (fallback)
        """
        quality_score, quality_error = self._check_quality(image_bytes)
        if quality_error:
            return {"error": quality_error, "quality_score": quality_score}

        # PRIMARY: Azure Vision
        ocr_result = await self.ocr_provider.extract_document(image_bytes, doc_type)
        ocr_result.setdefault("ocr_engine", "azure_vision")

        # Check if primary failed or returned very low confidence
        primary_failed = (
            ocr_result.get("error")
            or ocr_result.get("confidence", 0) < MIN_CONFIDENCE_THRESHOLD
        )

        if primary_failed and self.fallback_provider:
            logger.warning(
                f"Primary OCR failed or low confidence ({ocr_result.get('confidence', 0):.2f}). "
                f"Falling back to Tesseract..."
            )
            fallback_result = await self.fallback_provider.extract_document(image_bytes, doc_type)
            fallback_result.setdefault("ocr_engine", "tesseract_fallback")

            # Use fallback if it's better
            fallback_conf = fallback_result.get("confidence", 0)
            primary_conf = ocr_result.get("confidence", 0)

            if fallback_conf > primary_conf or ocr_result.get("error"):
                logger.info(
                    f"Using Tesseract result (conf={fallback_conf:.3f}) "
                    f"over Azure Vision (conf={primary_conf:.3f})"
                )
                ocr_result = fallback_result
            else:
                logger.info(
                    f"Keeping Azure Vision result (conf={primary_conf:.3f}) "
                    f"over Tesseract (conf={fallback_conf:.3f})"
                )

        ocr_result["quality_score"] = quality_score

        validation_error = self._validate_format(ocr_result, doc_type)
        if validation_error:
            ocr_result["validation_error"] = validation_error
            ocr_result["format_valid"] = False
        else:
            ocr_result["format_valid"] = True

        return ocr_result

    def _check_quality(self, image_bytes: bytes) -> Tuple[float, str]:
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            if img is None:
                return 0.0, "Could not decode image"
            height, width = img.shape
            if height < 480 or width < 640:
                return 0.0, f"Image dimensions too small ({width}x{height}), min 640x480 required"
            variance = cv2.Laplacian(img, cv2.CV_64F).var()
            score = min(100.0, variance / 5.0)
            if variance < 100:
                return score, "Image too blurry"
            return score, ""
        except Exception as e:
            return 0.0, f"Quality check failed: {str(e)}"

    def _validate_format(self, data: Dict[str, Any], doc_type: str) -> str:
        doc_number = data.get("document_number", "").replace(" ", "").replace("-", "")
        if doc_type == "PAN":
            if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", doc_number):
                return "Invalid PAN format"
        elif doc_type == "DL":
            if not re.match(r"^[A-Z]{2}\d{2,}", doc_number):
                return "Invalid DL format (State code missing)"
        elif doc_type == "PASSPORT":
            if not re.match(r"^[A-Z][0-9]{7}$", doc_number):
                return "Invalid Passport format"
        return ""

    # ================================================================
    # CROSS-DOCUMENT VERIFICATION: PRIMARY vs SECONDARY OCR data
    # ================================================================

    def cross_verify_documents(
        self,
        primary_ocr: Dict[str, Any],
        secondary_ocr: Dict[str, Any],
        primary_doc_type: str = "PAN",
        secondary_doc_type: str = "AADHAAR",
    ) -> Dict[str, Any]:
        """
        Cross-verifies PRIMARY document OCR data against SECONDARY document OCR data.

        Uses fuzzywuzzy token_sort_ratio with threshold 85 per Roast v3:
        "Not 90% — 90% causes false rejections for 'MOHAMMED' vs 'MOHAMMAD'."

        Catches: multi-identity fraud, document swaps, OCR extraction errors.
        """
        checks = []
        discrepancies = []

        # ── NAME ───────────────────────────────────────────────────
        name1 = primary_ocr.get("name", "").strip().upper()
        name2 = secondary_ocr.get("name", "").strip().upper()
        name_score = fuzz.token_sort_ratio(name1, name2) if (name1 and name2) else 0
        name_match = name_score >= 85

        checks.append({
            "field": "name", "primary_value": name1, "secondary_value": name2,
            "match": name_match, "score": name_score,
            "method": "fuzzywuzzy_token_sort_ratio", "threshold": 85,
        })
        if not name_match and name1 and name2:
            discrepancies.append(
                f"Name mismatch: {primary_doc_type} has '{name1}', "
                f"{secondary_doc_type} has '{name2}' (similarity: {name_score}%)"
            )

        # ── DOB ────────────────────────────────────────────────────
        dob1 = primary_ocr.get("dob", "").strip()
        dob2 = secondary_ocr.get("dob", "").strip()
        dob_match = (dob1 == dob2) if (dob1 and dob2) else False

        checks.append({
            "field": "dob", "primary_value": dob1, "secondary_value": dob2,
            "match": dob_match, "score": 100 if dob_match else 0,
            "method": "exact_match", "threshold": 100,
        })
        if not dob_match and dob1 and dob2:
            discrepancies.append(
                f"DOB mismatch: {primary_doc_type} has '{dob1}', "
                f"{secondary_doc_type} has '{dob2}'"
            )

        # ── VERDICT ────────────────────────────────────────────────
        all_passed = all(c["match"] for c in checks)
        confidence = sum(c["score"] for c in checks) / len(checks) if checks else 0

        return {
            "cross_verified": all_passed,
            "confidence": round(confidence, 1),
            "primary_doc_type": primary_doc_type,
            "secondary_doc_type": secondary_doc_type,
            "checks": checks,
            "discrepancies": discrepancies,
            "verdict": "MATCH" if all_passed else "DISCREPANCY_FOUND",
            "timestamp": datetime.utcnow().isoformat(),
        }

    # ================================================================
    # OCR vs GOV DB VERIFICATION: catches forged documents
    # ================================================================

    def verify_ocr_against_gov(
        self,
        ocr_data: Dict[str, Any],
        gov_response: Dict[str, Any],
        doc_type: str = "PAN",
    ) -> Dict[str, Any]:
        """
        Compares what OCR extracted from the document image against
        what the government database returned for that document number.

        Catches:
        - Forged documents (OCR name ≠ NSDL name for that PAN)
        - Tampered documents (valid PAN number, but name was swapped)
        - OCR errors (low-confidence extraction led to wrong data)
        """
        checks = []
        discrepancies = []

        # ── NAME: OCR vs Gov DB ────────────────────────────────────
        ocr_name = ocr_data.get("name", "").strip().upper()
        gov_name = gov_response.get("name_on_record", "").strip().upper()
        # Aadhaar response uses "name" not "name_on_record"
        if not gov_name:
            gov_name = gov_response.get("name", "").strip().upper()

        name_score = fuzz.token_sort_ratio(ocr_name, gov_name) if (ocr_name and gov_name) else 0
        name_match = name_score >= 85

        checks.append({
            "field": "name", "ocr_value": ocr_name, "gov_value": gov_name,
            "match": name_match, "score": name_score,
            "method": "fuzzywuzzy_token_sort_ratio", "threshold": 85,
        })
        if not name_match and ocr_name and gov_name:
            discrepancies.append(
                f"FORGERY RISK: OCR extracted '{ocr_name}' from document, but "
                f"{doc_type} gov DB has '{gov_name}' on file (similarity: {name_score}%)"
            )

        # ── DOB: OCR vs Gov DB (if available) ──────────────────────
        ocr_dob = ocr_data.get("dob", "").strip()
        gov_dob = gov_response.get("dob", "").strip()

        if ocr_dob and gov_dob:
            dob_match = ocr_dob == gov_dob
            checks.append({
                "field": "dob", "ocr_value": ocr_dob, "gov_value": gov_dob,
                "match": dob_match, "score": 100 if dob_match else 0,
                "method": "exact_match", "threshold": 100,
            })
            if not dob_match:
                discrepancies.append(
                    f"DOB inconsistency: OCR='{ocr_dob}' vs GovDB='{gov_dob}' for {doc_type}"
                )

        # ── VERDICT ────────────────────────────────────────────────
        all_passed = all(c["match"] for c in checks)
        confidence = sum(c["score"] for c in checks) / len(checks) if checks else 0

        return {
            "ocr_gov_verified": all_passed,
            "confidence": round(confidence, 1),
            "doc_type": doc_type,
            "checks": checks,
            "discrepancies": discrepancies,
            "verdict": "CONSISTENT" if all_passed else "INCONSISTENCY_DETECTED",
            "risk_flag": not all_passed,
            "timestamp": datetime.utcnow().isoformat(),
        }
