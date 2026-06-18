import argparse
import time
import os
import random
import requests
from dotenv import load_dotenv

def print_result(result):
    txn_id = result.get("transaction_id", "Unknown")
    amount = result.get("layers", {}).get("rules", {}).get("transaction_amount", result.get("amount", 0)) # fallback
    score = result.get("risk_score", 0)
    verdict = result.get("verdict", "UNKNOWN")
    alert_id = result.get("alert_id")
    
    # Try to extract amount from original dict if API doesn't return it
    print(f"\n{'─'*50}")
    print(f"  Transaction: {txn_id}")
    print(f"  Risk Score: {score}/100")
    print(f"  Verdict: {verdict}")
    
    if alert_id:
        print(f"  🚨 ALERT CREATED: {alert_id}")
        layers = result.get("layers", {})
        
        rules = layers.get("rules", {})
        if rules.get("triggered"):
            # Determine severity roughly from score
            severity = "CRITICAL" if score >= 80 else "HIGH" if score >= 50 else "MEDIUM" if score >= 25 else "LOW"
            print(f"     Severity: {severity}")
            
            for rule in rules.get("triggered", []):
                print(f"     Rule: [{rule.get('rule_id')}] {rule.get('rule_name')}")
                print(f"           {rule.get('explanation')}")
                
        ml = layers.get("ml", {})
        if ml.get("anomaly"):
            print(f"     ML: Anomaly score {ml.get('score', 0):.3f}")
            for fc in ml.get("feature_contributions", []):
                feature = fc.get("feature", "unknown")
                contrib = fc.get("contribution", 0)
                print(f"         {feature}: {contrib:+.4f}")
    else:
        print(f"  ✅ No alert — transaction is clean")
    print(f"{'─'*50}")
    print("👆 Check your dashboard — the alert should appear now!")

