import os
import sys
import argparse
import logging
import pickle
import uuid
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.engine.anomaly.isolation_forest import AnomalyDetector
from app.engine.graph.graph_engine import TransactionGraphEngine

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

def generate_explanation(result, txn):
    top_feature = result["feature_contributions"][0] if result.get("feature_contributions") else None
    if top_feature:
        return (f"Transaction of amount {txn['amount']:,.2f} scored {result['score']:.3f} "
                f"anomaly score. Top contributing factor: {top_feature['feature']} "
                f"(contribution: {top_feature['contribution']:+.4f}, value: {top_feature['value']:.2f})")
    return f"Transaction scored {result['score']:.3f} anomaly score."

def main():
    parser = argparse.ArgumentParser(description="Run Scoring Pipeline over all transactions")
    parser.add_argument("--threshold", type=float, default=0.5, help="Anomaly score threshold")
    parser.add_argument("--model-path", type=str, default="backend/models/isolation_forest.pkl", help="Path to trained model")
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

    # Load Model
    models_dir = os.path.dirname(args.model_path)
    profiles_path = os.path.join(models_dir, "user_profiles.pkl")
    histories_path = os.path.join(models_dir, "user_histories.pkl")
    
    if not os.path.exists(args.model_path) or not os.path.exists(profiles_path) or not os.path.exists(histories_path):
        logger.error("Model or data files not found. Did you run train_model.py first?")
        return

    logger.info("Loading trained model and user data...")
    detector = AnomalyDetector()
    detector.load_model(args.model_path)
    
    with open(profiles_path, "rb") as f:
        user_profiles = pickle.load(f)
    with open(histories_path, "rb") as f:
        user_histories = pickle.load(f)
        
    # Fetch all transactions
    logger.info("Fetching transactions from Supabase...")
    all_transactions = []
    page_size = 1000
    start = 0
    
    while True:
        try:
            res = supabase.table("transactions").select("*").range(start, start + page_size - 1).order("created_at", desc=False).execute()
            data = res.data
            if not data:
                break
            all_transactions.extend(data)
            if len(data) < page_size:
                break
            start += page_size
        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            break
            
    logger.info(f"Total transactions fetched: {len(all_transactions)}")
    
    # Normalize all transactions for ML pipeline
    all_transactions = [normalize_txn(t) for t in all_transactions]
    
    # 1. Anomaly Detection
    logger.info("Running anomaly detection scoring...")
    ml_alerts = []
    ml_anomalies_count = 0
    top_anomalous = []
    
    for txn in all_transactions:
        uid = txn.get("user_id")
        history = user_histories.get(uid, [])
        profile = user_profiles.get(uid, {})
        
        try:
            result = detector.predict(txn, history, profile)
            score = result.get("score", 0.0)
            
            # Keep top 10 for summary
            top_anomalous.append({
                "txn_id": txn.get("id"),
                "score": score,
                "amount": txn.get("amount")
            })
            
            # Use provided threshold instead of model's boolean (which uses 0.5 implicitly typically)
            if score > args.threshold:
                ml_anomalies_count += 1
                
                alert = {
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
                        "feature_contributions": result.get("feature_contributions", []),
                        "explanation": generate_explanation(result, txn)
                    },
                    "created_at": datetime.utcnow().isoformat()
                }
                ml_alerts.append(alert)
                
        except Exception as e:
            logger.warning(f"Error scoring transaction {txn.get('id')}: {e}")
            
    # Sort top anomalous
    top_anomalous.sort(key=lambda x: x["score"], reverse=True)
    top_10 = top_anomalous[:10]
            
    if ml_alerts:
        logger.info(f"Inserting {len(ml_alerts)} ML anomaly alerts...")
        # Insert in batches
        for i in range(0, len(ml_alerts), 500):
            try:
                supabase.table("alerts").upsert(ml_alerts[i:i+500]).execute()
            except Exception as e:
                logger.error(f"Failed to insert ML alerts batch: {e}")
                
    # 2. Graph Processing
    logger.info("Building Transaction Graph...")
    graph = TransactionGraphEngine()
    graph.build_graph(all_transactions, user_profiles)
    
    # 2.1 Graph Cycle Alerts
    logger.info("Detecting graph cycles...")
    cycles = graph.detect_cycles()
    cycle_alerts = []
    for c in cycles:
        cycle_alerts.append({
            "id": str(uuid.uuid4()),
            "user_id": c[0], # Using first node as primary
            "alert_type": "GRAPH_CYCLE",
            "severity": "HIGH",
            "status": "PENDING",
            "details": {
                "nodes": c,
                "explanation": f"Detected circular money flow among {len(c)} entities."
            },
            "created_at": datetime.utcnow().isoformat()
        })
        
    if cycle_alerts:
        logger.info(f"Inserting {len(cycle_alerts)} cycle alerts...")
        try:
            supabase.table("alerts").upsert(cycle_alerts).execute()
        except Exception as e:
            logger.error(f"Failed to insert cycle alerts: {e}")

    # 2.2 Graph Fan Alerts
    logger.info("Detecting graph fan patterns...")
    fan_patterns = graph.detect_fan_patterns()
    fan_alerts = []
    
    for fan in fan_patterns.get("fan_out", []):
        fan_alerts.append({
            "id": str(uuid.uuid4()),
            "user_id": fan["node"],
            "alert_type": "GRAPH_FAN",
            "severity": "MEDIUM",
            "status": "PENDING",
            "details": {
                "node": fan["node"],
                "degree": fan["out_degree"],
                "total_amount": fan["total_amount"],
                "type": "fan_out",
                "explanation": f"Node exhibits high fan-out (1-to-N) transferring to {fan['out_degree']} entities."
            },
            "created_at": datetime.utcnow().isoformat()
        })
        
    for fan in fan_patterns.get("fan_in", []):
        fan_alerts.append({
            "id": str(uuid.uuid4()),
            "user_id": fan["node"],
            "alert_type": "GRAPH_FAN",
            "severity": "MEDIUM",
            "status": "PENDING",
            "details": {
                "node": fan["node"],
                "degree": fan["in_degree"],
                "total_amount": fan["total_amount"],
                "type": "fan_in",
                "explanation": f"Node exhibits high fan-in (N-to-1) receiving from {fan['in_degree']} entities."
            },
            "created_at": datetime.utcnow().isoformat()
        })

    if fan_alerts:
        logger.info(f"Inserting {len(fan_alerts)} fan alerts...")
        try:
            supabase.table("alerts").upsert(fan_alerts).execute()
        except Exception as e:
            logger.error(f"Failed to insert fan alerts: {e}")

    # 2.3 Serialize and Cache Graph
    logger.info("Serializing graph for frontend cache...")
    serialized_json = graph.serialize_for_frontend()
    
    # In networkx 3.x, G.nodes and G.edges behave slightly differently but len() works
    node_count = len(graph.graph.nodes)
    edge_count = len(graph.graph.edges)
    
    try:
        supabase.table("graph_cache").upsert({
            "id": "latest",
            "graph_data": serialized_json,
            "computed_at": datetime.utcnow().isoformat(),
            "node_count": node_count,
            "edge_count": edge_count,
            "cycles_found": len(cycles)
        }).execute()
        logger.info("Saved graph cache.")
    except Exception as e:
        logger.error(f"Failed to update graph_cache: {e}")

    # Summary
    logger.info("\n=== Scoring Summary ===")
    logger.info(f"Total transactions scored: {len(all_transactions)}")
    
    pct = (ml_anomalies_count / len(all_transactions) * 100) if all_transactions else 0
    logger.info(f"Anomalies detected (>{args.threshold} score): {ml_anomalies_count} ({pct:.2f}%)")
    
    logger.info("\n--- Alerts Created ---")
    logger.info(f"ML_ANOMALY: {len(ml_alerts)}")
    logger.info(f"GRAPH_CYCLE: {len(cycle_alerts)}")
    logger.info(f"GRAPH_FAN: {len(fan_alerts)}")
    
    logger.info("\n--- Graph Stats ---")
    logger.info(f"Nodes: {node_count}")
    logger.info(f"Edges: {edge_count}")
    logger.info(f"Cycles: {len(cycles)}")
    
    logger.info("\n--- Top 10 Anomalous Transactions ---")
    for r in top_10:
        logger.info(f"Txn: {r['txn_id']} | Score: {r['score']:.4f} | Amount: {r['amount']:,.2f}")

if __name__ == "__main__":
    main()
