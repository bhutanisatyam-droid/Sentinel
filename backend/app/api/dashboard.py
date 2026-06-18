from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from typing import List, Dict, Optional, Any
from app.api.dependencies import require_role, get_optional_user
from app.lib.supabase import supabase
from datetime import datetime, timedelta
import subprocess
import os
import sys

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def run_script_and_log(script_path: str, cwd: str):
    """Run a script and stream its output to the main stdout line-by-line."""
    try:
        process = subprocess.Popen(
            [sys.executable, "-u", script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd=cwd
        )
        for line in iter(process.stdout.readline, ""):
            if line:
                print(f"[DEMO-SCRIPT] {line}", end="")
                sys.stdout.flush()
        process.stdout.close()
        process.wait()
        print(f"[DEMO-SCRIPT] Script {os.path.basename(script_path)} finished with exit code {process.returncode}")
        sys.stdout.flush()
    except Exception as e:
        print(f"[DEMO-SCRIPT] ❌ Error running script: {e}")
        sys.stdout.flush()

@router.post("/run-demo")
async def run_demo_script(background_tasks: BackgroundTasks, current_user: Dict[str, str] = Depends(get_optional_user)):
    """Trigger the run_demo_transactions.py script to generate mock data."""
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        script_path = os.path.join(backend_dir, "scripts", "run_demo_transactions.py")
        background_tasks.add_task(run_script_and_log, script_path, backend_dir)
        return {"status": "success", "message": "Demo simulation started in background. It will take ~30 seconds to complete."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-geo-demo")
async def run_geo_demo_script(background_tasks: BackgroundTasks, current_user: Dict[str, str] = Depends(get_optional_user)):
    """Trigger the run_geo_demo.py script to generate impossible travel data."""
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        script_path = os.path.join(backend_dir, "scripts", "run_geo_demo.py")
        background_tasks.add_task(run_script_and_log, script_path, backend_dir)
        return {"status": "success", "message": "Geo Demo started in background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-demo")
async def reset_demo_script(background_tasks: BackgroundTasks, current_user: Dict[str, str] = Depends(get_optional_user)):
    """Trigger the reset_demo_data.py script to clear mock data."""
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        script_path = os.path.join(backend_dir, "scripts", "reset_demo_data.py")
        background_tasks.add_task(run_script_and_log, script_path, backend_dir)
        return {"status": "success", "message": "Demo reset started in background."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
async def get_dashboard_metrics(
    current_user: Dict[str, str] = Depends(require_role("analyst", "officer", "admin"))
):
    """
    Get all KPIs for the overview dashboard:
    - Risk distribution by tier
    - Alert velocity (hourly, last 24h)
    - False positive rate
    - Mean time to resolution (MTTR)
    - Top triggered rules
    - Active alerts count
    - Pending KYC count
    """
    import logging
    log = logging.getLogger(__name__)
    start_24h = (datetime.utcnow() - timedelta(hours=24)).isoformat()

    # ── 1. Risk Distribution ──────────────────────────────────────────
    risk_distribution = []
    try:
        for tier in ["LOW", "MEDIUM", "HIGH", "BLACKLIST"]:
            res = supabase.table("profiles").select("id", count="exact").eq("risk_tier", tier).execute()
            risk_distribution.append({"tier": tier, "count": res.count or 0})
    except Exception as e:
        log.warning(f"Risk distribution query failed: {e}")
        risk_distribution = [
            {"tier": "LOW", "count": 0}, {"tier": "MEDIUM", "count": 0},
            {"tier": "HIGH", "count": 0}, {"tier": "BLACKLIST", "count": 0},
        ]

    # ── 2. Alert Velocity (hourly buckets, last 24h) ──────────────────
    alert_count_24h = 0
    alert_velocity_hourly = []
    try:
        alerts_24h = supabase.table("alerts").select("created_at").gte("created_at", start_24h).limit(5000).execute()
        alert_count_24h = len(alerts_24h.data) if alerts_24h.data else 0

        # Build hourly histogram
        buckets = {h: 0 for h in range(24)}
        now = datetime.utcnow()
        for a in (alerts_24h.data or []):
            try:
                ts = datetime.fromisoformat(a["created_at"].replace("Z", "+00:00")).replace(tzinfo=None)
                hours_ago = int((now - ts).total_seconds() / 3600)
                if 0 <= hours_ago < 24:
                    buckets[23 - hours_ago] += 1
            except Exception:
                pass
        alert_velocity_hourly = [{"hour": f"{h:02d}:00", "alerts": buckets[h]} for h in range(24)]
    except Exception as e:
        log.warning(f"Alert velocity query failed: {e}")
        alert_velocity_hourly = [{"hour": f"{h:02d}:00", "alerts": 0} for h in range(24)]

    alerts_per_hour = round(alert_count_24h / 24, 2)

    # ── 3. False Positive Rate ────────────────────────────────────────
    false_positive_rate = 0.0
    total_resolved = 0
    try:
        resolved_res = supabase.table("alerts").select("resolution", count="exact").eq("status", "RESOLVED").execute()
        total_resolved = resolved_res.count or 0
        if total_resolved > 0:
            fp_res = supabase.table("alerts").select("id", count="exact").eq("status", "RESOLVED").eq("resolution", "DISMISSED").execute()
            false_positive_rate = round(((fp_res.count or 0) / total_resolved) * 100, 1)
    except Exception as e:
        log.warning(f"False positive query failed: {e}")

    # ── 4. Mean Time to Resolution (MTTR) ─────────────────────────────
    mttr_hours = None
    try:
        resolved = supabase.table("alerts").select("created_at, resolved_at").eq("status", "RESOLVED").not_.is_("resolved_at", "null").limit(200).execute()
        if resolved.data:
            durations = []
            for r in resolved.data:
                try:
                    created = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00")).replace(tzinfo=None)
                    resolved_at = datetime.fromisoformat(r["resolved_at"].replace("Z", "+00:00")).replace(tzinfo=None)
                    hours = (resolved_at - created).total_seconds() / 3600
                    if hours >= 0:
                        durations.append(hours)
                except Exception:
                    pass
            if durations:
                mttr_hours = round(sum(durations) / len(durations), 1)
    except Exception as e:
        log.warning(f"MTTR query failed: {e}")

    # ── 5. Top Triggered Rules ────────────────────────────────────────
    top_rules = []
    try:
        rules_res = supabase.table("alerts").select("rule_name").not_.is_("rule_name", "null").limit(2000).execute()
        if rules_res.data:
            from collections import Counter
            counts = Counter(r["rule_name"] for r in rules_res.data if r.get("rule_name"))
            top_rules = [{"rule": name, "count": cnt} for name, cnt in counts.most_common(5)]
    except Exception as e:
        log.warning(f"Top rules query failed: {e}")

    # ── 6. Pending KYC ────────────────────────────────────────────────
    pending_kyc = 0
    try:
        kyc_res = supabase.table("profiles").select("id", count="exact").eq("kyc_status", "PENDING_REVIEW").execute()
        pending_kyc = kyc_res.count or 0
    except Exception as e:
        log.warning(f"Pending KYC query failed: {e}")

    # ── 7. Active (unresolved) alerts count ───────────────────────────
    active_alerts = 0
    try:
        active_res = supabase.table("alerts").select("id", count="exact").neq("status", "RESOLVED").execute()
        active_alerts = active_res.count or 0
    except Exception as e:
        log.warning(f"Active alerts query failed: {e}")

    return {
        "risk_distribution": risk_distribution,
        "alert_velocity": {
            "total_24h": alert_count_24h,
            "avg_per_hour": alerts_per_hour,
            "hourly": alert_velocity_hourly,
        },
        "false_positive_rate": false_positive_rate,
        "total_resolved": total_resolved,
        "mttr_hours": mttr_hours,
        "top_triggered_rules": top_rules,
        "active_alerts": active_alerts,
        "pending_kyc_reviews": pending_kyc,
    }

import logging

logger = logging.getLogger(__name__)

EMPTY_GRAPH = {"nodes": [], "edges": [], "cycles": [], "communities": [], "fanPatterns": {"fan_out": [], "fan_in": []}, "stats": {"nodeCount": 0, "edgeCount": 0, "cycleCount": 0, "communityCount": 0}}


async def _build_graph(days: int = 30) -> dict:
    """Shared helper: fetch txns + profiles, build graph, return serialised data."""
    from app.engine.graph.graph_engine import TransactionGraphEngine

    start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

    # Fetch transactions
    tx_res = supabase.table("transactions").select("*").gte("created_at", start_date).limit(5000).execute()
    transactions = tx_res.data
    if not transactions:
        return EMPTY_GRAPH

    # Collect unique user IDs from transactions
    user_ids = set()
    for txn in transactions:
        if txn.get("user_id"):
            user_ids.add(txn["user_id"])
        if txn.get("counterparty_id"):
            user_ids.add(txn["counterparty_id"])

    # Fetch user profiles for graph enrichment
    user_profiles: dict = {}
    if user_ids:
        try:
            profiles_res = supabase.table("profiles").select(
                "id, full_name, risk_score, risk_tier, occupation, device_id, ip_address, phone"
            ).in_("id", list(user_ids)).execute()
            for p in profiles_res.data:
                user_profiles[p["id"]] = {
                    "risk_score": p.get("risk_score", 0.0),
                    "tier": p.get("risk_tier", "standard"),
                    "occupation": p.get("occupation", "unknown"),
                    "device_id": p.get("device_id"),
                    "ip_address": p.get("ip_address"),
                    "phone": p.get("phone"),
                }
        except Exception as e:
            logger.warning(f"Could not fetch profiles for graph enrichment: {e}")

    # Build graph
    engine = TransactionGraphEngine()
    engine.build_graph(transactions, user_profiles=user_profiles)

    return engine.serialize_for_frontend()


@router.get("/money-map")
async def get_money_map(
    days: int = 30,
    current_user: Dict[str, str] = Depends(get_optional_user)
):
    """
    Build transaction graph for visualization.
    Nodes: Users/Entities. Edges: Transactions.
    Includes shared-attribute links, community detection, and cycle analysis.
    """
    try:
        # 1. Try to read from cache first
        try:
            cache_res = supabase.table("graph_cache").select("*").eq("id", "latest").execute()
            if cache_res.data:
                cache_entry = cache_res.data[0]
                computed_at_str = cache_entry.get("computed_at")
                if computed_at_str:
                    computed_at = datetime.fromisoformat(computed_at_str.replace('Z', '+00:00'))
                    if datetime.utcnow() - computed_at.replace(tzinfo=None) < timedelta(minutes=15):
                        return cache_entry.get("graph_data", EMPTY_GRAPH)
        except Exception:
            pass  # Cache miss — compute fresh

        # 2. Compute fresh graph
        graph_data = await _build_graph(days)

        # 3. Store to cache
        try:
            stats = graph_data.get("stats", {})
            supabase.table("graph_cache").upsert({
                "id": "latest",
                "graph_data": graph_data,
                "computed_at": datetime.utcnow().isoformat(),
                "node_count": stats.get("nodeCount", 0),
                "edge_count": stats.get("edgeCount", 0),
                "cycles_found": stats.get("cycleCount", 0),
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to cache graph: {e}")

        return graph_data

    except Exception as e:
        logger.error(f"Graph engine failed: {e}")
        return EMPTY_GRAPH


@router.post("/money-map/refresh")
async def refresh_money_map(
    days: int = 30,
    current_user: Dict[str, str] = Depends(require_role("admin"))
):
    """
    Force a fresh graph computation and cache update.
    """
    try:
        graph_data = await _build_graph(days)
        stats = graph_data.get("stats", {})

        supabase.table("graph_cache").upsert({
            "id": "latest",
            "graph_data": graph_data,
            "computed_at": datetime.utcnow().isoformat(),
            "node_count": stats.get("nodeCount", 0),
            "edge_count": stats.get("edgeCount", 0),
            "cycles_found": stats.get("cycleCount", 0),
        }).execute()

        return {"status": "success", "message": "Graph refreshed successfully", "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