def submit_txn(api_url, token, payload):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.post(f"{api_url}/api/transactions/submit", json=payload, headers=headers)
        if response.status_code == 200:
            result = response.json()
            # Inject amount for display since it's not natively in the API response root
            result["amount"] = payload.get("amount")
            print_result(result)
            return result
        else:
            print(f"❌ API Error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Sentinel Live Demo CLI")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Backend API URL")
    parser.add_argument("--token", help="Auth token (defaults to SUPABASE_SERVICE_ROLE_KEY from .env)")
    args = parser.parse_args()
    
    load_dotenv()
    token = args.token or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not token:
        print("❌ Error: No auth token provided. Set SUPABASE_SERVICE_ROLE_KEY in .env or pass --token")
        return
        
    api_url = args.api_url.rstrip("/")

    while True:
        print("\n🔷 SENTINEL LIVE DEMO — Transaction Simulator 🔷\n")
        print("Pre-built scenarios:")
        print("  1. ✅ Normal transaction (₹5,000 UPI) — should PASS")
        print("  2. 🚨 CTR breach (₹12,00,000 cash deposit) — triggers R-101")  
        print("  3. 🚨 Large anomaly (₹5,00,000 from low-activity user) — triggers ML")
        print("  4. 🚨 Structuring setup (run 4 times: ₹42k, ₹48.5k, ₹47.2k, ₹49k)")
        print("  5. 🚨 KYC Mismatch (Student sending ₹7,50,000)")
        print("  6. 🔧 Custom transaction (you specify all fields)")
        print("  7. 🔄 Batch: Run 50 random normal + 10 suspicious")
        print("  8. 🚨 Impossible Travel: Mumbai → London (triggers R-404)")
        print("  q. Quit\n")
        
        choice = input("Select scenario (1-8, q): ").strip()
        
        if choice.lower() == 'q':
            break
            
        elif choice == '1':
            print("\nExecuting Normal Transaction...")
            payload = {
                "user_id": "user_normal_demo",
                "counterparty_id": "shop_001",
                "amount": 5000.0,
                "transaction_type": "UPI_TRANSFER",
                "description": "Normal grocery payment"
            }
            submit_txn(api_url, token, payload)
            
        elif choice == '2':
            print("\nExecuting CTR Breach...")
            payload = {
                "user_id": "user_ctr_demo",
                "counterparty_id": "account_offshore",
                "amount": 1200000.0,
                "transaction_type": "CASH_DEPOSIT",
                "description": "Large cash deposit"
            }
            submit_txn(api_url, token, payload)
            
        elif choice == '3':
            print("\nExecuting Large ML Anomaly...")
            payload = {
                "user_id": "user_003",  # existing user with low avg typically
                "counterparty_id": "unknown_entity_99",
                "amount": 500000.0,
                "transaction_type": "UPI_TRANSFER",
                "description": "Sudden large transfer from low-activity user"
            }
            submit_txn(api_url, token, payload)
            
        elif choice == '4':
            print("\nExecuting Structuring Sequence (R-205)...")
            amounts = [42000.0, 48500.0, 47200.0, 49000.0]
            for i, amt in enumerate(amounts):
                print(f"\nStep {i+1}/4: Submitting deposit of ₹{amt:,.2f}...")
                payload = {
                    "user_id": "user_smurf_demo",
                    "counterparty_id": "self",
                    "amount": amt,
                    "transaction_type": "CASH_DEPOSIT"
                }
                submit_txn(api_url, token, payload)
                if i < 3:
                    print("Waiting 1 second before next transaction...")
                    time.sleep(1)
                    
        elif choice == '5':
            print("\nExecuting KYC Mismatch (Student spending 7.5L)...")
            payload = {
                "user_id": "user_student_demo",
                "counterparty_id": "luxury_store",
                "amount": 750000.0,
                "transaction_type": "UPI_TRANSFER",
                "description": "Student sending 7.5L"
            }
            submit_txn(api_url, token, payload)
            
        elif choice == '6':
            print("\n🔧 Custom Transaction")
            try:
                user_id = input("  user_id: ").strip() or "demo_user"
                counterparty_id = input("  counterparty_id: ").strip() or "unknown"
                amount_str = input("  amount ₹: ").strip()
                amount = float(amount_str) if amount_str else 1000.0
                txn_type = input("  transaction_type (UPI_TRANSFER, CASH_DEPOSIT, etc): ").strip() or "UPI_TRANSFER"
                desc = input("  description: ").strip()
                
                payload = {
                    "user_id": user_id,
                    "counterparty_id": counterparty_id,
                    "amount": amount,
                    "transaction_type": txn_type,
                    "description": desc
                }
                submit_txn(api_url, token, payload)
            except ValueError:
                print("❌ Invalid amount format.")
                
        elif choice == '7':
            print("\nExecuting Batch Job (50 normal, 10 suspicious)...")
            alerts = 0
            
            # Normal
            for i in range(50):
                amt = random.uniform(100.0, 15000.0)
                payload = {
                    "user_id": f"batch_user_{random.randint(1,20)}",
                    "counterparty_id": f"shop_{random.randint(1,100)}",
                    "amount": amt,
                    "transaction_type": "UPI_TRANSFER",
                    "description": f"Batch normal txn {i}"
                }
                res = submit_txn(api_url, token, payload)
                if res and res.get("alert_id"):
                    alerts += 1
                time.sleep(0.1)
                
            # Suspicious
            for i in range(10):
                amt = random.uniform(150000.0, 600000.0)
                payload = {
                    "user_id": f"batch_user_{random.randint(1,5)}",
                    "counterparty_id": f"unknown_entity_{random.randint(100,999)}",
                    "amount": amt,
                    "transaction_type": random.choice(["UPI_TRANSFER", "NEFT"]),
                    "description": f"Batch suspicious txn {i}"
                }
                res = submit_txn(api_url, token, payload)
                if res and res.get("alert_id"):
                    alerts += 1
                time.sleep(0.1)
                
            print(f"\n✅ Batch Complete. Produced {alerts} alerts out of 60 transactions.")
            
        elif choice == '8':
            print("\nExecuting Impossible Travel (Mumbai → London in 2s)...")
            
            print("\nFirst Transaction (Mumbai)")
            payload1 = {
                "user_id": "user_travel_demo",
                "counterparty_id": "shop_mumbai",
                "amount": 15000.0,
                "transaction_type": "UPI_TRANSFER",
                "location": [19.0760, 72.8777],
                "description": "Payment in Mumbai"
            }
            submit_txn(api_url, token, payload1)
            
            print("\nWaiting 2 seconds...")
            time.sleep(2)
            
            print("\nSecond Transaction (London)")
            payload2 = {
                "user_id": "user_travel_demo",
                "counterparty_id": "shop_london",
                "amount": 25000.0,
                "transaction_type": "UPI_TRANSFER",
                "location": [51.5074, -0.1278],
                "description": "Payment in London - 5 minutes later"
            }
            res2 = submit_txn(api_url, token, payload2)
            
            if res2 and 'layers' in res2 and 'rules' in res2['layers']:
                triggered = res2['layers']['rules'].get('triggered', [])
                for rule in triggered:
                    if rule.get('rule_id') == 'R-404':
                        m = rule.get('explanation', '')
                        print(f"\n🚨 Impossible Travel detected: {m}")
                        
        else:
            print("❌ Invalid choice")
            
        input("\nPress Enter to return to menu...")

if __name__ == "__main__":
    main()
