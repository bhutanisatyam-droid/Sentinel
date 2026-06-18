from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from typing import List, Dict, Optional
from pydantic import BaseModel
from app.api.dependencies import require_role
from app.lib.supabase import supabase

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

class AlertResolutionRequest(BaseModel):
    resolution: str  # DISMISSED, LEGITIMATE, STR_FILED, OVERRIDE_AI
    override_reason: Optional[str] = None

class AssignRequest(BaseModel):
    officer_id: str

@router.get("/")
async def list_alerts(
    page: int = 1,
    per_page: int = 20,
    severity: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Dict[str, str] = Depends(require_role("analyst", "officer", "admin"))
):
    """
    List alerts queue by priority.
    """
    offset = (page - 1) * per_page
    
    query = supabase.table("alerts").select("*", count="exact").range(offset, offset + per_page - 1)
    
    if severity: query = query.eq("severity", severity)
    if status: query = query.eq("status", status)
    # if search: query = query.textSearch("summary", search) # Depends on DB setup
    
    # Order by priority rank (critical first)
    query = query.order("priority_rank", desc=True)
    
    res = query.execute()
    
    return {
        "data": res.data,
        "count": res.count,
        "page": page
    }

@router.get("/{alert_id}")
async def get_alert_detail(
    alert_id: str,
    current_user: Dict[str, str] = Depends(require_role("officer", "admin", "analyst"))
):
    """
    Get full alert context (user profile, tx history, evidence).
    """
    alert = supabase.table("alerts").select("*").eq("id", alert_id).single().execute()
    if not alert.data:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    # Enrich with user data? 
    # Frontend usually fetches user profile separately based on alert['user_id']
    return alert.data

@router.patch("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    req: AlertResolutionRequest,
    current_user: Dict[str, str] = Depends(require_role("officer", "admin"))
):
    """
    Resolve or dismiss an alert.
    Requires reason if overriding AI.
    """
    if req.resolution == "OVERRIDE_AI" and not req.override_reason:
        raise HTTPException(status_code=400, detail="Override reason is mandatory for OVERRIDE_AI resolution")

    update_res = supabase.table("alerts").update({
        "status": "RESOLVED",
        "resolution": req.resolution,
        "resolution_notes": req.override_reason,
        "resolved_by": current_user["user_id"],
        "resolved_at": "now()"
    }).eq("id", alert_id).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    # Audit Log
    supabase.table("audit_logs").insert({
        "action": "ALERT_RESOLUTION",
        "actor_id": current_user["user_id"],
        "target_resource": f"alert:{alert_id}",
        "details": req.dict()
    }).execute()
    
    return update_res.data[0]

@router.post("/{alert_id}/assign")
async def assign_alert(
    alert_id: str,
    req: AssignRequest,
    current_user: Dict[str, str] = Depends(require_role("officer", "admin"))
):
    """
    Assign alert to specific officer.
    """
    update_res = supabase.table("alerts").update({
        "assigned_to": req.officer_id,
        "status": "INVESTIGATING"
    }).eq("id", alert_id).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    return update_res.data[0]
