from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import List, Dict, Optional
from main import get_current_user, require_role
from app.services.kyc_orchestrator import KYCOrchestrator

router = APIRouter(prefix="/api/kyc", tags=["KYC"])

@router.post("/upload")
async def upload_kyc_documents(
    document_image: UploadFile = File(...),
    doc_type: str = Form(...),
    selfie_image: UploadFile = File(...),
    liveness_frames: List[UploadFile] = File(...),
    current_user: Dict[str, str] = Depends(require_role("customer"))
):
    """
    Submits KYC documents and liveness frames for full verification.
    Triggers the KYCOrchestrator pipeline.
    """
    user_id = current_user["user_id"]
    
    # Read file contents
    doc_bytes = await document_image.read()
    selfie_bytes = await selfie_image.read()
    
    liveness_data = []
    for frame in liveness_frames:
        content = await frame.read()
        liveness_data.append(content)

    orchestrator = KYCOrchestrator()
    
    try:
        # Run full verification pipeline
        result = await orchestrator.run_full_verification(
            user_id=user_id,
            document_bytes=doc_bytes,
            doc_type=doc_type,
            selfie_bytes=selfie_bytes,
            liveness_frames=liveness_data
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Log the actual error internally
        print(f"KYC Upload Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Verification processing failed")

@router.get("/status/{user_id}")
async def get_kyc_status(
    user_id: str,
    current_user: Dict[str, str] = Depends(get_current_user)
):
    """
    Get the current KYC status for a user.
    Customers can only see their own status; Officers can see anyone's.
    """
    # Authorization Check
    if current_user["role"] != "officer" and current_user["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # In a real app, this would query the DB (e.g., Supabase 'profiles' table)
    # For now, we return a mock status or fetch from a service if available.
    # Since KYCOrchestrator updates the DB, we can use Supabase client here.
    
    from app.lib.supabase import supabase
    
    response = supabase.table("profiles").select("kyc_status, kyc_risk_tier, verification_notes").eq("id", user_id).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
        
    return response.data
