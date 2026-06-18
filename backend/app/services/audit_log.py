import json
import hashlib
import math
from datetime import datetime

# Global in-memory override since the DB strictly rejects UPDATE queries via table ACLs
TAMPERED_LOG_STATE = {}

class AuditLogService:
    def __init__(self, db_pool, supabase_client):
        # db_pool (e.g., asyncpg) is required for stateful DB locks
        # supabase_client handles straightforward reads
        self.db_pool = db_pool
        self.supabase = supabase_client
        self.genesis_hash = "GENESIS"

    async def append_log(self, user_id: str, action: str, performed_by: str,
                         override_reason: str = None, evidence: dict = None) -> dict:
        """
        Appends an audit log cryptographically linked to the previous log.
        A database advisory lock is used to prevent race conditions.
        """
        async with self.db_pool.acquire() as conn:
            async with conn.transaction():
                # Advisory lock #42 prevents concurrent appends
                await conn.execute("SELECT pg_advisory_xact_lock(42)")

                # Step 1: Get latest log entry's record_hash
                row = await conn.fetchrow(
                    "SELECT record_hash FROM compliance_audit_logs ORDER BY id DESC LIMIT 1"
                )
                previous_hash = row["record_hash"] if row else self.genesis_hash

                # Step 2: Build record data
                record_data = {
                    "user_id": user_id,
                    "action": action,
                    "performed_by": performed_by,
                    "override_reason": override_reason,
                    "evidence": evidence,
                    "created_at": datetime.utcnow().isoformat()
                }

                # Step 3: Compute hash deterministically
                payload = json.dumps(record_data, sort_keys=True) + previous_hash
                record_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()

                # Step 4: Insert into database
                insert_query = """
                    INSERT INTO compliance_audit_logs 
                    (user_id, action, performed_by, override_reason, evidence, created_at, previous_hash, record_hash)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                """
                new_entry = await conn.fetchrow(
                    insert_query,
                    record_data["user_id"],
                    record_data["action"],
                    record_data["performed_by"],
                    record_data["override_reason"],
                    json.dumps(record_data["evidence"]) if record_data["evidence"] else None,
                    record_data["created_at"],
                    previous_hash,
                    record_hash
                )

                # Step 5: Return created entry
                return dict(new_entry)

    async def verify_chain(self) -> dict:
        """
        Verifies the integrity of the entire audit log chain by recomputing hashes.
        """
        # Step 1: Fetch ALL entries ordered by ID ASC
        response = self.supabase.table("compliance_audit_logs").select("*").order("id", desc=False).execute()
        entries = response.data

        if not entries:
            return {
                "valid": True,
                "broken_at": None,
                "entries_checked": 0,
                "last_hash": self.genesis_hash,
                "verified_at": datetime.utcnow().isoformat()
            }

        previous_hash = self.genesis_hash
        entries_checked = 0
        last_hash = self.genesis_hash

        for entry in entries:
            entries_checked += 1
            
            # Apply in-memory tampering if this block was targeted by the demo
            if entry["id"] in TAMPERED_LOG_STATE:
                entry.update(TAMPERED_LOG_STATE[entry["id"]])

            # Step 2 & 3: Reconstruct record_data exactly as it was during creation
            record_data = {
                "user_id": entry["user_id"],
                "action": entry["action"],
                "performed_by": entry["performed_by"],
                "override_reason": entry.get("override_reason"),
                "evidence": entry.get("evidence"),
                "created_at": entry["created_at"]
            }

            payload = json.dumps(record_data, sort_keys=True) + previous_hash
            computed_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()

            # Step 4: If hashes don't match, chain is broken
            if computed_hash != entry["record_hash"]:
                return {
                    "valid": False,
                    "broken_at": entry["id"],
                    "entries_checked": entries_checked,
                    "last_hash": last_hash,
                    "verified_at": datetime.utcnow().isoformat()
                }

            previous_hash = computed_hash
            last_hash = computed_hash

        return {
            "valid": True,
            "broken_at": None,
            "entries_checked": entries_checked,
            "last_hash": last_hash,
            "verified_at": datetime.utcnow().isoformat()
        }

    async def get_log_entries(self, filters: dict = None, page: int = 1, per_page: int = 50) -> dict:
        """
        Fetch paginated log entries with optional filters.
        """
        query = self.supabase.table("compliance_audit_logs").select("*", count="exact")

        if filters:
            if "action" in filters:
                query = query.eq("action", filters["action"])
            if "user_id" in filters:
                query = query.eq("user_id", filters["user_id"])
            if "performed_by" in filters:
                query = query.eq("performed_by", filters["performed_by"])
            if "start_date" in filters and "end_date" in filters:
                query = query.gte("created_at", filters["start_date"]).lte("created_at", filters["end_date"])

        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page - 1

        response = query.range(start_idx, end_idx).order("id", desc=True).execute()

        total_count = response.count if response.count is not None else 0
        total_pages = math.ceil(total_count / per_page) if per_page > 0 else 0

        return {
            "entries": response.data,
            "pagination": {
                "total_count": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages
            }
        }
