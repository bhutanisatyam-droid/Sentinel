"""
Train the Isolation Forest model LOCALLY from a PaySim CSV file.
No Supabase connection required — reads CSV directly, trains the model,
and saves .pkl files to backend/models/.

Usage:
    python scripts/train_local.py --csv PS_20174392719_1491204439457_log.csv --limit 50000
"""
import os
import sys
import argparse
import pickle
import time
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.engine.anomaly.isolation_forest import AnomalyDetector

# ── helpers ──────────────────────────────────────────────────────────

TYPE_MAP = {
    "CASH_IN": "CASH_DEPOSIT",
    "CASH_OUT": "CASH_WITHDRAWAL",
    "PAYMENT": "UPI_PAYMENT",
    "TRANSFER": "UPI_TRANSFER",
    "DEBIT": "NEFT",
}

BASE_DATE = datetime(2026, 2, 1, 0, 0, 0)


def row_to_txn(row) -> dict:
    ts = BASE_DATE + timedelta(hours=int(row["step"]))
    return {
        "id": f"local-{row.name}",
        "user_id": str(row["nameOrig"]),
        "counterparty_id": str(row["nameDest"]),
        "amount": float(row["amount"]),
        "type": TYPE_MAP.get(row["type"], "OTHER"),
        "transaction_type": TYPE_MAP.get(row["type"], "OTHER"),
        "timestamp": ts.isoformat(),
        "created_at": ts.isoformat(),
        "flagged": bool(row["isFraud"]),
        "risk_score": 100 if row["isFraud"] else 0,
    }


def build_user_data(transactions: list[dict]):
    """Build user_profiles and user_histories from a list of txn dicts."""
    user_histories: dict[str, list] = {}
    user_amounts: dict[str, list] = {}
    user_days: dict[str, set] = {}

    sorted_txns = sorted(
        transactions,
        key=lambda x: x.get("timestamp", ""),
    )

    for txn in sorted_txns:
        uid = txn.get("user_id")
        if not uid:
            continue
        user_histories.setdefault(uid, []).append(txn)
        user_amounts.setdefault(uid, []).append(txn.get("amount", 0.0))
        try:
            dt = datetime.fromisoformat(txn["timestamp"].replace("Z", "+00:00"))
            user_days.setdefault(uid, set()).add(dt.date())
        except Exception:
            user_days.setdefault(uid, set())

    user_profiles = {}
    for uid, amounts in user_amounts.items():
        days_active = len(user_days.get(uid, set()))
        user_profiles[uid] = {
            "mean_transaction_amount": float(np.mean(amounts)) if amounts else 0.0,
            "std_transaction_amount": float(np.std(amounts)) if len(amounts) > 1 else 0.0,
            "avg_daily_txn_count": len(amounts) / days_active if days_active > 0 else float(len(amounts)),
        }

    return user_histories, user_profiles


