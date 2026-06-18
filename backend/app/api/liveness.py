from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body, Form
from typing import List, Dict, Any, Optional
from app.services.liveness_service import LivenessService
from app.config import get_settings
from uuid import uuid4
import json
import time

router = APIRouter(
    prefix="/api/kyc/liveness",
    tags=["liveness"]
)

liveness_service = LivenessService()
settings = get_settings()

# In-memory session store (simple dict with TTL)
# In production, use Redis
_active_sessions: Dict[str, Dict[str, Any]] = {}

def get_session(session_id: str) -> Dict[str, Any]:
    session = _active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    # Check expiry (5 mins)
    if time.time() > session["expires_at"]:
        del _active_sessions[session_id]
        raise HTTPException(status_code=400, detail="Session expired")
        
    return session

def cleanup_sessions():
    """Helper to clean expired sessions. Call periodically or before new set."""
    now = time.time()
    expired = [sid for sid, s in _active_sessions.items() if now > s["expires_at"]]
    for sid in expired:
        del _active_sessions[sid]

@router.get("/session")
async def start_liveness_session(
    # user_id: str = Depends(get_current_user_id) # Requires Auth
):
    """
    Generate liveness session config for frontend.
    """
    cleanup_sessions() # Lazy cleanup
    
    config = liveness_service.generate_liveness_session()
    session_id = config["session_id"]
    
    # Store needed validation data
    _active_sessions[session_id] = {
        "flash_sequence": config["flash_sequence"],
        "active_challenges": config["active_challenges"],
        "created_at": time.time(),
        "expires_at": time.time() + 300 # 5 mins
    }
    
    return config

@router.post("/analyze")
async def analyze_liveness(
    session_id: str = Form(...),
    frame_BLACK: Optional[UploadFile] = File(None),
    frame_RED: Optional[UploadFile] = File(None),
    frame_BLUE: Optional[UploadFile] = File(None),
    frame_GREEN: Optional[UploadFile] = File(None),
    frame_WHITE: Optional[UploadFile] = File(None),
    challenge_blink_frames: Optional[List[UploadFile]] = File(None),
    challenge_turn_left_frames: Optional[List[UploadFile]] = File(None),
    challenge_turn_right_frames: Optional[List[UploadFile]] = File(None),
    challenge_smile_frames: Optional[List[UploadFile]] = File(None),
    challenge_nod_frames: Optional[List[UploadFile]] = File(None),
    frame_timestamps: str = Form("[]") # JSON string, default empty
):
    try:
        session = get_session(session_id)
        
        # Parse timestamps
        try:
            timestamps = json.loads(frame_timestamps)
        except:
            raise HTTPException(status_code=400, detail="Invalid timestamps format")

        # Collect Flash Frames
        flash_frames = {}
        
        async def read_file(f: UploadFile):
            return await f.read()

        if frame_BLACK: flash_frames["BLACK"] = await read_file(frame_BLACK)
        if frame_RED: flash_frames["RED"] = await read_file(frame_RED)
        if frame_BLUE: flash_frames["BLUE"] = await read_file(frame_BLUE)
        if frame_GREEN: flash_frames["GREEN"] = await read_file(frame_GREEN)
        if frame_WHITE: flash_frames["WHITE"] = await read_file(frame_WHITE)
        
        # Collect Challenge Frames
        challenge_frames = {}
        
        async def read_list(files: List[UploadFile]):
            return [await f.read() for f in files] if files else []

        if challenge_blink_frames: 
            challenge_frames["blink"] = await read_list(challenge_blink_frames)
        if challenge_turn_left_frames:
            challenge_frames["turn_left"] = await read_list(challenge_turn_left_frames)
        if challenge_turn_right_frames:
            challenge_frames["turn_right"] = await read_list(challenge_turn_right_frames)
        if challenge_smile_frames:
            challenge_frames["smile"] = await read_list(challenge_smile_frames)
        if challenge_nod_frames:
            challenge_frames["nod"] = await read_list(challenge_nod_frames)

        # --- Save Frames for Compliance Review ---
        import os
        
        # Create directory for this session
        upload_dir = os.path.join(os.getcwd(), "uploads", "kyc", session_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Helper to save a single frame
        def save_frame(blob_data: bytes, filename: str):
            filepath = os.path.join(upload_dir, filename)
            with open(filepath, "wb") as f:
                f.write(blob_data)
                
        # Save flash frames
        for color, blob_data in flash_frames.items():
            save_frame(blob_data, f"flash_{color}.jpg")
            
        # Save challenge frames
        for challenge_name, blob_list in challenge_frames.items():
            for idx, blob_data in enumerate(blob_list):
                save_frame(blob_data, f"challenge_{challenge_name}_{idx}.jpg")
                
        print(f"✅ Saved frames for session {session_id} to {upload_dir}")
        
        # --- Analyze ---
        try:
            result = await liveness_service.analyze_full_liveness(
                session_id=session_id,
                flash_frames=flash_frames,
                challenge_frames=challenge_frames,
                all_frame_timestamps=timestamps,
                expected_sequence=session["flash_sequence"],
                expected_challenges=session["active_challenges"]
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"❌ Liveness analysis error for session {session_id}: {e}")
            result = {
                "real": False,
                "score": 0.0,
                "method": "corneal_reflection+active_challenge+timing_analysis",
                "session_id": session_id,
                "recommendation": "retry",
                "failure_reasons": [f"Analysis engine error: {str(e)}"],
                "layers": {},
                "weighted_scores": {}
            }
        
        # Sanitize numpy types → native Python (FastAPI can't serialize numpy.bool_, etc.)
        import numpy as np
        def _sanitize(obj):
            if isinstance(obj, dict):
                return {k: _sanitize(v) for k, v in obj.items()}
            elif isinstance(obj, (list, tuple)):
                return [_sanitize(i) for i in obj]
            elif isinstance(obj, (np.bool_,)):
                return bool(obj)
            elif isinstance(obj, (np.integer,)):
                return int(obj)
            elif isinstance(obj, (np.floating,)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            return obj

        return _sanitize(result)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Liveness Error: {str(e)}")

@router.post("/skip")
async def skip_liveness(
    session_id: str = Body(..., embed=True)
):
    """
    Mark session for manual review (accessibility skip).
    """
    # Verify session exists (optional) or just log the intent for the user
    # In real app, update KYC state in DB to 'MANUAL_REVIEW'
    
    return {"status": "skipped", "recommendation": "manual_review"}
