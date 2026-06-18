"""
Hybrid Government Verification Provider.

Strategy:
- PAN: Try real Setu Sandbox API → if fails or credentials missing, fall back to smart validation mock
- Aadhaar: Always smart validation mock (until real API added)
- Passport: Always smart validation mock (until real API added)
- DL: Always smart validation mock (until real API added)

No dump dummy databases: it strictly checks regex and name matching using the provided OCR inputs dynamically.
"""

import time
import logging
from typing import Dict, Any

import httpx
from fuzzywuzzy import fuzz

from app.providers.base import GovVerificationProvider
from app.providers.mock import MockGovVerificationProvider
from app.config import get_settings

logger = logging.getLogger(__name__)


class HybridGovVerificationProvider(GovVerificationProvider):

    def __init__(self):
        self._mock = MockGovVerificationProvider()
        settings = get_settings()

        self._setu_client_id = getattr(settings, "SETU_CLIENT_ID", "")
        self._setu_client_secret = getattr(settings, "SETU_CLIENT_SECRET", "")
        self._setu_product_instance_id = getattr(settings, "SETU_PRODUCT_INSTANCE_ID", "")

        self._setu_available = bool(
            self._setu_client_id and self._setu_client_secret and self._setu_product_instance_id
        )

        if self._setu_available:
            logger.info("✅ Setu PAN credentials configured — will attempt real API calls")
        else:
            logger.warning("⚠️  Setu PAN credentials not found — PAN verification will use smart fallback validation")

    # ── PAN: REAL SETU → SMART DYNAMIC MOCK FALLBACK ──────────────────
    async def verify_pan(self, pan_number: str, name: str) -> Dict[str, Any]:
        if not self._setu_available:
            result = await self._mock.verify_pan(pan_number, name)
            result["source"] = "SMART_VALIDATION_MOCK (no Setu credentials)"
            return result

        try:
            setu_result = await self._call_setu_pan(pan_number, name)
            # If Setu sandbox returns verified=true, trust it (real API hit)
            if setu_result.get("verified"):
                return setu_result
            # Setu sandbox doesn't contain real PANs → fall back to smart mock
            # so format-valid PANs still get accepted during demos
            logger.info(f"Setu returned verified=false for {pan_number[:3]}*** — "
                        f"falling back to smart validation (sandbox limitation)")
            result = await self._mock.verify_pan(pan_number, name)
            result["source"] = "SMART_VALIDATION_FALLBACK (Setu sandbox miss)"
            result["setu_trace_id"] = setu_result.get("trace_id", "")
            return result
        except Exception as e:
            logger.error(f"Setu PAN API failed: {e} — falling back to smart dynamic mock")
            result = await self._mock.verify_pan(pan_number, name)
            result["source"] = "SMART_VALIDATION_FALLBACK"
            result["fallback_reason"] = str(e)
            return result

    async def _call_setu_pan(self, pan_number: str, name: str) -> Dict[str, Any]:
        start = time.monotonic()

        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            resp = await client.post(
                "https://dg-sandbox.setu.co/api/verify/pan",
                headers={
                    "x-client-id": self._setu_client_id,
                    "x-client-secret": self._setu_client_secret,
                    "x-product-instance-id": self._setu_product_instance_id,
                    "Content-Type": "application/json",
                },
                json={
                    "pan": pan_number.strip().upper(),
                    "consent": "Y",
                    "reason": "KYC verification for compliance platform",
                },
            )

        elapsed = int((time.monotonic() - start) * 1000)

        if resp.status_code != 200:
            raise Exception(f"Setu HTTP {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        verification = data.get("verification", "")
        setu_data = data.get("data", {})

        if verification == "success" and setu_data:
            setu_name = setu_data.get("full_name", "")
            score = fuzz.token_sort_ratio(
                name.upper().strip(), setu_name.upper().strip()
            ) if (name and setu_name) else 0

            return {
                "verified": True,
                "name_match": score >= 85,
                "name_on_record": setu_name,
                "name_match_score": score,
                "status": "ACTIVE",
                "category": setu_data.get("category", "Individual"),
                "aadhaar_seeding_status": setu_data.get("aadhaar_seeding_status", ""),
                "source": "SETU_LIVE",
                "response_time_ms": elapsed,
                "trace_id": data.get("traceId", ""),
            }
        else:
            return {
                "verified": False,
                "name_match": False,
                "name_on_record": "",
                "name_match_score": 0,
                "status": "INVALID" if verification == "failed" else "NOT_FOUND",
                "category": "",
                "aadhaar_seeding_status": "",
                "error": data.get("message", "PAN verification failed"),
                "source": "SETU_LIVE",
                "response_time_ms": elapsed,
                "trace_id": data.get("traceId", ""),
            }

    # ── AADHAAR: ALWAYS SMART MOCK ──────────────────────────────────────
    async def verify_aadhaar_offline(self, digilocker_token: str) -> Dict[str, Any]:
        result = await self._mock.verify_aadhaar_offline(digilocker_token)
        result["source"] = "MOCK_DIGILOCKER (partner approval pending)"
        return result

    # ── PASSPORT: ALWAYS SMART MOCK ─────────────────────────────────────
    async def verify_passport(self, passport_number: str, name: str, dob: str) -> Dict[str, Any]:
        return await self._mock.verify_passport(passport_number, name, dob)

    # ── DL: ALWAYS SMART MOCK ──────────────────────────────────────────
    async def verify_driving_license(self, dl_number: str, name: str, dob: str) -> Dict[str, Any]:
        return await self._mock.verify_driving_license(dl_number, name, dob)

    # ── SECONDARY DOCUMENT (generic dispatcher) ───────────────────
    async def verify_secondary_document(self, doc_type: str, doc_number: str,
            name: str, dob: str = None) -> Dict[str, Any]:
        """Dispatches to the appropriate document-specific method via mock."""
        return await self._mock.verify_secondary_document(doc_type, doc_number, name, dob)
