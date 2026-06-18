"""
Tesseract OCR Fallback Provider.

Used when Google Vision API is unavailable (quota, network, key issues).
Runs entirely offline using pytesseract + OpenCV preprocessing.

Confidence is computed from Tesseract's per-word confidence scores (0-100).
"""
import re
import cv2
import numpy as np
import pytesseract
from typing import Dict, Any
from app.providers.base import OCRProvider
import logging

logger = logging.getLogger(__name__)


class TesseractOCRProvider(OCRProvider):
    """
    Offline OCR fallback using Tesseract.
    Applies adaptive preprocessing for Indian ID documents.
    """

    def __init__(self):
        import os
        # Auto-detect Tesseract on Windows
        cmd = os.environ.get("TESSERACT_CMD")
        if cmd:
            pytesseract.pytesseract.tesseract_cmd = cmd
        else:
            # Check default Windows install paths
            default_paths = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
                r"C:\Users\{}\AppData\Local\Programs\Tesseract-OCR\tesseract.exe".format(
                    os.environ.get("USERNAME", "")
                ),
            ]
            for path in default_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    logger.info(f"Tesseract found at: {path}")
                    break
            else:
                logger.warning(
                    "Tesseract binary not found. Install from: "
                    "https://github.com/UB-Mannheim/tesseract/wiki or "
                    "run: winget install UB-Mannheim.TesseractOCR"
                )

    async def extract_document(self, image_bytes: bytes, doc_type: str) -> Dict[str, Any]:
        """
        Preprocess image with OpenCV, run Tesseract OCR, parse fields.
        """
        try:
            # Decode image
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return self._error_result("Could not decode image")

            # Preprocess for better OCR accuracy on ID cards
            processed = self._preprocess(img)

            # Run Tesseract with word-level confidence data
            ocr_data = pytesseract.image_to_data(
                processed, lang="eng", output_type=pytesseract.Output.DICT
            )

            # Compute confidence from word-level scores
            confidences = [
                int(c) for c in ocr_data.get("conf", [])
                if str(c).lstrip("-").isdigit() and int(c) > 0
            ]
            avg_confidence = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.0

            # Get full text
            raw_text = pytesseract.image_to_string(processed, lang="eng")
            logger.info(f"Tesseract fallback OCR for {doc_type}, confidence={avg_confidence:.3f}")

            # Parse based on document type
            if doc_type == "PAN":
                result = self._parse_pan(raw_text, avg_confidence)
            elif doc_type == "AADHAAR":
                result = self._parse_aadhaar(raw_text, avg_confidence)
            elif doc_type == "DL":
                result = self._parse_dl(raw_text, avg_confidence)
            else:
                result = {
                    "name": "",
                    "dob": "",
                    "document_number": "",
                    "confidence": avg_confidence,
                }

            result["ocr_engine"] = "tesseract_fallback"
            return result

        except Exception as e:
            logger.error(f"Tesseract OCR failed: {e}")
            return self._error_result(f"Tesseract OCR error: {str(e)}")

    def _preprocess(self, img: np.ndarray) -> np.ndarray:
        """
        Adaptive preprocessing pipeline for Indian ID documents:
        1. Resize to standard width (keeps aspect ratio)
        2. Convert to grayscale
        3. Adaptive threshold (handles uneven lighting on ID cards)
        4. Denoise
        """
        # Resize to ~1200px wide for consistent OCR
        h, w = img.shape[:2]
        if w < 800:
            scale = 1200 / w
            img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Adaptive threshold — works better than global for ID cards with
        # holograms, watermarks, and uneven lighting
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 31, 10
        )

        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh, h=10)

        return denoised

    def _parse_pan(self, text: str, confidence: float) -> Dict[str, Any]:
        """Extract PAN details from OCR text."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        pan_match = re.search(r"[A-Z]{5}[0-9]{4}[A-Z]", text)
        pan_number = pan_match.group(0) if pan_match else ""

        dob_match = re.search(r"(\d{2})[/-](\d{2})[/-](\d{4})", text)
        dob = ""
        if dob_match:
            day, month, year = dob_match.groups()
            dob = f"{year}-{month}-{day}"

        name = ""
        for i, line in enumerate(lines):
            if "name" in line.lower() and i + 1 < len(lines):
                name = lines[i + 1].strip()
                break
        if not name:
            candidates = [
                l for l in lines
                if l.isupper() and len(l) > 3 and not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", l)
                and "INCOME" not in l and "TAX" not in l and "GOVT" not in l
                and "INDIA" not in l and "PERMANENT" not in l and "ACCOUNT" not in l
            ]
            if candidates:
                name = candidates[-1] if len(candidates) >= 2 else candidates[0]

        return {
            "name": name,
            "dob": dob,
            "document_number": pan_number,
            "confidence": round(confidence, 3),
        }

    def _parse_aadhaar(self, text: str, confidence: float) -> Dict[str, Any]:
        """
        Extract Aadhaar details from OCR text.
        CRITICAL: Same masking rules as Google Vision — never store raw number.
        """
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        dob_match = re.search(r"(\d{2})[/-](\d{2})[/-](\d{4})", text)
        dob = ""
        if dob_match:
            day, month, year = dob_match.groups()
            dob = f"{year}-{month}-{day}"

        # Find and IMMEDIATELY mask the Aadhaar number
        aadhaar_match = re.search(r"(\d{4})\s?(\d{4})\s?(\d{4})", text)
        masked_number = ""
        if aadhaar_match:
            last_four = aadhaar_match.group(3)
            masked_number = f"XXXX-XXXX-{last_four}"
            # Raw number is NEVER stored, returned, or logged

        name = ""
        for line in lines:
            if "government" in line.lower() or "भारत" in line:
                continue
            if len(line) > 3 and line[0].isalpha() and not any(c.isdigit() for c in line[:3]):
                name = line
                break

        return {
            "name": name,
            "dob": dob,
            "document_number": masked_number,  # ALWAYS masked
            "confidence": round(confidence, 3),
        }

    def _parse_dl(self, text: str, confidence: float) -> Dict[str, Any]:
        """Extract Driving License details from OCR text."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        dl_match = re.search(r"[A-Z]{2}\d{2}\s?\d{4,}", text)
        dl_number = dl_match.group(0).replace(" ", "") if dl_match else ""

        dob_match = re.search(r"(\d{2})[/-](\d{2})[/-](\d{4})", text)
        dob = ""
        if dob_match:
            day, month, year = dob_match.groups()
            dob = f"{year}-{month}-{day}"

        name = ""
        for line in lines:
            if "name" in line.lower() and ":" in line:
                name = line.split(":", 1)[1].strip()
                break

        return {
            "name": name,
            "dob": dob,
            "document_number": dl_number,
            "confidence": round(confidence, 3),
        }

    def _error_result(self, error_msg: str) -> Dict[str, Any]:
        return {
            "name": "",
            "dob": "",
            "document_number": "",
            "confidence": 0.0,
            "error": error_msg,
            "ocr_engine": "tesseract_fallback",
        }
