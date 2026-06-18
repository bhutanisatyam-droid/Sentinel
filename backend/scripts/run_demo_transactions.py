import os
import sys
import time
import random
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
api_url = "http://localhost:5000/api/transactions/submit"

if not supabase_url or not supabase_key:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {supabase_key}"
}

def submit_transaction(payload, desc="Transaction"):
    try:
        res = requests.post(api_url, json=payload, headers=headers)
        if res.status_code == 200:
            data = res.json()
            is_flagged = data.get("risk_score", 0) > 0
            alert_id = data.get("alert_id")
            verdict = data.get("verdict", "UNKNOWN")
            ml_anomaly = data.get("layers", {}).get("ml", {}).get("anomaly", False)
            
            status = "🚨 FLAGGED" if is_flagged else "✅ OK"
            if ml_anomaly:
                status += " (ML Anomaly)"
                
            print(f"[{status}] {desc} | Amount: ₹{payload['amount']:,.2f} | Verdict: {verdict}")
            if alert_id:
                print(f"   -> Alert: {alert_id}")
            return data
        else:
            print(f"X Failed ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"X Error: {e}")
    return None

def find_low_activity_user(users):
    """Find a user with avg transaction around 3k"""
    print("🔍 Searching for a user with ~₹3,000 average transaction history...")
    try:
        # Get users with transactions
        res = supabase.table("transactions").select("user_id, amount").order("created_at", desc=True).limit(1000).execute()
        
        user_totals = {}
        user_counts = {}
        
        for t in res.data:
            uid = t["user_id"]
            amt = t.get("amount", 0)
            if amt:
                user_totals[uid] = user_totals.get(uid, 0) + amt
                user_counts[uid] = user_counts.get(uid, 0) + 1
                
        # Find user with average between 1000 and 5000
        for uid in user_totals:
            if user_counts[uid] >= 3:
                avg = user_totals[uid] / user_counts[uid]
                if 1000 <= avg <= 5000:
                    print(f"✅ Found ideal candidate: {uid} with average ₹{avg:,.2f}")
                    return uid
                    
        # Fallback to random demo user
        print("⚠️ Couldn't find perfect candidate, returning fallback.")
        return users[0]
    except Exception as e:
        print(f"⚠️ Error querying Supabase: {e}")
        return users[0]

def seed_demo_users(supabase: Client, count=20) -> list:
    """Ensure there are enough demo users with real UUIDs in Supabase, and return their IDs."""
    print(f"🔄 Seeding {count} valid Supabase Demo Users...")
    user_ids = []
    for i in range(1, count + 1):
        email = f"demo_user_{i}@example.com"
        
        # Check if user already exists in public.users
        res = supabase.table("users").select("id").eq("email", email).limit(1).execute()
        if hasattr(res, 'data') and len(res.data) > 0:
            user_ids.append(res.data[0]["id"])
            continue
            
        # Create user via Auth Admin
        try:
            auth_res = supabase.auth.admin.create_user({
                "email": email,
                "password": "Password123!",
                "email_confirm": True
            })
            uid = auth_res.user.id
            supabase.table("users").insert({
                "id": uid, "email": email, "full_name": f"Demo User {i}"
            }).execute()
            supabase.table("profiles").insert({
                "id": uid, "full_name": f"Demo User {i}", "account_age_days": random.randint(30, 365)
            }).execute()
            user_ids.append(uid)
        except Exception as e:
            print(f"⚠️ Error creating user {email}: {e}")
            
    print(f"✅ Loaded {len(user_ids)} Demo User UUIDs.")
    return user_ids

def main():
    print("================================================================")
    print("      SENTINEL DEMO TRANSACTION SCRIPT (250 TXNS + ML ANOMALY)  ")
    print("================================================================")
    
    users = seed_demo_users(supabase, 20)
    if not users:
        print("❌ Failed to load or create any valid user UUIDs. Exiting.")
        sys.exit(1)
        
    merchants = [f"merchant_{i}" for i in range(1, 15)]

    # Phase 1: Normal Transactions (~225)
    print("\n[PHASE 1] Generating ~225 normal background transactions...")
    normal_txns = 225
    
    for i in range(normal_txns):
        uid = random.choice(users)
        counterparty = random.choice(merchants)
        amount = round(random.uniform(100.0, 15000.0), 2)
        
        payload = {
            "user_id": uid,
            "counterparty_id": counterparty,
            "amount": amount,
            "transaction_type": "DEBIT"
        }
        submit_transaction(payload, f"Routine ({i+1}/{normal_txns})")
        time.sleep(0.1) # small delay
        
    # Phase 2: Suspicious Transactions (~24)
    print("\n[PHASE 2] Generating ~24 suspicious ML-flaggable transactions...")
    suspicious_txns = 24
    
    for i in range(suspicious_txns):
        uid = users[random.randint(0, min(4, len(users)-1))] # Concentrate on a few users
        amount = round(random.uniform(150000.0, 800000.0), 2) # unusually large
        
        payload = {
            "user_id": uid,
            "counterparty_id": f"unknown_offshore_{random.randint(100, 999)}",
            "amount": amount,
            "transaction_type": "DEBIT"
        }
        submit_transaction(payload, f"Suspicious ({i+1}/{suspicious_txns})")
        time.sleep(0.2)
        
    # Phase 3: Behavioral Anomaly (Low Activity User sending 30L)
    print("\n[PHASE 3] Generating Behavioral Anomaly (30L from low-avg user)...")
    anomaly_user = find_low_activity_user(users)
    
    payload = {
        "user_id": anomaly_user,
        "counterparty_id": "crypto_exchange_dubai",
        "amount": 3000000.0, # 30 Lakhs
        "transaction_type": "DEBIT"
    }
    submit_transaction(payload, "CRITICAL ANOMALY (30L)")
    
    print("\n================================================================")
    print("✅ DEMO TRANSACTIONS COMPLETE")
    print("================================================================")
    print("\n👇 IMPORTANT INSTRUCTIONS FOR MANUAL PAN EVASION DEMO 👇")
    print("To trigger the PAN Limit Evasion rule (R-102) manually, run the following command in another terminal:")
    print("---")
    print('curl -X POST "http://localhost:8000/api/transactions/submit" \\')
    print('  -H "Content-Type: application/json" \\')
    print('  -H "Authorization: Bearer %s" \\' % supabase_key)
    print(f'  -d \'{{"user_id": "{users[0]}", "counterparty_id": "cash_desk", "amount": 49999.0, "transaction_type": "CASH_DEPOSIT"}}\'')
    print("---")
    print("Or you can enter the details in your frontend 'Send Money' component!")

if __name__ == "__main__":
    main()