# ── main ─────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Train Isolation Forest locally from PaySim CSV")
    parser.add_argument("--csv", required=True, help="Path to PaySim CSV")
    parser.add_argument("--limit", type=int, default=50000, help="Total rows to sample (default 50000)")
    parser.add_argument("--contamination", type=float, default=0.05, help="IF contamination param")
    parser.add_argument("--threshold", type=float, default=0.5, help="Anomaly threshold for eval")
    parser.add_argument("--output-dir", default="backend/models", help="Directory to save .pkl files")
    args = parser.parse_args()

    print("\n" + "=" * 70)
    print(" 🔷  LOCAL MODEL TRAINING — No Supabase Required")
    print("=" * 70)

    total_t = time.time()

    # ── Step 1 — Sample CSV ──────────────────────────────────────────
    print("\n[1/4] Reading & sampling CSV …")
    t = time.time()

    target_fraud = int(args.limit * 0.2)
    target_clean = args.limit - target_fraud
    collected_fraud, collected_clean = [], []

    for chunk in pd.read_csv(args.csv, chunksize=10_000):
        fraud = chunk[chunk["isFraud"] == 1]
        clean = chunk[chunk["isFraud"] == 0]

        cf = sum(len(d) for d in collected_fraud)
        cc = sum(len(d) for d in collected_clean)

        if cf < target_fraud:
            collected_fraud.append(fraud.head(target_fraud - cf))
        if cc < target_clean:
            collected_clean.append(clean.head(target_clean - cc))

        cf = sum(len(d) for d in collected_fraud)
        cc = sum(len(d) for d in collected_clean)
        if cf >= target_fraud and cc >= target_clean:
            break

    df_fraud = pd.concat(collected_fraud).head(target_fraud) if collected_fraud else pd.DataFrame()
    df_clean = pd.concat(collected_clean).head(target_clean) if collected_clean else pd.DataFrame()
    final_df = pd.concat([df_fraud, df_clean]).reset_index(drop=True)

    transactions = [row_to_txn(row) for _, row in final_df.iterrows()]
    fraud_count = sum(1 for t in transactions if t["flagged"])
    clean_count = len(transactions) - fraud_count

    print(f"  ✅ {len(transactions)} transactions ({fraud_count} fraud / {clean_count} clean)  [{time.time()-t:.1f}s]")

    # ── Step 2 — Build user profiles ─────────────────────────────────
    print("\n[2/4] Building user profiles …")
    t = time.time()
    user_histories, user_profiles = build_user_data(transactions)
    print(f"  ✅ {len(user_profiles)} unique users  [{time.time()-t:.1f}s]")

    # ── Step 3 — Train model ─────────────────────────────────────────
    print("\n[3/4] Training Isolation Forest …")
    t = time.time()
    train_txns = [tx for tx in transactions if not tx["flagged"]]
    detector = AnomalyDetector(contamination=args.contamination)
    detector.train(train_txns, user_histories, user_profiles)
    print(f"  ✅ Trained on {len(train_txns)} clean txns  [{time.time()-t:.1f}s]")
    print(f"     Score range: [{detector.min_score:.4f}, {detector.max_score:.4f}]")

    # ── Save artefacts ───────────────────────────────────────────────
    os.makedirs(args.output_dir, exist_ok=True)
    model_path = os.path.join(args.output_dir, "isolation_forest.pkl")
    profiles_path = os.path.join(args.output_dir, "user_profiles.pkl")
    histories_path = os.path.join(args.output_dir, "user_histories.pkl")

    detector.save_model(model_path)
    with open(profiles_path, "wb") as f:
        pickle.dump(user_profiles, f)
    with open(histories_path, "wb") as f:
        pickle.dump(user_histories, f)
    print(f"\n  Saved →  {model_path}")
    print(f"  Saved →  {profiles_path}")
    print(f"  Saved →  {histories_path}")

    # ── Step 4 — Evaluate ────────────────────────────────────────────
    print("\n[4/4] Evaluating on full dataset …")
    t = time.time()
    tp = fp = tn = fn = 0
    scored = []

    for txn in transactions:
        uid = txn["user_id"]
        pred = detector.predict(txn, user_histories.get(uid, []), user_profiles.get(uid, {}))
        score = pred.get("score", 0.0)
        is_anom = score > args.threshold
        flagged = txn["flagged"]

        if flagged and is_anom:     tp += 1
        elif not flagged and is_anom: fp += 1
        elif not flagged and not is_anom: tn += 1
        else:                        fn += 1

        scored.append({"txn": txn, "score": score, "anomaly": is_anom, "contributions": pred.get("feature_contributions", [])})

    detection_rate = tp / (tp + fn) if (tp + fn) else 0
    precision = tp / (tp + fp) if (tp + fp) else 0

    print(f"\n  Confusion Matrix:")
    print(f"    TP={tp}  FP={fp}")
    print(f"    FN={fn}  TN={tn}")
    print(f"\n  Detection Rate : {detection_rate:.2%}")
    print(f"  Precision      : {precision:.2%}")

    print(f"\n  Top 5 most anomalous:")
    scored.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(scored[:5]):
        tx = r["txn"]
        print(f"    {i+1}. Score={r['score']:.4f}  Amount={tx['amount']:,.0f}  Fraud={tx['flagged']}")
        for c in r["contributions"][:2]:
            print(f"       → {c['feature']}: SHAP={c['contribution']:+.4f}")

    print(f"\n  [{time.time()-t:.1f}s]")
    print(f"\n{'='*70}")
    print(f"  ✅ Done! Total time: {time.time()-total_t:.1f}s")
    print(f"  Model ready at {model_path}")
    print(f"  Start backend with: uvicorn main:app --reload")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    main()
