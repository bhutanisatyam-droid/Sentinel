import base64
import re
import requests
import time
from typing import Dict, Any
from app.providers.base import OCRProvider
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)

class AzureVisionOCRProvider(OCRProvider):
    """
    Real OCR provider using Microsoft Azure Computer Vision Read API (v3.2).
    Extracts text from PAN, Aadhaar, and DL document images.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.AZURE_VISION_API_KEY
        # Ensure endpoint doesn't have a trailing slash
        endpoint_base = self.settings.AZURE_VISION_ENDPOINT.rstrip('/')
        
        # We use the async Read API for better OCR on dense text (documents)
        self.read_api_url = f"{endpoint_base}/vision/v3.2/read/analyze"
        
        self.headers = {
            'Ocp-Apim-Subscription-Key': self.api_key,
            'Content-Type': 'application/octet-stream'
        }
    
    async def extract_document(self, image_bytes: bytes, doc_type: str) -> Dict[str, Any]:
        """
        Send image to Azure Computer Vision Read API, poll for the result,
        then parse the returned full text.
        """
        if not self.api_key or not self.settings.AZURE_VISION_ENDPOINT:
            return self._error_response("Azure Computer Vision credentials not configured in .env")

        try:
            # 1. Submit image for analysis
            response = requests.post(self.read_api_url, headers=self.headers, data=image_bytes, timeout=10)
            response.raise_for_status()
            
            # The Read API is async; it returns an operation location header
            operation_url = response.headers.get("Operation-Location")
            if not operation_url:
                raise ValueError("No Operation-Location header returned from Azure")
            
            # 2. Poll for the result
            poll_headers = {'Ocp-Apim-Subscription-Key': self.api_key}
            max_retries = 10
            poll_interval = 1.0 # seconds
            
            for _ in range(max_retries):
                time.sleep(poll_interval)
                poll_response = requests.get(operation_url, headers=poll_headers, timeout=10)
                poll_response.raise_for_status()
                result_json = poll_response.json()
                
                status = result_json.get("status")
                if status == "succeeded":
                    return self._process_azure_result(result_json, doc_type)
                elif status == "failed":
                    return self._error_response("Azure OCR operation failed on the server")
                # else "running" or "notStarted", keep polling
                
            return self._error_response("Azure OCR polling timed out")
            
        except requests.RequestException as e:
            logger.error(f"Azure Vision API request error: {e}")
            return self._error_response(f"Azure Vision API error: {str(e)}")
        except Exception as e:
            logger.error(f"Azure Vision parsing error: {e}")
            return self._error_response(f"Failed to process Azure OCR result: {str(e)}")

    def _error_response(self, message: str) -> Dict[str, Any]:
        return {
            "name": "",
            "dob": "",
            "document_number": "",
            "address": "",
            "confidence": 0.0,
            "error": message
        }

    def _process_azure_result(self, result_json: Dict[str, Any], doc_type: str) -> Dict[str, Any]:
        """Extract text and confidence from Azure's Read API json response."""
        read_results = result_json.get("analyzeResult", {}).get("readResults", [])
        
        lines = []
        confidences = []
        
        for page in read_results:
            for line in page.get("lines", []):
                text = line.get("text", "")
                if text:
                    lines.append(text)
                # Word-level confidence is available in Azure Read API
                for word in line.get("words", []):
                    if "confidence" in word:
                        confidences.append(word["confidence"])
        
        avg_confidence = (sum(confidences) / len(confidences)) if confidences else 0.85
        raw_text = "\n".join(lines)
        
        if doc_type == "PAN":
            return self._parse_pan(raw_text, lines, avg_confidence)
        elif doc_type == "AADHAAR":
            return self._parse_aadhaar(raw_text, lines, avg_confidence)
        elif doc_type == "DL":
            return self._parse_dl(raw_text, lines, avg_confidence)
            
        return {
            "name": "", "dob": "", "document_number": "",
            "confidence": avg_confidence, "raw_text": raw_text
        }

    # =========================================================================
    # PARSING LOGIC (Mirroring existing structure but using list of lines)
    # =========================================================================
    
    def _parse_pan(self, text: str, lines: list, confidence: float) -> Dict[str, Any]:
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
            "address": "Not present on PAN",
            "confidence": round(confidence, 3),
            "ocr_engine": "azure_vision",
        }
        
    def _parse_aadhaar(self, text: str, lines: list, confidence: float) -> Dict[str, Any]:
        dob_match = re.search(r"(\d{2})[/-](\d{2})[/-](\d{4})", text)
        dob = ""
        if dob_match:
            day, month, year = dob_match.groups()
            dob = f"{year}-{month}-{day}"
            
        aadhaar_match = re.search(r"(\d{4})\s?(\d{4})\s?(\d{4})", text)
        masked_number = ""
        if aadhaar_match:
            last_four = aadhaar_match.group(3)
            masked_number = f"XXXX-XXXX-{last_four}"
            
        name = ""
        for i, line in enumerate(lines):
            if "government" in line.lower() or "भारत" in line:
                continue
            if len(line) > 3 and line[0].isalpha() and not any(c.isdigit() for c in line[:3]):
                name = line
                break
                
        # Address extraction — Aadhaar back side
        address = ""
        # Try "Address:" marker first
        addr_match = re.search(r"(?:Address)[\s:]+([\s\S]*?)(?:\d{6})", text, re.IGNORECASE)
        if addr_match:
            address = addr_match.group(1).strip()
            pin_match = re.search(r"\d{6}", text[addr_match.start():])
            if pin_match:
                address += f" {pin_match.group(0)}"
        else:
            # Try S/O or C/O pattern (common on Aadhaar)
            so_match = re.search(r"(?:S/O|C/O|D/O|W/O)[:\s]*([\s\S]*?)(?:\d{6})", text, re.IGNORECASE)
            if so_match:
                address = so_match.group(0).strip()
                pin_match = re.search(r"\d{6}", text[so_match.end()-6:])
                if pin_match:
                    address = address.rstrip() 
            else:
                # Fallback: lines containing commas or 6-digit PIN codes
                addr_lines = [l for l in lines if ',' in l or re.search(r'\d{6}', l)]
                if addr_lines:
                    address = ", ".join(addr_lines)
        
        # Clean up newlines and extra whitespace
        address = re.sub(r'\n+', ', ', address)
        address = re.sub(r'\s{2,}', ' ', address).strip()

        return {
            "name": name,
            "dob": dob,
            "document_number": masked_number,
            "address": address,
            "confidence": round(confidence, 3),
            "ocr_engine": "azure_vision",
        }
        
    def _parse_dl(self, text: str, lines: list, confidence: float) -> Dict[str, Any]:
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
            "ocr_engine": "azure_vision",
        }
