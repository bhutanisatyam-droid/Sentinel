from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
import os
import importlib
from app.config import get_settings

class OCRProvider(ABC):
    @abstractmethod
    async def extract_document(self, image_bytes: bytes, doc_type: str) -> Dict[str, Any]:
        """Returns: {"name": str, "dob": str, "document_number": str, "confidence": float}"""
        pass

class FaceMatchProvider(ABC):
    @abstractmethod
    async def compare_faces(self, face1_bytes: bytes, face2_bytes: bytes) -> Dict[str, Any]:
        """Returns: {"match": bool, "score": float, "threshold": float}"""
        pass

class LivenessProvider(ABC):
    @abstractmethod
    async def check_liveness(self, frames: List[bytes]) -> Dict[str, Any]:
        """Returns: {"real": bool, "score": float, "method": str}"""
        pass

class GovVerificationProvider(ABC):
    @abstractmethod
    async def verify_pan(self, pan_number: str, name: str) -> Dict[str, Any]:
        """Returns: {"verified": bool, "name_match": bool, "name_on_record": str}"""
        pass
        
    @abstractmethod
    async def verify_aadhaar_offline(self, digilocker_token: str) -> Dict[str, Any]:
        """Returns: {"verified": bool, "vault_token": str, "name": str, "dob": str}"""
        pass

    @abstractmethod
    async def verify_passport(self, passport_number: str, name: str, dob: str) -> Dict[str, Any]:
        """
        Verify passport against government records.
        Returns: {
            "verified": bool,
            "name_match": bool,
            "name_on_record": str,
            "name_match_score": int,
            "dob_match": bool,
            "nationality": str,
            "status": str,       # "ACTIVE" | "EXPIRED" | "NOT_FOUND" | "INVALID_FORMAT"
            "source": str,       # e.g. "PASSPORT_SEVA_SANDBOX"
            "response_time_ms": int
        }
        """
        pass

    @abstractmethod
    async def verify_driving_license(self, dl_number: str, name: str, dob: str) -> Dict[str, Any]:
        """
        Verify driving license against government records (Parivahan/VAHAN).
        Returns: {
            "verified": bool,
            "name_match": bool,
            "name_on_record": str,
            "name_match_score": int,
            "dob_match": bool,
            "dl_status": str,        # "ACTIVE" | "EXPIRED" | "SUSPENDED" | "NOT_FOUND" | "INVALID_FORMAT"
            "issuing_authority": str, # e.g. "RTO Mumbai"
            "source": str,           # e.g. "PARIVAHAN_SANDBOX"
            "response_time_ms": int
        }
        """
        pass

    @abstractmethod
    async def verify_secondary_document(self, doc_type: str, doc_number: str,
            name: str, dob: str = None) -> Dict[str, Any]:
        """Verify Aadhaar/Passport/DL as secondary document.
        Returns: {"verified": bool, "vault_token": str, "name": str, "dob": str,
                  "verification_source": str, "verification_id": str}"""
        pass

class SanctionsProvider(ABC):
    @abstractmethod
    async def screen_entity(self, name: str, dob: Optional[str] = None, nationality: Optional[str] = None) -> Dict[str, Any]:
        """Returns: {"hit": bool, "matches": list[dict], "highest_score": float}"""
        pass

class LLMProvider(ABC):
    @abstractmethod
    async def generate_alert_summary(self, alert_context: Dict[str, Any]) -> str:
        """Returns: professional AML summary string"""
        pass

    @abstractmethod
    async def generate_kyc_rejection_explanation(self, match_score: float) -> str:
        """Returns: user-friendly rejection reasoning based on low face match score"""
        pass

def get_provider(provider_class: type):
    mapping = {
        SanctionsProvider: ("app.providers.opensanctions", "OpenSanctionsProvider"),
        LLMProvider: ("app.providers.groq_llm", "GroqLLMProvider"),
        OCRProvider: ("app.providers.azure_vision_ocr", "AzureVisionOCRProvider"),
        GovVerificationProvider: ("app.providers.hybrid_gov", "HybridGovVerificationProvider"),
        FaceMatchProvider: ("app.providers.face_match", "DeepFaceMatchProvider"),
        LivenessProvider: ("app.providers.liveness", "BasicLivenessProvider"),
    }

    if provider_class not in mapping:
        raise ValueError(f"No implementation registered for {provider_class.__name__}")

    module_path, class_name = mapping[provider_class]
    
    try:
        module = importlib.import_module(module_path)
        cls = getattr(module, class_name)
        return cls()
    except (ImportError, AttributeError) as e:
        # If real provider fails (e.g. missing dependency), we might want to fail hard or fallback
        # For this directive, we just raise
        raise ImportError(f"Could not load provider {class_name} from {module_path}: {e}")
