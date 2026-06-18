import os
import pickle
from fastapi import FastAPI, Header, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from typing import Dict, List, Optional, Callable
from app.config import get_settings
from app.engine.anomaly.isolation_forest import AnomalyDetector
from app.engine.graph.graph_engine import TransactionGraphEngine

settings = get_settings()

app = FastAPI(title="Sentinel API", version="1.0.0")

# Global State
app.state.anomaly_detector = None
app.state.graph_engine = None
app.state.user_profiles = {}
app.state.user_histories = {}

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
import traceback
import sys

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("GLOBAL ERROR:", exc, file=sys.stderr)
    tb = traceback.format_exc()
    print(tb, file=sys.stderr)
    return JSONResponse(
        status_code=500,
        content={"Internal Server Error": True, "error": str(exc), "traceback": tb},
    )

@app.on_event("startup")
async def startup_event():
    print("Sentinel API started")
    
    # Load ML Model
    model_path = os.path.join(os.path.dirname(__file__), "models", "isolation_forest.pkl")
    profiles_path = os.path.join(os.path.dirname(__file__), "models", "user_profiles.pkl")
    histories_path = os.path.join(os.path.dirname(__file__), "models", "user_histories.pkl")
    
    if os.path.exists(model_path):
        detector = AnomalyDetector()
        detector.load_model(model_path)
        app.state.anomaly_detector = detector
        print(f"Isolation Forest model loaded from {model_path}")
    else:
        print("No trained model found. Run: python scripts/demo_setup.py --csv <path>")
        app.state.anomaly_detector = None
        
    if os.path.exists(profiles_path) and os.path.exists(histories_path):
        with open(profiles_path, "rb") as f:
            app.state.user_profiles = pickle.load(f)
        with open(histories_path, "rb") as f:
            app.state.user_histories = pickle.load(f)
        print("User data caches loaded for fast scoring.")
    else:
        app.state.user_profiles = {}
        app.state.user_histories = {}
        
    # Initialize Graph Engine
    app.state.graph_engine = TransactionGraphEngine()
    print("Transaction Graph Engine initialized.")




from app.api import liveness
app.include_router(liveness.router)

from app.api import kyc, users, transactions, alerts, dashboard, audit, reports, health, auth
app.include_router(auth.router)
app.include_router(kyc.router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(reports.router)
app.include_router(health.router)
