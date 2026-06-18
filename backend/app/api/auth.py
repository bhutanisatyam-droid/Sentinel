"""
Authentication endpoints for registration and login.
Uses Supabase Auth for user management and JWT tokens.
"""
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from jose import jwt

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Simple JWT secret — in production, use a proper secret management system
JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "sentinel-demo-secret")
JWT_ALGORITHM = "HS256"

# In-memory user store for demo purposes
_demo_users: dict = {}


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    panNumber: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


def _create_token(user_id: str, name: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "name": name,
        "email": email,
        "iat": datetime.utcnow().timestamp(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


@router.post("/register")
async def register(req: RegisterRequest):
    # Check if email already registered
    for uid, user in _demo_users.items():
        if user["email"] == req.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": req.name,
        "email": req.email,
        "phone": req.phone or "",
        "panNumber": req.panNumber or "",
        "balance": 50000,  # demo starting balance
        "riskScore": 15,
        "kycStatus": "pending",
        "bankAccounts": [
            {
                "id": str(uuid.uuid4()),
                "accountNumber": "1234567890123456",
                "accountHolderName": req.name,
                "ifscCode": "SBIN0001234",
                "bankName": "State Bank of India",
                "accountType": "savings",
                "isPrimary": True,
            }
        ],
        "created_at": datetime.utcnow().isoformat(),
    }
    _demo_users[user_id] = user

    token = _create_token(user_id, req.name, req.email)

    return {
        "token": token,
        "user": user,
    }


@router.post("/login")
async def login(req: LoginRequest):
    # Find user by email
    for uid, user in _demo_users.items():
        if user["email"] == req.email:
            token = _create_token(uid, user["name"], user["email"])
            return {
                "token": token,
                "user": user,
            }

    # If no user found, auto-register for demo convenience
    user_id = str(uuid.uuid4())
    name = req.email.split("@")[0].title()
    user = {
        "id": user_id,
        "name": name,
        "email": req.email,
        "phone": "",
        "balance": 50000,
        "riskScore": 15,
        "kycStatus": "pending",
        "bankAccounts": [
            {
                "id": str(uuid.uuid4()),
                "accountNumber": "9876543210987654",
                "accountHolderName": name,
                "ifscCode": "HDFC0001234",
                "bankName": "HDFC Bank",
                "accountType": "savings",
                "isPrimary": True,
            }
        ],
        "created_at": datetime.utcnow().isoformat(),
    }
    _demo_users[user_id] = user

    token = _create_token(user_id, name, req.email)
    return {
        "token": token,
        "user": user,
    }
