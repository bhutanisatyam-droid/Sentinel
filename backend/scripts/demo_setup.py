import os
import sys
import time
import argparse
import pickle
import uuid
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.engine.anomaly.isolation_forest import AnomalyDetector
from app.engine.anomaly.feature_engineering import TransactionFeatureExtractor
from app.engine.graph.graph_engine import TransactionGraphEngine

import scripts.load_paysim_dataset as loader
import scripts.train_model as trainer
import scripts.run_scoring_pipeline as scorer

# Actual Supabase "transactions" table columns:
# id, user_id, amount, currency, type, counterparty_id,
# location_lat, location_lon, ip_address, device_fingerprint,
# risk_score, created_at
#
# We use risk_score=100 for fraud ground truth, risk_score=0 for clean.
# The feature extractor uses "timestamp" key, so we alias created_at -> timestamp
# when building in-memory dicts for the ML pipeline.

def print_banner(msg: str):
    print(f"\n{'='*70}")
    print(f" {msg}")
    print(f"{'='*70}\n")

def ask_continue():
    while True:
        choice = input("Step failed. Do you want to continue to the next step? (y/n): ").strip().lower()
        if choice in ['y', 'yes']:
            return True
        if choice in ['n', 'no']:
            return False

def normalize_txn(txn: dict) -> dict:
    """Normalize a Supabase transaction row into the format the ML pipeline expects."""
    t = dict(txn)
    # The feature extractor expects "timestamp", DB has "created_at"
    if "created_at" in t and "timestamp" not in t:
        t["timestamp"] = t["created_at"]
    # The feature extractor expects "transaction_type", DB has "type"  
    if "type" in t and "transaction_type" not in t:
        t["transaction_type"] = t["type"]
    # Convert risk_score ground truth to a boolean "flagged" for ML pipeline
    if "flagged" not in t:
        t["flagged"] = (t.get("risk_score", 0) == 100)
    return t

