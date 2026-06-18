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

def main():
    parser = argparse.ArgumentParser(description="Simulate continuous live transactions for the demo.")
    parser.add_argument("--api-url", default="http://127.0.0.1:8000/api/transactions/check", help="Sentinel API URL")
    parser.add_argument("--count", type=int, default=100, help="Number of transactions to send")
    parser.add_argument("--delay", type=float, default=2.0, help="Seconds to wait between transactions")
    parser.add_argument("--token", default="dummy_token_for_demo", help="Auth token if needed")
    
    args = parser.parse_args()
    
    print_banner("🔷 SENTINEL LIVE TRANSACTION SIMULATOR 🔷")
    print(f"Target API : {args.api_url}")
    print(f"Total Txns : {args.count}")
    print(f"Delay      : {args.delay} seconds")
    print("Press Ctrl+C to stop early.\n")
    
    # We need a pool of users to simulate realistic-ish behavior.
    # In a real demo, you might extract these from the trained user profiles.
    # For now, we will generate synthetic users.
    users = [f"U_DEMO_{i}" for i in range(1, 21)]
    merchants = [f"M_DEMO_{i}" for i in range(1, 11)]
    
    types = ["UPI_PAYMENT", "UPI_TRANSFER", "NEFT", "CASH_WITHDRAWAL"]
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {args.token}"
    }

    try:
        for i in range(1, args.count + 1):
            user_id = random.choice(users)
            
            # Most transactions are normal (small amounts to merchants or transfers)
            # Sometimes inject an obvious anomaly (huge amount, strange counterparty)
            
            is_malicious_attempt = random.random() < 0.15 # 15% chance to try sending an anomalous txn
            
            if is_malicious_attempt:
                amount = round(random.uniform(50000.0, 500000.0), 2)
                type_ = "WIRE_TRANSFER" # unusual type
                counterparty = f"UNKNOWN_OFFSHORE_{random.randint(100,999)}"
            else:
                amount = round(random.uniform(10.0, 2000.0), 2)
                type_ = random.choice(types)
                counterparty = random.choice(users + merchants)
                
            # Prevent self-transfer
            while counterparty == user_id:
                counterparty = random.choice(users + merchants)

            payload = {
                "user_id": user_id,
                "amount": amount,
                "type": type_,
                "counterparty": counterparty,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            print(f"[{i:03d}/{args.count:03d}] Sending {type_} for ₹{amount:,.2f} from {user_id} -> {counterparty}... ", end="", flush=True)
            
            start_time = time.time()
            try:
                response = requests.post(args.api_url, json=payload, headers=headers, timeout=5)
                duration = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    verdict = data.get("verdict", "UNKNOWN")
                    ml_score = data.get("ml_anomaly_score", 0.0)
                    is_anomaly = data.get("is_anomaly", False)
                    
                    if is_anomaly:
                        print(f"🚨 ANOMALY! (Score: {ml_score:.3f}) -> Verdict: {verdict}")
                    else:
                        print(f"✅ OK (Score: {ml_score:.3f}) -> Verdict: {verdict}")
                else:
                    print(f"❌ HTTP {response.status_code}")
                    print(f"Response: {response.text}")
            except requests.exceptions.RequestException as e:
                print(f"❌ Failed: {e}")
                
            if i < args.count:
                time.sleep(args.delay)
                
    except KeyboardInterrupt:
        print("\n\n🛑 Simulation stopped by user.")
        
    print("\nSimulation complete.")

if __name__ == "__main__":
    main()
