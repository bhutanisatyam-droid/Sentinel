import os
import sys
import time
import argparse
import random
import uuid
import requests
from datetime import datetime, timezone

def print_banner(msg: str):
    print(f"\n{'='*70}")
    print(f" {msg}")
    print(f"{'='*70}\n")

# Bounding box for India
LAT_MIN = 8.4
LAT_MAX = 37.6
LON_MIN = 68.7
LON_MAX = 97.2

def random_india_location():
    return [
        round(random.uniform(LAT_MIN, LAT_MAX), 6),
        round(random.uniform(LON_MIN, LON_MAX), 6)
    ]

def main():
    parser = argparse.ArgumentParser(description="Run 500 transactions to trigger ML and populate Money Map.")
    parser.add_argument("--api-url", default="http://127.0.0.1:5000/api/transactions/submit", help="Sentinel API Submit URL")
    parser.add_argument("--count", type=int, default=10000, help="Number of transactions to run")
    parser.add_argument("--delay", type=float, default=0.0, help="Seconds to wait between transactions")
    parser.add_argument("--fraud-rate", type=float, default=0.25, help="Fraud rate (0.0 to 1.0)")
    
    args = parser.parse_args()
    
    print_banner("SENTINEL 500 TRANSACTIONS SCRIPT")
    print(f"Target API : {args.api_url}")
    print(f"Total Txns : {args.count}")
    print(f"Delay      : {args.delay} seconds")
    print("Starting now...\n")
    
    # Load environment variables for direct Supabase access
    from dotenv import load_dotenv
    from supabase import create_client, Client
    
    load_dotenv()
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)
        
    supabase: Client = create_client(supabase_url, supabase_key)
    
    print("Fetching valid users from Database...")
    user_res = supabase.auth.admin.list_users()
    db_users = [u.id for u in user_res]
    
    if not db_users:
        print("Error: No users found in auth.users table. Please create some users first.")
    users = db_users
    # Merchants should NOT be UUIDs unless they are in the database.
    # We will use string names that won't trigger UUID parsing errors even if we send to the backend.
    # The anomaly detector and database allow string counterparty_ids, but UUIDs get strictly typecast and fail FK constraints in Alerts if not present in Users.
    merchants = [f"M_DEMO_500_{i}" for i in range(1, 11)]
    
    types = ["DEBIT", "CREDIT"]

    headers = {
        "Content-Type": "application/json"
    }

    anomalies_triggered = 0
    success_count = 0

    try:
        for i in range(1, args.count + 1):
            user_id = random.choice(users)
            
            # Use args.fraud_rate for anomaly probability
            is_malicious_attempt = random.random() < args.fraud_rate
            
            if is_malicious_attempt:
                amount = round(random.uniform(100000.0, 900000.0), 2)
                type_ = "DEBIT" # unusual type
                counterparty = f"UNKNOWN_OFFSHORE_{random.randint(100,999)}"
            else:
                amount = round(random.uniform(50.0, 5000.0), 2)
                type_ = random.choice(types)
                counterparty = random.choice(users + merchants)
                
            # Prevent self-transfer
            while counterparty == user_id:
                counterparty = random.choice(users + merchants)

            # Important: Use /submit endpoint to save to DB and trigger rules/ML
            payload = {
                "user_id": user_id,
                "amount": amount,
                "transaction_type": type_,
                "counterparty_id": counterparty,
                "location": random_india_location(),
                "description": f"Demo 500 script txn {i}"
            }
            
            print(f"[{i:03d}/{args.count:03d}] Sending {type_} for Rs. {amount:,.2f} from {user_id} -> {counterparty}... ", end="", flush=True)
            
            start_time = time.time()
            try:
                response = requests.post(args.api_url, json=payload, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    verdict = data.get("verdict", "UNKNOWN")
                    ml_data = data.get("layers", {}).get("ml", {})
                    # ml_score = ml_data.get("score", 0.0)
                    is_anomaly = ml_data.get("anomaly", False)
                    success_count += 1
                    
                    if is_anomaly:
                        print(f"ANOMALY! -> Verdict: {verdict}")
                        anomalies_triggered += 1
                    else:
                        print(f"OK -> Verdict: {verdict}")
                else:
                    print(f"HTTP {response.status_code}")
                    print(f"Response: {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"Failed: {e}")
                
            if i < args.count:
                time.sleep(args.delay)
                
    except KeyboardInterrupt:
        print("\n\nSimulation stopped by user.")
        
    print_banner(f"Simulation complete! Successful: {success_count}/{args.count}. ML Anomalies Triggered: {anomalies_triggered}")

if __name__ == "__main__":
    main()
