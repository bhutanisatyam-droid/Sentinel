from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime

class KYCStage(Enum):
    INITIATED = "INITIATED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    QUALITY_CHECKED = "QUALITY_CHECKED"
    OCR_EXTRACTED = "OCR_EXTRACTED"
    FORMAT_VALIDATED = "FORMAT_VALIDATED"
    LIVENESS_PASSED = "LIVENESS_PASSED"
    FACE_MATCHED = "FACE_MATCHED"
    GOV_DB_VERIFIED = "GOV_DB_VERIFIED"
    SANCTIONS_SCREENED = "SANCTIONS_SCREENED"
    RISK_SCORED = "RISK_SCORED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REQUIRES_MANUAL_REVIEW = "REQUIRES_MANUAL_REVIEW"

@dataclass
class KYCSession:
    session_id: str
    user_id: str
    current_stage: KYCStage = KYCStage.INITIATED
    quality_score: Optional[float] = None
    ocr_data: Optional[Dict[str, Any]] = None
    format_valid: Optional[bool] = None
    liveness_score: Optional[float] = None
    face_match_score: Optional[float] = None
    gov_verification: Optional[Dict[str, Any]] = None
    sanctions_result: Optional[Dict[str, Any]] = None
    risk_score: Optional[int] = None
    risk_reasons: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    retry_count: int = 0
    max_retries: int = 3
    started_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    completed_at: Optional[str] = None

# valid transitions mapping (from -> [allowed_next_stages])
VALID_TRANSITIONS = {
    KYCStage.INITIATED: [KYCStage.DOCUMENT_UPLOADED, KYCStage.FAILED],
    KYCStage.DOCUMENT_UPLOADED: [KYCStage.QUALITY_CHECKED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.QUALITY_CHECKED: [KYCStage.OCR_EXTRACTED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.OCR_EXTRACTED: [KYCStage.FORMAT_VALIDATED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.FORMAT_VALIDATED: [KYCStage.LIVENESS_PASSED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.LIVENESS_PASSED: [KYCStage.FACE_MATCHED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.FACE_MATCHED: [KYCStage.GOV_DB_VERIFIED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.GOV_DB_VERIFIED: [KYCStage.SANCTIONS_SCREENED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.SANCTIONS_SCREENED: [KYCStage.RISK_SCORED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.RISK_SCORED: [KYCStage.COMPLETED, KYCStage.FAILED, KYCStage.REQUIRES_MANUAL_REVIEW],
    KYCStage.REQUIRES_MANUAL_REVIEW: [KYCStage.COMPLETED, KYCStage.FAILED], # Reviewer decision
    KYCStage.FAILED: [], # Terminal state
    KYCStage.COMPLETED: [] # Terminal state
}

def advance_stage(session: KYCSession, next_stage: KYCStage):
    """
    Validates transition and updates session stage.
    """
    if next_stage not in VALID_TRANSITIONS.get(session.current_stage, []):
        # Allow failing from any stage if error occurs
        if next_stage == KYCStage.FAILED:
             session.current_stage = next_stage
             session.completed_at = datetime.utcnow().isoformat()
             return

        raise ValueError(f"Invalid transition from {session.current_stage} to {next_stage}")
    
    session.current_stage = next_stage
    if next_stage in [KYCStage.COMPLETED, KYCStage.FAILED]:
        session.completed_at = datetime.utcnow().isoformat()

def record_error(session: KYCSession, stage: KYCStage, error: str):
    """
    Appends error to session errors list.
    """
    timestamp = datetime.utcnow().isoformat()
    session.errors.append(f"[{timestamp}] [{stage.value}] {error}")
