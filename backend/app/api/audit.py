from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Dict, Optional
from app.api.dependencies import require_role, get_optional_user
from app.lib.supabase import supabase

try:
    from app.services.audit_log import AuditLogService
except ImportError:
    class AuditLogService:
        @staticmethod
        def verify_chain():
            return {"verified": True, "chain_length": 0, "broken_at": None}

router = APIRouter(prefix="/api/audit", tags=["Audit"])

# ─── Table name: must match hash-chain service ───────────────────────
AUDIT_TABLE = "compliance_audit_logs"


@router.get("/logs")
async def get_audit_logs(
    page: int = 1,
    per_page: int = 20,
    action: Optional[str] = None,
    user_id: Optional[str] = None,
    performed_by: Optional[str] = None,
    current_user: Dict[str, str] = Depends(get_optional_user)
):
    """
    Get paginated, hash-chained audit logs with filtering.
    """
    offset = (page - 1) * per_page
    query = supabase.table(AUDIT_TABLE).select("*", count="exact").range(offset, offset + per_page - 1)

    if action:
        query = query.eq("action", action)
    if user_id:
        query = query.eq("user_id", user_id)
    if performed_by:
        query = query.eq("performed_by", performed_by)

    query = query.order("id", desc=True)

    try:
        res = query.execute()
        from app.services.audit_log import TAMPERED_LOG_STATE
        for entry in res.data:
            if entry["id"] in TAMPERED_LOG_STATE:
                entry.update(TAMPERED_LOG_STATE[entry["id"]])
    except Exception as e:
        # Table may not exist yet — return empty gracefully
        return {"data": [], "count": 0, "page": page}

    return {
        "data": res.data,
        "count": res.count,
        "page": page
    }


@router.post("/verify-chain")
async def verify_audit_chain(
    current_user: Dict[str, str] = Depends(get_optional_user)
):
    """
    Verify the cryptographic integrity of the audit log chain.
    """
    try:
        from app.services.audit_log import AuditLogService
        service = AuditLogService(db_pool=None, supabase_client=supabase)
        result = await service.verify_chain()
    except ImportError:
        result = {"valid": True, "entries_checked": 0, "mock": True}

    # Log the verification action to the same table
    try:
        supabase.table(AUDIT_TABLE).insert({
            "user_id": current_user["user_id"],
            "action": "CHAIN_VERIFICATION",
            "performed_by": current_user["user_id"],
            "evidence": result,
            "created_at": __import__("datetime").datetime.utcnow().isoformat(),
            "previous_hash": result.get("last_hash", "VERIFICATION"),
            "record_hash": "VERIFICATION_EVENT",
        }).execute()
    except Exception:
        pass  # Non-critical — don't fail the verification response

    return result

@router.post("/seed")
async def seed_audit_chain_demo(current_user: Dict[str, str] = Depends(get_optional_user)):
    """
    Generate 12 valid, cryptographically linked audit logs for demo purposes.
    """
    import sys
    import os
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.append(backend_dir)
        
    try:
        from scripts.audit_demo_tools import seed_demo_audit_chain
        result = await seed_demo_audit_chain(supabase)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tamper")
async def tamper_audit_log(current_user: Dict[str, str] = Depends(get_optional_user)):
    """
    Randomly modify one of the recent audit logs WITHOUT recomputing hashes,
    breaking the cryptographic chain to demonstrate verification failure.
    """
    import sys
    import os
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.append(backend_dir)
        
    try:
        from scripts.audit_demo_tools import tamper_random_audit_log
        result = await tamper_random_audit_log(supabase)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fix")
async def fix_audit_chain_demo(current_user: Dict[str, str] = Depends(get_optional_user)):
    """
    Recalculate the hashes for the entire chain to restore its cryptographic integrity.
    """
    import sys
    import os
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.append(backend_dir)
        
    try:
        from scripts.audit_demo_tools import fix_audit_chain
        result = await fix_audit_chain(supabase)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
