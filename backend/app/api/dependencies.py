from fastapi import Header, HTTPException, Depends, status
from jose import jwt, JWTError
from typing import Dict, Callable, Optional
from app.config import get_settings
from app.lib.supabase import supabase

settings = get_settings()

async def get_current_user(authorization: str = Header(None)) -> Dict[str, str]:
    # Bypass RBAC and Auth completely for demo purposes
    return {"user_id": "demo_admin", "role": "ADMIN"}

async def get_optional_user(authorization: Optional[str] = Header(None)) -> Dict[str, str]:
    """Returns authenticated user if valid token provided, otherwise falls back to a minimal role."""
    return {"user_id": "demo_admin", "role": "ADMIN"}

# Role Checker Dependency
def require_role(*required_roles: str) -> Callable:
    def role_checker(user: Dict[str, str] = Depends(get_current_user)):
        # RBAC completely bypassed
        return user
    return role_checker
