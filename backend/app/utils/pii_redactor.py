import re
from typing import Dict, Any, List, Optional
import copy

# Regex Patterns for Indian PII
PII_PATTERNS = {
    "PAN": r"[A-Z]{5}[0-9]{4}[A-Z]",
    "AADHAAR": r"[2-9]\d{3}\s?\d{4}\s?\d{4}",
    "PHONE": r"(?:\+91)?\d{10}",
    "EMAIL": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    "IFSC": r"[A-Z]{4}0[A-Z0-9]{6}",
    "ACCOUNT": r"\d{9,18}"
}

# Module-level state for redaction mapping
_redaction_map: Dict[str, str] = {}
_entity_counter: int = 0

def _get_next_entity_token() -> str:
    global _entity_counter
    _entity_counter += 1
    return f"ENTITY_{_entity_counter:03d}"

def redact_for_llm(text: str, known_names: List[str] = None) -> str:
    """
    Redacts PII from text destined for LLM processing.
    Replaces sensitive entities with consistent tokens to preserve context.
    """
    redacted_text = text
    
    # 1. Redact Known Names
    if known_names:
        sorted_names = sorted(known_names, key=len, reverse=True)
        for name in sorted_names:
            if name not in _redaction_map:
                token = _get_next_entity_token()
                _redaction_map[name] = token
            
            token = _redaction_map[name]
            pattern = re.compile(re.escape(name), re.IGNORECASE)
            redacted_text = pattern.sub(token, redacted_text)

    # 2. Redact specific patterns
    # Phone first to avoid partial matches with other tokens or numbers
    redacted_text = re.sub(PII_PATTERNS["PHONE"], "[PHONE_REDACTED]", redacted_text)
    
    redacted_text = re.sub(PII_PATTERNS["EMAIL"], "[EMAIL_REDACTED]", redacted_text)
    redacted_text = re.sub(PII_PATTERNS["PAN"], "[PAN_REDACTED]", redacted_text)
    redacted_text = re.sub(PII_PATTERNS["AADHAAR"], "[AADHAAR_REDACTED]", redacted_text)
    redacted_text = re.sub(PII_PATTERNS["IFSC"], "[IFSC_REDACTED]", redacted_text)
    redacted_text = re.sub(PII_PATTERNS["ACCOUNT"], "[ACCOUNT_REDACTED]", redacted_text)
    
    return redacted_text

def redact_for_logs(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Redacts sensitive keys in a dictionary for safe logging.
    """
    sensitive_keys = {
        "aadhaar", "pan", "phone", "mobile", "email", "name", "dob", 
        "address", "password", "token", "secret", "account_number"
    }
    
    redacted_data = copy.deepcopy(data)
    
    def _recruit_scan(obj: Any):
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k.lower() in sensitive_keys:
                    if isinstance(v, str) and len(v) > 4:
                        obj[k] = f"{v[:2]}***{v[-2:]}"
                    elif isinstance(v, str):
                        obj[k] = "***"
                    elif v is not None: 
                        obj[k] = "***"
                else:
                    _recruit_scan(v)
        elif isinstance(obj, list):
            for item in obj:
                _recruit_scan(item)

    _recruit_scan(redacted_data)
    return redacted_data

def get_redaction_map() -> Dict[str, str]:
    return _redaction_map.copy()

def reset_redaction_map():
    global _redaction_map, _entity_counter
    _redaction_map = {}
    _entity_counter = 0