def main():
    print_banner("🔷 SENTINEL DEMO SETUP — Real Data Pipeline 🔷")
    
    parser = argparse.ArgumentParser(description="Run full Sentinel Demo Setup")
    parser.add_argument("--csv", required=True, help="Path to PaySim CSV file")
    parser.add_argument("--limit", type=int, default=5000, help="Total rows to load (default 5000)")
    parser.add_argument("--contamination", type=float, default=0.05, help="Isolation Forest contamination parameter")
    parser.add_argument("--threshold", type=float, default=0.5, help="Anomaly score threshold")
    parser.add_argument("--supabase-url", help="Supabase URL override")
    parser.add_argument("--supabase-key", help="Supabase Key override")
    args = parser.parse_args()
    
    load_dotenv()
    
    supabase_url = args.supabase_url or os.environ.get("SUPABASE_URL")
    supabase_key = args.supabase_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: Supabase URL and Key are required via args or .env")
        return
        
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return

    total_start_time = time.time()
    
    # --- Step 1: Load PaySim dataset ---
    print_banner("Step 1: Load PaySim dataset")
    step1_start = time.time()
    try:
        target_total = args.limit
        target_fraud = int(target_total * 0.2)
        
        collected_fraud = []
        collected_clean = []
        
        print(f"Reading dataset from {args.csv}...")
        chunk_count = 0
        for chunk in pd.read_csv(args.csv, chunksize=10000):
            chunk_count += 1
            if chunk_count % 10 == 0:
                print(f"  ... processed {chunk_count * 10000} rows from CSV ...")
                
            fraud_rows = chunk[chunk['isFraud'] == 1]
            clean_rows = chunk[chunk['isFraud'] == 0]
            
            c_fraud = sum(len(df) for df in collected_fraud) if collected_fraud else 0
            c_clean = sum(len(df) for df in collected_clean) if collected_clean else 0
            
            if c_fraud < target_fraud:
                collected_fraud.append(fraud_rows.head(target_fraud - c_fraud))
            if c_clean < target_total:
                collected_clean.append(clean_rows.head(target_total - c_clean))
                
            c_fraud = sum(len(df) for df in collected_fraud) if collected_fraud else 0
            c_clean = sum(len(df) for df in collected_clean) if collected_clean else 0
            
            if c_fraud >= target_fraud and c_clean >= target_total:
                print(f"✅ Found enough rows after reading {chunk_count * 10000} CSV rows.")
                break
                
        df_fraud = pd.concat(collected_fraud) if collected_fraud else pd.DataFrame()
        df_clean = pd.concat(collected_clean) if collected_clean else pd.DataFrame()
        
        df_fraud = df_fraud.head(min(len(df_fraud), target_fraud))
        df_clean = df_clean.head(min(len(df_clean), target_total - len(df_fraud)))
        final_df = pd.concat([df_fraud, df_clean]).reset_index(drop=True)
        
        base_date = datetime(2026, 2, 1, 0, 0, 0)
        type_mapping = {"CASH_IN": "CREDIT", "CASH_OUT": "DEBIT", "PAYMENT": "DEBIT", "TRANSFER": "DEBIT", "DEBIT": "DEBIT"}
        
        records = []
        for _, row in final_df.iterrows():
            timestamp = base_date + pd.Timedelta(hours=int(row['step']))
            mapped_type = type_mapping.get(row['type'], "OTHER")
            is_fraud = bool(row['isFraud'])
            records.append({
                "id": str(uuid.uuid4()),
                "user_id": str(row['nameOrig']),
                "counterparty_id": str(row['nameDest']),
                "amount": float(row['amount']),
                "currency": "INR",
                "type": mapped_type,
                "risk_score": 100 if is_fraud else 0,
                "created_at": timestamp.isoformat()
            })

        batch_size = 500
        total_batches = (len(records) + batch_size - 1) // batch_size
        print(f"Uploading {len(records)} records to Supabase in {total_batches} batches...")
        for i in range(0, len(records), batch_size):
            batch_num = (i // batch_size) + 1
            if batch_num % 10 == 0 or batch_num == 1 or batch_num == total_batches:
                print(f"  -> Uploading batch {batch_num}/{total_batches} ({(batch_num/total_batches)*100:.1f}%) ...")
            supabase.table("transactions").upsert(records[i:i + batch_size]).execute()
        
        print(f"✅ Loaded {len(records)} transactions into Supabase")
        print(f"Elapsed: {time.time() - step1_start:.2f}s")
    except Exception as e:
        print(f"❌ Step 1 failed: {e}")
        if not ask_continue(): return

    # --- Fetching All Data ---
    all_transactions = []
    try:
        page_size = 1000
        start = 0
        print("Fetching all transactions back from Supabase for ML processing...")
        while True:
            res = supabase.table("transactions").select("*").range(start, start + page_size - 1).order("created_at", desc=False).execute()
            data = res.data
            if not data: break
            all_transactions.extend(data)
            if len(all_transactions) % 5000 < page_size:
                print(f"  -> Fetched {len(all_transactions)} transactions so far...")
            if len(data) < page_size: break
            start += page_size
    except Exception as e:
        print(f"❌ Failed to fetch transactions: {e}")
        return

    # Normalize all transactions for ML pipeline
    all_transactions = [normalize_txn(t) for t in all_transactions]
    print(f"Total transactions fetched and normalized: {len(all_transactions)}")

    # --- Step 2: Build user profiles ---
    print_banner("Step 2: Build user profiles")
    step2_start = time.time()
    try:
        user_histories, user_profiles = trainer.build_user_data(all_transactions)
        
        os.makedirs("backend/models", exist_ok=True)
        with open("backend/models/user_profiles.pkl", "wb") as f:
            pickle.dump(user_profiles, f)
        with open("backend/models/user_histories.pkl", "wb") as f:
            pickle.dump(user_histories, f)
            
        print(f"✅ Built profiles for {len(user_profiles)} users")
        print(f"Elapsed: {time.time() - step2_start:.2f}s")
    except Exception as e:
        print(f"❌ Step 2 failed: {e}")
        if not ask_continue(): return

    # --- Step 3: Train Isolation Forest ---
    print_banner("Step 3: Train Isolation Forest")
    step3_start = time.time()
    try:
        train_txns = [t for t in all_transactions if not t.get("flagged", False)]
        detector = AnomalyDetector(contamination=args.contamination)
        detector.train(train_txns, user_histories, user_profiles)
        
        detector.save_model("backend/models/isolation_forest.pkl")
        
        print(f"✅ Model trained on {len(train_txns)} clean transactions")
        print(f"   Score range: [{detector.min_score:.4f}, {detector.max_score:.4f}]")
        print(f"Elapsed: {time.time() - step3_start:.2f}s")
    except Exception as e:
        print(f"❌ Step 3 failed: {e}")
        if not ask_continue(): return

    # --- Step 4: Score all transactions ---
    print_banner("Step 4: Score all transactions")
    step4_start = time.time()
    
    tp = fp = tn = fn = 0
    results = []
    ml_alerts = []
    anomalies_detected = 0
    
    try:
        print(f"Starting anomaly scoring for {len(all_transactions)} transactions...")
        for idx, txn in enumerate(all_transactions):
            if idx > 0 and idx % 10000 == 0:
                print(f"  -> Scored {idx}/{len(all_transactions)} transactions...")

            uid = txn.get("user_id")
            flagged = txn.get("flagged", False)
            
            try:
                pred = detector.predict(txn, user_histories.get(uid, []), user_profiles.get(uid, {}))
                score = pred.get("score", 0.0)
                is_anomaly = score > args.threshold
                
                results.append({
                    "txn": txn,
                    "flagged": flagged,
                    "anomaly": is_anomaly,
                    "score": score,
                    "feature_contributions": pred.get("feature_contributions", [])
                })
                
                if flagged and is_anomaly: tp += 1
                elif not flagged and is_anomaly: fp += 1
                elif not flagged and not is_anomaly: tn += 1
                elif flagged and not is_anomaly: fn += 1

                if is_anomaly:
                    anomalies_detected += 1
                    ml_alerts.append({
                        "id": str(uuid.uuid4()),
                        "user_id": uid,
                        "alert_type": "ML_ANOMALY",
                        "severity": "HIGH" if score > 0.75 else "MEDIUM",
                        "status": "PENDING",
                        "details": {
                            "transaction_id": txn.get("id"),
                            "anomaly_score": score,
                            "amount": txn.get("amount"),
                            "counterparty": txn.get("counterparty_id"),
                            "feature_contributions": pred.get("feature_contributions", []),
                            "explanation": scorer.generate_explanation(pred, txn)
                        },
                        "created_at": datetime.utcnow().isoformat()
                    })
            except Exception as e:
                pass
                
        if ml_alerts:
            print(f"Uploading {len(ml_alerts)} ML Alerts to Supabase...")
            for i in range(0, len(ml_alerts), 500):
                if i % 2500 == 0:
                    print(f"  -> Uploaded alert batch {i}/{len(ml_alerts)}")
                supabase.table("alerts").upsert(ml_alerts[i:i+500]).execute()
                
        pct = (anomalies_detected / len(all_transactions)) * 100 if all_transactions else 0
        print(f"✅ Scored {len(all_transactions)} transactions, {anomalies_detected} anomalies detected ({pct:.2f}%)")
        print(f"Elapsed: {time.time() - step4_start:.2f}s")
    except Exception as e:
        print(f"❌ Step 4 failed: {e}")
        if not ask_continue(): return

    # --- Step 5: Build transaction graph ---
    print_banner("Step 5: Build transaction graph")
    step5_start = time.time()
    try:
        graph = TransactionGraphEngine()
        graph.build_graph(all_transactions, user_profiles)
        
        cycles = graph.detect_cycles()
        fan_patterns = graph.detect_fan_patterns()
        
        cycle_alerts = []
        for c in cycles:
            cycle_alerts.append({
                "id": str(uuid.uuid4()), "user_id": c[0], "alert_type": "GRAPH_CYCLE",
                "severity": "HIGH", "status": "PENDING",
                "details": {"nodes": c, "explanation": f"Detected circular money flow among {len(c)} entities."},
                "created_at": datetime.utcnow().isoformat()
            })
            
        fan_alerts = []
        for fan in fan_patterns.get("fan_out", []):
            fan_alerts.append({
                "id": str(uuid.uuid4()), "user_id": fan["node"], "alert_type": "GRAPH_FAN",
                "severity": "MEDIUM", "status": "PENDING",
                "details": {"node": fan["node"], "degree": fan["out_degree"], "type": "fan_out", "explanation": f"Fan-out transfer to {fan['out_degree']} entities."},
                "created_at": datetime.utcnow().isoformat()
            })
            
        for fan in fan_patterns.get("fan_in", []):
            fan_alerts.append({
                "id": str(uuid.uuid4()), "user_id": fan["node"], "alert_type": "GRAPH_FAN",
                "severity": "MEDIUM", "status": "PENDING",
                "details": {"node": fan["node"], "degree": fan["in_degree"], "type": "fan_in", "explanation": f"Fan-in receiving from {fan['in_degree']} entities."},
                "created_at": datetime.utcnow().isoformat()
            })
            
        if cycle_alerts: supabase.table("alerts").upsert(cycle_alerts).execute()
        if fan_alerts: supabase.table("alerts").upsert(fan_alerts).execute()
        
        graph_data = graph.serialize_for_frontend()
        try:
            node_count = len(graph.graph.nodes)
            edge_count = len(graph.graph.edges)
        except:
            node_count = len(graph_data.get("nodes", []))
            edge_count = len(graph_data.get("edges", []))
            
        supabase.table("graph_cache").upsert({
            "id": "latest",
            "graph_data": graph_data,
            "computed_at": datetime.utcnow().isoformat(),
            "node_count": node_count,
            "edge_count": edge_count,
            "cycles_found": len(cycles)
        }).execute()
        
        total_fans = len(fan_patterns.get("fan_out", [])) + len(fan_patterns.get("fan_in", []))
        print(f"✅ Graph: {node_count} nodes, {edge_count} edges, {len(cycles)} cycles, {total_fans} fan patterns")
        print(f"Elapsed: {time.time() - step5_start:.2f}s")
    except Exception as e:
        print(f"❌ Step 5 failed: {e}")
        if not ask_continue(): return

    # --- Step 6: Validate ---
    print_banner("Step 6: Validate")
    try:
        print(f"Confusion Matrix:")
        print(f"  True Positives : {tp}")
        print(f"  False Positives: {fp}")
        print(f"  True Negatives : {tn}")
        print(f"  False Negatives: {fn}")
        
        detection_rate = tp / (tp + fn) if (tp + fn) > 0 else 0
        print(f"\nDetection Rate: {detection_rate:.2%}")
        
        print("\nTop 5 Most Anomalous Transactions:")
        results.sort(key=lambda x: x["score"], reverse=True)
        count = 0
        for r in results:
            if r["anomaly"] and count < 5:
                txn = r["txn"]
                feats = r["feature_contributions"]
                print(f"  - Txn {txn['id'][:8]}... | Score: {r['score']:.4f} | GT Fraud: {r['flagged']}")
                for f in feats[:2]:
                    print(f"      -> {f['feature']}: SHAP={f['contribution']:+.4f} (val: {f['value']:.2f})")
                count += 1
                
        print("\n✅ Demo ready! Start the backend and frontend.")
        print(f"Total time elapsed: {time.time() - total_start_time:.2f}s")
    except Exception as e:
        print(f"❌ Step 6 failed: {e}")

if __name__ == "__main__":
    main()
