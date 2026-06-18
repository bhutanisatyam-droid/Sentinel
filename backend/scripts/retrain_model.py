import os
import sys
import pickle
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.engine.anomaly.isolation_forest import AnomalyDetector
import scripts.train_model as trainer
from supabase import create_client

def normalize_txn(txn: dict) -> dict:
    t = dict(txn)
    if "created_at" in t and "timestamp" not in t:
        t["timestamp"] = t["created_at"]
    if "type" in t and "transaction_type" not in t:
        t["transaction_type"] = t["type"]
    if "flagged" not in t:
        t["flagged"] = (t.get("risk_score", 0) == 100)
    return t

def main():
    load_dotenv()
    supabase = create_client(os.environ["SUPABASE_URL"], os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_KEY")))

    print("Fetching recent transactions for retraining...")
    all_transactions = []
    page_size = 1000
    start = 0
    while len(all_transactions) < 5000:
        res = supabase.table("transactions").select("*").order("created_at", desc=True).range(start, start + page_size - 1).execute()
        if not res.data:
            break
        all_transactions.extend([normalize_txn(t) for t in res.data])
        start += page_size
        
    print(f"Total transactions fetched: {len(all_transactions)}")

    print("Building user profiles...")
    user_histories, user_profiles = trainer.build_user_data(all_transactions)
    
    os.makedirs("backend/models", exist_ok=True)
    with open("backend/models/user_profiles.pkl", "wb") as f:
        pickle.dump(user_profiles, f)
    with open("backend/models/user_histories.pkl", "wb") as f:
        pickle.dump(user_histories, f)

    # Filter out injected anomalies which are > 100,000
    train_txns = [t for t in all_transactions if t.get("amount", 0) < 50000]
    print(f"Training on {len(train_txns)} clean transactions... (Filtered out high-value anomalies)")
    detector = AnomalyDetector(contamination=0.05)
    detector.train(train_txns, user_histories, user_profiles)
    detector.save_model("backend/models/isolation_forest.pkl")
    print(f"Model saved! Score range: [{detector.min_score:.4f}, {detector.max_score:.4f}]")

if __name__ == "__main__":
    main()
