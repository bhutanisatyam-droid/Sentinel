import base64
import re
import requests
from typing import Dict, Any
from app.providers.base import OCRProvider
from app.config import get_settings

class GoogleVisionOCRProvider(OCRProvider):
    """
    Real OCR provider using Google Cloud Vision API.
    Extracts text from PAN, Aadhaar, and DL document images.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.GOOGLE_VISION_API_KEY
        self.endpoint = f"https://vision.googleapis.com/v1/images:annotate?key={self.api_key}"
    
    async def extract_document(self, image_bytes: bytes, doc_type: str) -> Dict[str, Any]:
        """
        Send image to Google Cloud Vision TEXT_DETECTION, then parse
        the returned full text to extract name, DOB, and document number
        based on doc_type.
        """
        # Encode image to base64
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        
        payload = {
            "requests": [{
                "image": {"content": image_b64},
                "features": [
                    {"type": "TEXT_DETECTION", "maxResults": 1},
                    {"type": "DOCUMENT_TEXT_DETECTION", "maxResults": 1}
                ]
            }]
        }
        
        try:
            response = requests.post(self.endpoint, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
        except requests.RequestException as e:
            return {
                "name": "",
                "dob": "",
                "document_number": "",
                "confidence": 0.0,
                "error": f"Google Vision API error: {str(e)}"
            }
        
        # Extract full text
        annotations = result.get("responses", [{}])[0]
        full_text_annotation = annotations.get("fullTextAnnotation", {})
        raw_text = full_text_annotation.get("text", "")
        
        # Get average confidence from pages
        pages = full_text_annotation.get("pages", [])
        avg_confidence = 0.0
        if pages:
            confidences = []
            for page in pages:
                for block in page.get("blocks", []):
                    if "confidence" in block:
                        confidences.append(block["confidence"])
            if confidences:
                avg_confidence = sum(confidences) / len(confidences)
        
        # Also check text annotations for simpler extraction
        text_annotations = annotations.get("textAnnotations", [])
        if not raw_text and text_annotations:
            raw_text = text_annotations[0].get("description", "")
            avg_confidence = 0.85  # Default confidence for text_annotations
        
        # Parse based on document type
        if doc_type == "PAN":
            return self._parse_pan(raw_text, avg_confidence)
        elif doc_type == "AADHAAR":
            return self._parse_aadhaar(raw_text, avg_confidence)
        elif doc_type == "DL":
            return self._parse_dl(raw_text, avg_confidence)
        
        return {
            "name": "",
            "dob": "",
            "document_number": "",
            "confidence": avg_confidence,
            "raw_text": raw_text
        }
    
    def _parse_pan(self, text: str, confidence: float) -> Dict[str, Any]:
        """Extract PAN details from OCR text."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        # Find PAN number: 5 letters + 4 digits + 1 letter
        pan_match = re.search(r"[A-Z]{5}[0-9]{4}[A-Z]", text)
        pan_number = pan_match.group(0) if pan_match else ""
        
        # Find DOB: dd/mm/yyyy or dd-mm-yyyy
        dob_match = re.search(r"(\d{2})[/-](\d{2})[/-](\d{4})", text)
        dob = ""
        if dob_match:
            day, month, year = dob_match.groups()
            dob = f"{year}-{month}-{day}"  # Convert to YYYY-MM-DD
        
        # Find name: typically the line after "Name" or 2nd-3rd line
        name = ""
        for i, line in enumerate(lines):
            # PAN cards have name after the row containing the PAN number
            # or after a line containing "Name"
            if "name" in line.lower() and i + 1 < len(lines):
                name = lines[i + 1].strip()
                break
        
        # Fallback: find the longest all-caps line that isn't the PAN number
        if not name:
            candidates = [
                l for l in lines
                if l.isupper() and len(l) > 3 and not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", l)
                and "INCOME" not in l and "TAX" not in l and "GOVT" not in l
                and "INDIA" not in l and "PERMANENT" not in l and "ACCOUNT" not in l
            ]
            if candidates:
                # Usually the first suitable all-caps line is the father's name,
                # the second is the cardholder's name. Take the last one.
                name = candidates[-1] if len(candidates) >= 2 else candidates[0]
        
        return {
            "name": name,
            "dob": dob,
            "document_number": pan_number,
            "confidence": round(confidence, 3),
            "ocr_engine": "google_vision",
        }
    
    def _parse_aadhaar(self, text: str, confidence: float) -> Dict[str, Any]:
        """
        Extract Aadhaar details from OCR text.
        CRITICAL: We extract name and DOB ONLY. We do NOT extract or return
        the full Aadhaar number. If the OCR picks it up, we mask it immediately.
        """
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        # Find DOB
        dob_match = re.search(r"(\d{2})[/-](\d{2})[/-](\d{4})", text)
        dob = ""
        if dob_match:
            day, month, year = dob_match.groups()
            dob = f"{year}-{month}-{day}"
        
        # Find 12-digit Aadhaar number (ONLY to mask it, never store raw)
        aadhaar_match = re.search(r"(\d{4})\s?(\d{4})\s?(\d{4})", text)
        masked_number = ""
        if aadhaar_match:
            # IMMEDIATELY mask — keep only last 4 for display
            last_four = aadhaar_match.group(3)
            masked_number = f"XXXX-XXXX-{last_four}"
            # The raw number is NEVER stored, returned, or logged
        
        # Find name: first substantial text line before DOB
        name = ""
        for i, line in enumerate(lines):
            if "government" in line.lower() or "भारत" in line:
                continue
            if len(line) > 3 and line[0].isalpha() and not any(c.isdigit() for c in line[:3]):
                name = line
                break
                
        # Address extraction: Aadhaar usually has "Address:" or "To," or ends with a 6-digit PIN
        address = ""
        addr_match = re.search(r"(?:Address|To)[\s:]*([\s\S]*?)(?:(?:[A-Z]{2,}\s)?\d{6}|\Z)", text, re.IGNORECASE)
        if addr_match:
            address = addr_match.group(1).strip()
            # Try to grab the PIN code as well if it's right after
            pin_match = re.search(r"\d{6}", text[addr_match.end(1):])
            if pin_match:
                address += f" {pin_match.group(0)}"
            address = re.sub(r'\n+', ', ', address)
        else:
            # Fallback for Aadhaar backend address, look for lines with commas and digits
            addr_lines = [l for l in lines if ',' in l or re.search(r'\d{6}', l)]
            if addr_lines:
                # Merge consecutive lines
                address = ", ".join(addr_lines)
        
        return {
            "name": name,
            "dob": dob,
            "document_number": masked_number,  # ALWAYS masked, never raw
            "address": address.strip(),
            "confidence": round(confidence, 3),
            "ocr_engine": "google_vision",
        }
    
    def _parse_dl(self, text: str, confidence: float) -> Dict[str, Any]:
        """Extract Driving License details from OCR text."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        # DL number: State code (2 letters) + digits
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
                
        # Address extraction for DL
        address = ""
        addr_match = re.search(r"(?:Add(?:ress)?|Present Address)[\s:]*([\s\S]*?)(?:(?:[A-Z]{2,}\s)?\d{6}|\Z|DOB)", text, re.IGNORECASE)
        if addr_match:
            address = addr_match.group(1).strip()
            address = re.sub(r'\n+', ', ', address)
        
        return {
            "name": name,
            "dob": dob,
            "document_number": dl_number,
            "address": address.strip(),
            "confidence": round(confidence, 3),
            "ocr_engine": "google_vision",
        }
