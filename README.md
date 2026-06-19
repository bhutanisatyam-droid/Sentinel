# 🛡️ Sentinel: Enterprise Compliance-as-a-Service (CaaS)

Sentinel is a next-generation, hybrid-intelligence compliance platform designed for B2B Anti-Money Laundering (AML) and Know Your Customer (KYC) operations. Built for both rigorous enterprise due diligence and high-speed prototyping, Sentinel combines deterministic rules, machine learning anomaly detection, and graph-based structural analysis to secure the financial ecosystem.

## ✨ Key Features

### 🔍 Adaptive Identity Verification (KYC)
- **Intelligent Document Intake:** Client-side OpenCV.js for real-time quality guidance and a two-pass OCR pipeline (Google Cloud Vision API + Pytesseract).
- **Active Biometric Liveness:** Defeats deepfakes using MediaPipe Face Mesh challenge-response mechanisms (blink, head turn) and chromatic reflection analysis.
- **Zero-Knowledge Architecture:** Strict privacy-preserving data matching with tokenized PII and integrations with government endpoints (e.g., Setu Sandbox API / DigiLocker).

### 🚨 Hybrid AML Engine
- **Layer 1 - Deterministic Rules:** Hardcoded, legally mandated checks including Cash Transaction Reports (CTR), PEP screening, and fuzzy sanctions matching.
- **Layer 2 - Statistical Anomaly Detection:** Utilizes Isolation Forest and CatBoost models to detect deviations in transaction behavior, powered by SHAP values for Explainable AI (XAI).
- **Layer 3 - Graph Intelligence:** In-memory graph processing (NetworkX) and Neo4j to detect circular flows, mule account rings, and smurfing topologies.

### 🎛️ Compliance Command Center
- **The "Money Map":** A `react-force-graph-2d` interface color-coded by risk, allowing compliance officers to visually investigate suspicious nodes and transaction cycles.
- **Explainable Audits:** Hash-chained, immutable audit logs anchored to external storage (S3) ensuring tamper-proof compliance trails.
- **"God Mode" Dashboard:** Instant toggle between Enterprise Lockdown and Demo Mode for seamless presentation of webhook injections and mock data.

## 🛠️ Technology Stack

**Frontend:**
- Next.js (App Router), TypeScript
- Tailwind CSS 
- React Force Graph 2D & Spline (3D UI)
- MediaPipe / OpenCV.js

**Backend:**
- Python, FastAPI
- PostgreSQL (Supabase)
- Neo4j / NetworkX
- Scikit-Learn, CatBoost

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- PostgreSQL Database
- Neo4j Instance

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/sentinel.git
   cd sentinel
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   # On Windows: venv\Scripts\activate
   # On Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

4. **Environment Variables:**
   Set up your environments in both the `frontend` and `backend` directories. You can toggle `NEXT_PUBLIC_DEMO_MODE="true"` in the frontend to enable rapid prototyping features and bypass live API calls.

## 👥 Team & Contributions

Sentinel is a domain-driven collaborative project, with core modules developed by:

- **[Satyam Bhutiani](https://github.com/bhutanisatyam-droid)** - Architected and developed the **KYC Module** end-to-end, including both the frontend interfaces and backend services (Identity Verification APIs, Active Liveness UI, and Zero-Knowledge PII Tokenization logic).
- **Mehul Bhirud** - Architected and developed the **AML Module** end-to-end, including both the frontend Compliance Dashboard and backend services (Hybrid Detection Engine, Graph Intelligence integration, and Anomaly Detection ML Models).

---
*Built to bring extreme transparency and security to modern financial ecosystems.*
