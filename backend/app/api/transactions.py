from fastapi import APIRouter, Depends, HTTPException, Body, Query, status, Request
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta, timezone
import uuid
import json
import logging
import statistics
from pydantic import BaseModel
from app.api.dependencies import require_role, get_current_user, get_optional_user
from app.engine.engine import AMLEngine
from app.engine.rules.base import RuleContext
from app.lib.supabase import supabase
from app.providers.base import get_provider, LLMProvider

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

class TransactionCheckRequest(BaseModel):
    user_id: str
    amount: float
    type: str
    timestamp: Optional[datetime] = None
    counterparty: Optional[str] = None
    location: Optional[List[float]] = None # [lat, lon]

@router.post("/check")
async def check_transaction(
    request: Request,
    body: TransactionCheckRequest,
    current_user: Dict[str, str] = Depends(require_role("officer", "system", "admin"))
):
    """
    Run a transaction through the AML Engine and ML Anomaly Detector.
    Returns risk score, triggered rules, and ML anomaly flag.
    """
    engine = AMLEngine()
    
    # 1. Fetch user profile for context (age, occupation, etc.)
    profile_res = supabase.table("profiles").select("*").eq("id", body.user_id).single().execute()
    profile = profile_res.data if profile_res.data else {"kyc_risk_tier": "LOW", "occupation": "Unknown", "age_days": 0}
        
    recent_res = supabase.table("transactions").select("*").eq("user_id", body.user_id).order("timestamp", desc=True).limit(10).execute()
    recent_txns = recent_res.data or []
    
    previous_locations = []
    if recent_txns:
        for t in recent_txns[:10]:
            if t.get("latitude") and t.get("longitude"):
                try:
                    ts = datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00"))
                except:
                    continue
                previous_locations.append({
                    "lat": t["latitude"],
                    "lon": t["longitude"],
                    "timestamp": ts
                })

    # Build previous_locations baseline starting with KYC location
    prev_locs = []
    if profile.get("kyc_latitude") is not None and profile.get("kyc_longitude") is not None:
        try:
            kyc_ts_str = profile.get("kyc_location_captured_at")
            kyc_ts = datetime.fromisoformat(kyc_ts_str.replace("Z", "+00:00")) if kyc_ts_str else datetime.utcnow()
            prev_locs.append({
                "lat": profile["kyc_latitude"],
                "lon": profile["kyc_longitude"],
                "timestamp": kyc_ts
            })
        except Exception:
            pass
    
    # Add recent transaction locations to prev_locs
    prev_locs.extend(previous_locations)

    ctx = RuleContext(
        user_id=body.user_id,
        transaction_amount=body.amount,
        transaction_type=body.type,
        transaction_time=body.timestamp or datetime.utcnow(),
        user_risk_tier=profile.get("kyc_risk_tier", "LOW"),
        user_occupation=profile.get("occupation", "Unknown"),
        location=tuple(body.location) if body.location and len(body.location) == 2 else None,
        previous_locations=prev_locs
    )
    
    # 2. Rules Engine
    results = engine.evaluate(ctx)
    rules_score = engine.compute_transaction_risk(results)
    
    # 3. ML Anomaly Detection (if loaded)
    anomaly_detector = getattr(request.app.state, "anomaly_detector", None)
    
    is_anomaly = False
    ml_score = 0.0
    ml_explanations = []
    
    if anomaly_detector:
        # Build synthetic transaction dict
        txn_dict = {
            "id": str(uuid.uuid4()),
            "user_id": body.user_id,
            "amount": body.amount,
            "transaction_type": body.type,
            "timestamp": (body.timestamp or datetime.utcnow()).isoformat(),
            "counterparty_id": body.counterparty
        }
        
        # Get historical context
        user_histories = getattr(request.app.state, "user_histories", {})
        user_profiles = getattr(request.app.state, "user_profiles", {})
        history = user_histories.get(body.user_id, [])
        user_stats = user_profiles.get(body.user_id, {})
        
        try:
            ml_pred = anomaly_detector.predict(txn_dict, history, user_stats)
            is_anomaly = ml_pred.get("score", 0.0) > 0.5
            ml_score = ml_pred.get("score", 0.0)
            ml_explanations = ml_pred.get("feature_contributions", [])
            
            # Create Alert if anomalous
            if is_anomaly:
                alert = {
                    "id": str(uuid.uuid4()),
                    "user_id": body.user_id,
                    "alert_type": "ML_ANOMALY",
                    "severity": "HIGH" if ml_score > 0.75 else "MEDIUM",
                    "status": "PENDING",
                    "details": {
                        "transaction_id": txn_dict["id"],
                        "anomaly_score": ml_score,
                        "amount": body.amount,
                        "counterparty": body.counterparty,
                        "feature_contributions": ml_explanations,
                        "explanation": f"Live transaction scored {ml_score:.3f} anomaly score."
                    },
                    "created_at": datetime.utcnow().isoformat()
                }
                supabase.table("alerts").insert(alert).execute()
                
        except Exception as e:
            print(f"ML Scoring failed: {e}")
            
    # If any rules triggered, create Alert
    if rules_score > 0 and results:
        severity = "CRITICAL" if rules_score >= 80 else "HIGH" if rules_score >= 50 else "MEDIUM" if rules_score >= 25 else "LOW"
        
        alert_entry = {
            "id": str(uuid.uuid4()),
            "user_id": body.user_id,
            "alert_type": "RULE_ALERT",
            "severity": severity,
            "status": "PENDING",
            "risk_score": rules_score,
            "details": json.dumps({
                "transaction_amount": body.amount,
                "transaction_type": body.type,
                "triggered_rules": [
                    {
                        "rule_id": r.rule_id,
                        "rule_name": r.rule_name,
                        "severity": r.severity.value,
                        "confidence": r.confidence,
                        "explanation": r.explanation
                    }
                    for r in results
                ]
            }),
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("alerts").insert(alert_entry).execute()
        
    final_verdict = "BLOCK" if rules_score >= 90 else "REVIEW" if (rules_score >= 50 or is_anomaly) else "ALLOW"
        
    return {
        "risk_score": rules_score,
        "ml_anomaly_score": ml_score,
        "is_anomaly": is_anomaly,
        "verdict": final_verdict,
        "triggered_rules": [
            {
                "rule_id": r.rule_id, 
                "name": r.rule_name, 
                "severity": r.severity.value,
                "explanation": r.explanation
            } 
            for r in results
        ],
        "ml_explanations": ml_explanations
    }

class TransactionSubmitRequest(BaseModel):
    user_id: str
    counterparty_id: str
    amount: float
    transaction_type: str = "UPI_TRANSFER"
    description: Optional[str] = None
    location: Optional[List[float]] = None # [lat, lon]


@router.post("/submit")
async def submit_transaction(
    fastapi_req: Request,
    request: TransactionSubmitRequest,
    current_user: Dict[str, str] = Depends(get_optional_user)
):
    """
    Submit a new transaction. Scores through Rules + ML in real-time.
    Creates alerts automatically for flagged transactions.
    """
    now = datetime.now(timezone.utc)
    txn_id = str(uuid.uuid4())
    
    # 1. Insert into transactions table
    txn_record = {
        "id": txn_id,
        "user_id": request.user_id,
        "counterparty_id": request.counterparty_id,
        "amount": request.amount,
        "type": request.transaction_type,
        "created_at": now.isoformat(),
        "latitude": request.location[0] if request.location else None,
        "longitude": request.location[1] if request.location else None,
    }
    supabase.table("transactions").insert(txn_record).execute()
    
    # 2. Fetch user profile and recent transactions for context
    try:
        profile_res = supabase.table("profiles").select("*").eq("id", request.user_id).execute()
        profile = profile_res.data[0] if profile_res.data else {}
    except Exception:
        profile = {}
    
    try:
        recent_res = (supabase.table("transactions")
            .select("*")
            .eq("user_id", request.user_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute())
        recent_txns = recent_res.data or []
    except Exception:
        recent_txns = []
    
    # Build quick user profile from recent txns if no profile exists
    amounts = [t["amount"] for t in recent_txns if t.get("amount")]
    user_mean = statistics.mean(amounts) if amounts else 5000.0
    user_std = statistics.stdev(amounts) if len(amounts) > 1 else 0.0
    
    # 3. LAYER 1: Rules Engine
    aml_engine = AMLEngine()
    
    previous_locations = []
    
    # Add KYC Location as baseline
    if profile.get("kyc_latitude") is not None and profile.get("kyc_longitude") is not None:
        try:
            kyc_ts_str = profile.get("kyc_location_captured_at")
            kyc_ts = datetime.fromisoformat(kyc_ts_str.replace("Z", "+00:00")) if kyc_ts_str else datetime.utcnow()
            previous_locations.append({
                "lat": profile["kyc_latitude"],
                "lon": profile["kyc_longitude"],
                "timestamp": kyc_ts
            })
        except Exception:
            pass

    if recent_txns:
        for t in recent_txns[:10]:
            if t.get("latitude") and t.get("longitude"):
                try:
                    ts = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00"))
                except:
                    continue
                previous_locations.append({
                    "lat": t["latitude"],
                    "lon": t["longitude"],
                    "timestamp": ts
                })
    
    # Format recent txns for the rules engine
    formatted_recent = []
    for t in recent_txns:
        # DB column is 'created_at', DB enum column is 'type'
        try:
            ts = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00")) if isinstance(t.get("created_at"), str) else t.get("created_at", now)
        except:
            ts = now
            
        formatted_recent.append({
            "amount": t.get("amount", 0.0),
            "timestamp": ts,  # Rule engine still expects 'timestamp' conceptually
            "type": t.get("type", "DEBIT"),
            "id": t.get("id")
        })
    
    ctx = RuleContext(
        user_id=request.user_id,
        transaction_amount=request.amount,
        transaction_type=request.transaction_type,
        transaction_time=now,
        user_age_days=profile.get("account_age_days", 365),
        user_occupation=profile.get("occupation", "Unknown"),
        user_risk_tier=profile.get("kyc_risk_tier", "LOW"),
        user_avg_transaction=user_mean,
        user_last_activity_days=1,
        recent_transactions=formatted_recent,
        location=tuple(request.location) if request.location else None,
        previous_locations=previous_locations,
    )
    
    rule_results = aml_engine.evaluate(ctx)
    rule_score = aml_engine.compute_transaction_risk(rule_results)
    
    # 4. LAYER 2: Isolation Forest (if loaded)
    ml_result = {"anomaly": False, "score": 0.0, "feature_contributions": []}
    
    # Access app state for the loaded model
    try:
        anomaly_detector = getattr(fastapi_req.app.state, "anomaly_detector", None)
        if anomaly_detector and anomaly_detector.is_trained:
            user_profile_for_ml = {
                "mean_transaction_amount": user_mean,
                "std_transaction_amount": user_std,
                "avg_daily_txn_count": len(recent_txns) / max(7, 1),
            }
            ml_result = anomaly_detector.predict(txn_record, recent_txns, user_profile_for_ml)
    except Exception as e:
        logging.warning(f"ML scoring skipped: {e}")
    
    # 5. Combine scores
    ml_score_contribution = min(int(ml_result["score"] * 40), 40) if ml_result["anomaly"] else 0
    total_score = min(rule_score + ml_score_contribution, 100)
    
    # 6. Determine verdict
    verdict = "BLOCK" if total_score >= 90 else "REVIEW" if total_score >= 50 else "FLAG" if total_score > 0 else "ALLOW"
    
    # 7. Create alert if flagged
    alert_id = None
    if total_score > 0:
        severity = "CRITICAL" if total_score >= 80 else "HIGH" if total_score >= 50 else "MEDIUM" if total_score >= 25 else "LOW"
        
        layers_triggered = []
        for r in rule_results:
            layers_triggered.append({
                "layer": "RULES",
                "rule_id": r.rule_id,
                "rule_name": r.rule_name,
                "severity": r.severity.value,
                "confidence": r.confidence,
                "explanation": r.explanation
            })
        if ml_result["anomaly"]:
            layers_triggered.append({
                "layer": "ML",
                "type": "ISOLATION_FOREST",
                "anomaly_score": ml_result["score"],
                "feature_contributions": ml_result.get("feature_contributions", [])
            })
        
        alert_id = str(uuid.uuid4())
        
        # ── LLM Explainability generation ──
        llm = get_provider(LLMProvider)
        llm_explanation = None
        if llm:
            try:
                llm_explanation = await llm.generate_alert_summary({
                    "transaction": {
                        "amount": request.amount, 
                        "type": request.transaction_type, 
                        "user_id": request.user_id,
                        "counterparty_id": request.counterparty_id
                    },
                    "risk_score": total_score,
                    "rules_triggered": [r["rule_name"] for r in layers_triggered if r["layer"] == "RULES"],
                    "ml_anomaly": ml_result["anomaly"],
                    "ml_features": ml_result.get("feature_contributions", [])
                })
            except Exception as e:
                logging.error(f"Failed to generate LLM explanation during /submit: {e}")
        
        alert_entry = {
            "id": alert_id,
            "user_id": request.user_id,
            "transaction_id": txn_id,
            "severity": severity,
            "source": "ML" if ml_result["anomaly"] else "RULE",
            "status": "PENDING",
            "triggered_rules": [rule.get("rule_id", "ML_ISOLATION_FOREST") for rule in layers_triggered],
            "ai_summary": llm_explanation,
            "priority_rank": int(total_score),
            "details": json.dumps({
                "transaction_amount": request.amount,
                "transaction_type": request.transaction_type,
                "counterparty_id": request.counterparty_id
            }),
            "created_at": now.isoformat()
        }
        try:
            supabase.table("alerts").insert(alert_entry).execute()
        except Exception as e:
            logging.warning(f"Could not insert alert {alert_id} (might be constraint issue): {e}")
        
        # Also mark the transaction as flagged
        try:
            supabase.table("transactions").update({"flagged": True}).eq("id", txn_id).execute()
        except Exception as e:
            logging.warning(f"Could not update transaction {txn_id} 'flagged' column (might be schema cache issue): {e}")
    
    # 8. Return full result
    return {
        "transaction_id": txn_id,
        "risk_score": total_score,
        "verdict": verdict,
        "alert_id": alert_id,
        "llm_explanation": llm_explanation if total_score > 0 else None,
        "layers": {
            "rules": {
                "score": rule_score,
                "triggered": [
                    {
                        "rule_id": r.rule_id,
                        "rule_name": r.rule_name,
                        "severity": r.severity.value,
                        "confidence": r.confidence,
                        "explanation": r.explanation
                    }
                    for r in rule_results
                ]
            },
            "ml": {
                "anomaly": ml_result["anomaly"],
                "score": ml_result["score"],
                "score_contribution": ml_score_contribution,
                "feature_contributions": ml_result.get("feature_contributions", [])
            }
        }
    }



@router.get("/{user_id}")
async def get_transaction_history(
    user_id: str,
    page: int = 1,
    per_page: int = 20,
    current_user: Dict[str, str] = Depends(get_optional_user)
):
    # Allow fetching if officer/admin, or if asking for own id, or if it's a demo user.
    if current_user["role"] not in ["officer", "admin"] and current_user["user_id"] != user_id and not user_id.startswith("demo_"):
        raise HTTPException(status_code=403, detail="Access denied")
        
    offset = (page - 1) * per_page
    
    # Mock response if table doesn't exist yet, or query real table
    # Assuming 'transactions' table exists or will exist
    try:
        res = supabase.table("transactions").select("*", count="exact").eq("user_id", user_id).range(offset, offset + per_page - 1).execute()
        return {
            "data": res.data,
            "count": res.count,
            "page": page
        }
    except Exception:
        # Table might not exist in early dev
        return {"data": [], "count": 0, "page": page, "note": "No transactions found or table missing"}


class CreateTransactionRequest(BaseModel):
    fromUserId: str
    toUserId: Optional[str] = None
    amount: float
    type: str = "UPI_TRANSFER"
    note: Optional[str] = None


class DepositRequest(BaseModel):
    userId: str
    amount: float


@router.post("/create")
async def create_transaction(body: CreateTransactionRequest):
    """Create a new transaction (demo endpoint)."""
    txn = {
        "id": str(uuid.uuid4()),
        "user_id": body.fromUserId,
        "counterparty_id": body.toUserId or "SYSTEM",
        "amount": body.amount,
        "currency": "INR",
        "type": body.type,
        "risk_score": 0,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        supabase.table("transactions").insert(txn).execute()
    except Exception:
        pass  # Silently fail for demo if table doesn't exist

    return txn


@router.post("/deposit")
async def deposit(body: DepositRequest):
    """Deposit money into a user's account (demo endpoint)."""
    txn = {
        "id": str(uuid.uuid4()),
        "user_id": body.userId,
        "counterparty_id": "BANK_DEPOSIT",
        "amount": body.amount,
        "currency": "INR",
        "type": "CASH_DEPOSIT",
        "risk_score": 0,
        "status": "completed",
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        supabase.table("transactions").insert(txn).execute()
    except Exception:
        pass

    return {
        "balance": body.amount + 50000,  # Demo balance
        "transaction": txn,
    }

