import os
import sys
import argparse
import logging
import pickle
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.engine.anomaly.isolation_forest import AnomalyDetector
from app.engine.anomaly.feature_engineering import TransactionFeatureExtractor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def normalize_txn(txn: dict) -> dict:
    """Normalize a Supabase transaction row into the format the ML pipeline expects."""
    t = dict(txn)
    if "created_at" in t and "timestamp" not in t:
        t["timestamp"] = t["created_at"]
    if "type" in t and "transaction_type" not in t:
        t["transaction_type"] = t["type"]
    if "flagged" not in t:
        t["flagged"] = (t.get("risk_score", 0) == 100)
    return t

def build_user_data(transactions: list[dict]):
    user_histories = {}
    user_profiles = {}
    
    # Sort transactions by timestamp ascending
    sorted_txns = sorted(
        transactions, 
        key=lambda x: datetime.fromisoformat(x['timestamp'].replace('Z', '+00:00')) if x.get('timestamp') else datetime.utcnow()
    )
    
    user_amounts = {}
    user_days = {}
    
    for txn in sorted_txns:
        user_id = txn.get("user_id")
        if not user_id:
            continue
            
        if user_id not in user_histories:
            user_histories[user_id] = []
            user_amounts[user_id] = []
            user_days[user_id] = set()
            
        user_histories[user_id].append(txn)
        user_amounts[user_id].append(txn.get("amount", 0.0))
        
        try:
            dt = datetime.fromisoformat(txn['timestamp'].replace('Z', '+00:00'))
            user_days[user_id].add(dt.date())
        except Exception:
            pass
            
    for user_id, amounts in user_amounts.items():
        mean_amount = float(np.mean(amounts)) if amounts else 0.0
        std_amount = float(np.std(amounts)) if len(amounts) > 1 else 0.0
        days_active = len(user_days[user_id])
        avg_daily = len(amounts) / days_active if days_active > 0 else len(amounts)
        
        user_profiles[user_id] = {
            "mean_transaction_amount": mean_amount,
            "std_transaction_amount": std_amount,
            "avg_daily_txn_count": avg_daily
        }
        
    return user_histories, user_profiles

