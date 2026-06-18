from fastapi import APIRouter
from app.config import get_settings
from app.lib.supabase import supabase
from datetime import datetime

router = APIRouter(prefix="/api/health", tags=["System"])
settings = get_settings()

@router.get("/")
async def expanded_health_check():
    """
    Enhanced system health check.
    """
    # 1. DB Connection
    db_connected = False
    try:
        # Simple query
        supabase.table("profiles").select("id").limit(1).execute()
        db_connected = True
    except Exception:
        db_connected = False
        
    # 2. Mock Status
    using_mocks = False
    
    # 3. Cache/Sanctions status (dummy for now)
    sanctions_cache_age = 3600 # seconds
    
    # 4. Audit Chain Length (quick check)
    chain_len = 0
    try:
        res = supabase.table("audit_logs").select("id", count="exact").execute()
        chain_len = res.count
    except:
        pass

    return {
        "status": "healthy",
        "version": "1.0.0",
        "using_mocks": using_mocks,
        "database_connected": db_connected,
        "sanctions_cache_age": sanctions_cache_age,
        "model_trained": True, # Dummy
        "audit_chain_length": chain_len,
        "timestamp": datetime.utcnow().isoformat()
    }
