import uuid
import random
import asyncio
from typing import Dict, Optional
from datetime import datetime, timedelta

async def seed_demo_audit_chain(supabase_client, get_db_pool=None):
    """
    Generate a demo chain of 10-15 valid audit events.
    """
    try:
        from app.services.audit_log import AuditLogService
        # We need the real AuditLogService to append properly with hashes
        db_pool = get_db_pool() if get_db_pool else None
        
        # If no db_pool is available (like in some lightweight setups), we can't use the full service easily 
        # because it relies on asyncpg locks. For the demo, we can just insert them manually with Python hashes
        # if the service fails, but we'll try to use the service if possible.
        pass
    except ImportError:
        pass

    # For the sake of a reliable demo across different setups (SQLite/Postgres/Supabase),
    # we'll manually compute a valid chain and insert it into Supabase directly.
    import json
    import hashlib

    # 1. Clear existing generic "Demo" logs if any, to keep it clean, but keep real logs
    # Alternatively, just append to whatever exists.
    
    # 2. Get latest hash
    res = supabase_client.table("compliance_audit_logs").select("record_hash").order("id", desc=True).limit(1).execute()
    previous_hash = res.data[0]["record_hash"] if res.data else "GENESIS"
    
    actions = ["KYC_APPROVED", "KYC_REJECTED", "ALERT_RESOLVED", "SANCTION_MATCH"]
    
    # Needs to be valid UUIDs to satisfy Postgres schema constraints
    SYSTEM_UUID = "00000000-0000-0000-0000-000000000000"
    officers = [
        "11111111-1111-1111-1111-111111111111", # Officer Shah
        "22222222-2222-2222-2222-222222222222", # Officer Khan
        "33333333-3333-3333-3333-333333333333", # Officer Patel
    ]
    
    logs = []
    base_time = datetime.utcnow() - timedelta(hours=24)
    
    # Generate 12 sequential logs
    entries_to_insert = []
    for i in range(12):
        action = random.choice(actions)
        performed_by = SYSTEM_UUID if "KYC" in action else random.choice(officers)
        user_id = str(uuid.uuid4())
        timestamp = (base_time + timedelta(hours=i*2 + random.randint(0, 60))).isoformat()
        
        record_data = {
            "user_id": user_id,
            "action": action,
            "performed_by": performed_by,
            "override_reason": "Verified manually — false positive" if action == "ALERT_RESOLVED" and random.choice([True, False]) else None,
            "evidence": {"confidence": random.randint(80, 99)} if "KYC" in action else None,
            "created_at": timestamp
        }
        
        payload = json.dumps(record_data, sort_keys=True) + previous_hash
        record_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
        
        entry = {
            "user_id": user_id,
            "action": action,
            "performed_by": performed_by,
            "override_reason": record_data["override_reason"],
            "evidence": record_data["evidence"],
            "created_at": timestamp,
            "previous_hash": previous_hash,
            "record_hash": record_hash
        }
        entries_to_insert.append(entry)
        previous_hash = record_hash
        
    # Insert one by one to ensure sequential IDs (or bulk if order is preserved)
    for entry in entries_to_insert:
        supabase_client.table("compliance_audit_logs").insert(entry).execute()
        
    return {"status": "success", "message": f"Generated {len(entries_to_insert)} valid audit logs"}

async def tamper_random_audit_log(supabase_client):
    """
    Pick a random recent log (not the very last one) and change its data
    WITHOUT updating the hashes, simulating a malicious DB admin.
    """
    res = supabase_client.table("compliance_audit_logs").select("*").order("id", desc=True).limit(10).execute()
    if not res.data or len(res.data) < 3:
        return {"status": "error", "message": "Not enough logs to tamper with. Generate demo logs first."}
        
    # Pick a log somewhere in the middle (index 2 to 7)
    idx_to_tamper = random.randint(2, min(7, len(res.data) - 1))
    target_log = res.data[idx_to_tamper]
    
    # Tamper with the data
    new_action = "KYC_APPROVED" if target_log["action"] != "KYC_APPROVED" else "ALERT_RESOLVED"
    
    # Update directly in memory overide without recalculating hash
    from app.services.audit_log import TAMPERED_LOG_STATE
    TAMPERED_LOG_STATE[target_log["id"]] = {
        "action": new_action,
        "override_reason": "TAMPERED: Cover up via DB access"
    }
    
    return {
        "status": "success", 
        "message": f"Tampered with log ID {target_log['id']}. Chain should now be broken."
    }

async def fix_audit_chain(supabase_client):
    """
    Recalculate hashes for the COMPLETE chain to fix any broken cryptographic links.
    """
    import json
    import hashlib
    from app.services.audit_log import TAMPERED_LOG_STATE

    # Fetch raw immutable ledger
    response = supabase_client.table("compliance_audit_logs").select("*").order("id", desc=False).execute()
    entries = response.data

    if not entries:
        return {"status": "success", "message": "No logs to fix"}

    previous_hash = "GENESIS"
    fixed_count = 0

    # Build an untampered virtual chain inside TAMPERED_LOG_STATE, overriding any underlying Postgres flaws
    TAMPERED_LOG_STATE.clear()

    for entry in entries:
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

        # If the raw DB block is broken, overlay the perfectly computed hashes
        if entry["record_hash"] != computed_hash or entry["previous_hash"] != previous_hash:
            TAMPERED_LOG_STATE[entry["id"]] = {
                "previous_hash": previous_hash,
                "record_hash": computed_hash,
                # Ensure the original action is restored just in case it was tampered
                "action": entry["action"],
                "override_reason": entry.get("override_reason")
            }
            fixed_count += 1

        previous_hash = computed_hash

    return {
        "status": "success",
        "message": f"Successfully realigned chain constraints. Repaired {fixed_count} logs.",
        "repaired": fixed_count
    }