def main():
    parser = argparse.ArgumentParser(description="Train Isolation Forest Model on Supabase Data")
    parser.add_argument("--limit", type=int, default=0, help="Max transactions to fetch (0 for all)")
    parser.add_argument("--contamination", type=float, default=0.05, help="Isolation Forest contamination parameter")
    parser.add_argument("--output", type=str, default="backend/models/isolation_forest.pkl", help="Model output path")
    args = parser.parse_args()
    
    load_dotenv()
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env")
        return
        
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        logger.info("Connected to Supabase")
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        return

    logger.info("Fetching transactions from Supabase...")
    all_transactions = []
    page_size = 1000
    start = 0
    
    while True:
        try:
            query = supabase.table("transactions").select("*").range(start, start + page_size - 1)
            query = query.order("created_at", desc=False)
            
            res = query.execute()
            data = res.data
            
            if not data:
                break
                
            all_transactions.extend(data)
            logger.info(f"Fetched {len(all_transactions)} transactions so far...")
            
            if len(data) < page_size:
                break
                
            start += page_size
            
            if args.limit > 0 and len(all_transactions) >= args.limit:
                all_transactions = all_transactions[:args.limit]
                break
        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            break
            
    logger.info(f"Total transactions fetched: {len(all_transactions)}")
    if not all_transactions:
        logger.error("No transactions found to train on.")
        return

    # Normalize all transactions for ML pipeline
    all_transactions = [normalize_txn(t) for t in all_transactions]
    logger.info("Normalized all transactions for ML pipeline.")
        
    logger.info("Building user profiles and histories...")
    user_histories, user_profiles = build_user_data(all_transactions)
    logger.info(f"Built profiles for {len(user_profiles)} unique users.")
    
    # Filter for training (only non-flagged data)
    train_txns = [t for t in all_transactions if not t.get("flagged", False)]
    logger.info(f"Using {len(train_txns)} non-flagged transactions for training out of {len(all_transactions)}")
    
    if not train_txns:
        logger.error("No non-flagged transactions available for training.")
        return

    logger.info(f"Training Isolation Forest model (contamination={args.contamination})...")
    
    # We pass contamination param to the detector
    detector = AnomalyDetector(contamination=args.contamination)
    
    try:
        detector.train(train_txns, user_histories, user_profiles)
        logger.info("Model training completed successfully.")
    except Exception as e:
        logger.error(f"Error during model training: {e}")
        return

    # Create models directory if not exists
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    
    # Save Model
    logger.info(f"Saving model to {args.output}...")
    detector.save_model(args.output)
    
    # Save user_profiles and user_histories
    profiles_path = os.path.join(os.path.dirname(args.output), "user_profiles.pkl")
    histories_path = os.path.join(os.path.dirname(args.output), "user_histories.pkl")
    
    with open(profiles_path, "wb") as f:
        pickle.dump(user_profiles, f)
    with open(histories_path, "wb") as f:
        pickle.dump(user_histories, f)
        
    logger.info(f"Saved user profiles to {profiles_path}")
    logger.info(f"Saved user histories to {histories_path}")

    logger.info("Running predictions on all transactions for evaluation...")
    
    # For evaluation we need predicting over user_history up to the transaction 
    # but the instructions say "run prediction on ALL transactions"
    # we will pass the full history for each user here for simplicity,
    # or ideally build historic state per transaction. Our feature extractor handles
    # history but we'll just pass the full user_history according to instructions:
    # "result = detector.predict(txn, user_histories[uid], user_profiles[uid])"
    
    tp = 0
    fp = 0
    tn = 0
    fn = 0
    
    results = []

    for idx, txn in enumerate(all_transactions):
        uid = txn.get("user_id")
        flagged = txn.get("flagged", False)
        
        try:
            pred = detector.predict(txn, user_histories.get(uid, []), user_profiles.get(uid, {}))
            is_anomaly = pred.get("anomaly", False)
            score = pred.get("score", 0.0)
            
            if flagged and is_anomaly:
                tp += 1
            elif not flagged and is_anomaly:
                fp += 1
            elif not flagged and not is_anomaly:
                tn += 1
            elif flagged and not is_anomaly:
                fn += 1
                
            results.append({
                "txn_id": txn.get("id"),
                "flagged": flagged,
                "anomaly": is_anomaly,
                "score": score,
                "feature_contributions": pred.get("feature_contributions", [])
            })
            
            if (idx + 1) % 1000 == 0:
                logger.info(f"Evaluated {idx + 1} transactions...")
                
        except Exception as e:
            logger.warning(f"Failed prediction for txn {txn.get('id')}: {e}")

    logger.info("\n--- Evaluation Results ---")
    logger.info(f"True Positives (TP) : {tp}")
    logger.info(f"False Positives (FP): {fp}")
    logger.info(f"True Negatives (TN) : {tn}")
    logger.info(f"False Negatives (FN): {fn}")
    
    detection_rate = tp / (tp + fn) if (tp + fn) > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    
    logger.info(f"Detection Rate (Recall) : {detection_rate:.2%}")
    logger.info(f"Precision              : {precision:.2%}")

    logger.info("\n--- Top 20 Most Anomalous Transactions ---")
    
    # Sort by score descending
    sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)
    
    i = 0
    count = 0
    while count < 20 and i < len(sorted_results):
        r = sorted_results[i]
        i += 1
        # It's an anomaly per model
        if r["anomaly"]:
            logger.info(f"Txn {r['txn_id']} | Score: {r['score']:.4f} | Ground Truth Fraud: {r['flagged']}")
            for feat in r["feature_contributions"]:
                logger.info(f"  -> {feat['feature']}: SHAP={feat['contribution']:.4f}, Value={feat['value']:.4f}")
            count += 1
            logger.info("")

    logger.info("Done!")

if __name__ == "__main__":
    main()
