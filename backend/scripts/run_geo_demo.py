import os
import sys
import time
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
import random

def seed_demo_users(supabase: Client, count=1) -> list:
    """Ensure there are enough demo users with real UUIDs in Supabase, and return their IDs."""
    print(f"🔄 Seeding {count} valid Supabase Demo Users...")
    user_ids = []
    for i in range(1, count + 1):
        email = f"demo_user_geo_{i}@example.com"
        res = supabase.table("users").select("id").eq("email", email).limit(1).execute()
        if hasattr(res, 'data') and len(res.data) > 0:
            user_ids.append(res.data[0]["id"])
            continue
        try:
            auth_res = supabase.auth.admin.create_user({
                "email": email, "password": "Password123!", "email_confirm": True
            })
            uid = auth_res.user.id
            supabase.table("users").insert({
                "id": uid, "email": email, "full_name": f"Demo Geo User {i}"
            }).execute()
            supabase.table("profiles").insert({
                "id": uid, "full_name": f"Demo Geo User {i}", "account_age_days": 365
            }).execute()
            user_ids.append(uid)
        except Exception as e:
            print(f"⚠️ Error creating user {email}: {e}")
    return user_ids

def main():
    print("================================================================")
    print("   SENTINEL DEMO: GEO-VELOCITY (IMPOSSIBLE TRAVEL) SIMULATION   ")
    print("================================================================")
    
    load_dotenv()
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    api_url = "http://localhost:5000/api/transactions/submit"

    if not supabase_key or not supabase_url:
        print("X Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in .env")
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {supabase_key}"
    }

    users = seed_demo_users(supabase, 1)
    if not users:
        print("X Failed to generate valid UUID for geo user.")
        sys.exit(1)
        
    user_id = users[0]
    
    # Transaction 1: Mumbai, India
    mumbai_payload = {
        "user_id": user_id,
        "counterparty_id": "merchant_mumbai_01",
        "amount": 2500.0,
        "transaction_type": "DEBIT",
        "location": [19.0760, 72.8777]  # lat, lon
    }

    print("\n[STEP 1] Generating baseline transaction in Mumbai, India...")
    res1 = requests.post(api_url, json=mumbai_payload, headers=headers)
    if res1.status_code == 200:
        print(f"✅ OK: Mumbai transaction successful.")
    else:
        print(f"X Failed: {res1.text}")
        sys.exit(1)

    print("\nWaiting 3 seconds...")
    time.sleep(3)

    # Transaction 2: London, UK
    london_payload = {
        "user_id": user_id,
        "counterparty_id": "merchant_london_01",
        "amount": 150000.0,
        "transaction_type": "DEBIT",
        "location": [51.5072, -0.1276]  # lat, lon
    }

    print("\n[STEP 2] Generating impossible travel transaction in London, UK...")
    res2 = requests.post(api_url, json=london_payload, headers=headers)
    if res2.status_code == 200:
        data = res2.json()
        is_flagged = data.get("risk_score", 0) > 0
        alert_id = data.get("alert_id")
        
        if is_flagged:
            print(f"🚨 FLAGGED: London transaction triggered Geo-Velocity Rule (R-404)!")
            if alert_id:
                print(f"   -> Alert ID: {alert_id}")
        else:
            print(f"⚠️ Warning: Transaction was not flagged. Check rules engine configuration.")
    else:
        print(f"X Failed: {res2.text}")
        sys.exit(1)

    print("\n================================================================")
    print("✅ GEO DEMO COMPLETE")
    print("================================================================")

if __name__ == "__main__":
    main()
