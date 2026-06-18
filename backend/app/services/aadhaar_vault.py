from app.lib.supabase import supabase
from typing import Dict, Any, Optional
from datetime import datetime

class AadhaarVaultService:
    """
    Manages Aadhaar verification records in the vault table.
    
    SECURITY INVARIANTS:
    - This service NEVER accepts or stores raw Aadhaar numbers
    - It ONLY works with vault_tokens (opaque provider references)
    - Deduplication uses vault_token, not Aadhaar hashes
    """
    
    async def store_verification(
        self,
        user_id: str,
        vault_token: str,
        verification_source: str,
        verified_name: str = None,
        verified_dob: str = None,
    ) -> Dict[str, Any]:
        """
        Store an Aadhaar verification record.
        Returns the created record.
        """
        record = {
            "user_id": user_id,
            "vault_token": vault_token,
            "verification_status": True,
            "verification_source": verification_source,
            "verified_name": verified_name,
            "verified_dob": verified_dob,
            "verified_at": datetime.utcnow().isoformat(),
        }
        
        result = supabase.table("aadhaar_verifications").insert(record).execute()
        return result.data[0] if result.data else record
    
    async def check_duplicate(self, vault_token: str) -> bool:
        """
        Check if this vault_token has been used before (deduplication).
        Returns True if duplicate found.
        """
        result = supabase.table("aadhaar_verifications") \
            .select("id") \
            .eq("vault_token", vault_token) \
            .limit(1) \
            .execute()
        return len(result.data) > 0
    
    async def get_user_verification(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the latest Aadhaar verification for a user.
        Returns None if no verification exists.
        """
        result = supabase.table("aadhaar_verifications") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("verified_at", desc=True) \
            .limit(1) \
            .execute()
        return result.data[0] if result.data else None
