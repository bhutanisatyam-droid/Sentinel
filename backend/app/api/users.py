from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from typing import List, Dict, Optional
from app.api.dependencies import require_role, get_current_user
from app.lib.supabase import supabase
from pydantic import BaseModel

router = APIRouter(prefix="/api/users", tags=["Users"])

class UpdateTierRequest(BaseModel):
    tier: str
    reason: str

@router.get("/me")
async def get_current_user_profile(
    current_user: Dict[str, str] = Depends(get_current_user)
):
    """
    Get the currently authenticated user's profile and role.
    """
    try:
        profile_res = supabase.table("user_profiles").select("*").eq("id", current_user["user_id"]).single().execute()
        return profile_res.data
    except Exception:
        # Fallback if profile row is missing
        return {"id": current_user["user_id"], "role": current_user["role"], "full_name": "Unknown User"}

@router.get("/")
async def list_users(
    page: int = 1,
    per_page: int = 20,
    tier: Optional[str] = None,
    kyc_status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Dict[str, str] = Depends(require_role("officer", "admin"))
):
    """
    List users with pagination and filtering.
    Officers/Admins only.
    """
    offset = (page - 1) * per_page
    
    query = supabase.table("profiles").select("*", count="exact").range(offset, offset + per_page - 1)
    
    if tier:
        query = query.eq("kyc_risk_tier", tier)
    if kyc_status:
        query = query.eq("kyc_status", kyc_status)
    if search:
        query = query.ilike("full_name", f"%{search}%")
        
    result = query.execute()
    
    return {
        "data": result.data,
        "count": result.count,
        "page": page,
        "per_page": per_page
    }

@router.get("/{user_id}")
async def get_user_details(
    user_id: str,
    current_user: Dict[str, str] = Depends(get_current_user)
):
    """
    Get full user profile including risk breakdown.
    Users can see their own; Officers/Admins can see anyone's.
    """
    if current_user["role"] not in ["officer", "admin"] and current_user["user_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Fetch profile
    profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    # TODO: Fetch masked documents via separate secure query or pre-signed URLs
    # TODO: Fetch risk score history
    
    return profile.data

@router.patch("/{user_id}/tier")
async def update_user_tier(
    user_id: str,
    request: UpdateTierRequest,
    current_user: Dict[str, str] = Depends(require_role("officer", "admin"))
):
    """
    Manually update a user's risk tier (e.g., override AI).
    Creates an audit log entry.
    """
    valid_tiers = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "BLACKLIST"]
    if request.tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of {valid_tiers}")

    # Update profile
    update_res = supabase.table("profiles").update({
        "kyc_risk_tier": request.tier,
        "verification_notes": f"Manual tier update: {request.reason}"
    }).eq("id", user_id).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Create Audit Log
    try:
        supabase.table("audit_logs").insert({
            "action": "MANUAL_TIER_UPDATE",
            "actor_id": current_user["user_id"],
            "target_resource": f"user:{user_id}",
            "details": {
                "old_tier": "UNKNOWN", # Ideally fetch before update
                "new_tier": request.tier,
                "reason": request.reason
            }
        }).execute()
    except Exception as e:
        print(f"Audit log failed: {e}")
        # Proceed anyway as the main action succeeded
        
    return update_res.data[0]
