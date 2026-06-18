# 🛡️ SENTINEL: B2B AML & KYC Compliance Platform

**Master Architecture & Vibe-Coding Directive Document**

## 1. Core Philosophy & Directives

You are building an enterprise-grade Compliance-as-a-Service (CaaS) platform. The codebase must be production-ready for B2B technical due diligence, but flexible enough for rapid hackathon iteration.

- **Strict TypeScript:** No `any` types for core financial/user data interfaces.
- **Ephemeral State:** Financial/KYC data must reside in RAM (Redux/Context) client-side. NEVER use IndexedDB or LocalStorage for sensitive payload caching.
- **Domain-Driven Design (DDD):** Strict separation of concerns between KYC and AML modules.
- **Explainable AI (XAI):** "Black Box" AI is forbidden. All ML scoring must be accompanied by SHAP (SHapley Additive exPlanations) values for regulatory auditing.

## 2. Global Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS / Stitches
- **Graph Database:** Neo4j (for Money Map & Entity Resolution)
- **Relational/State DB:** PostgreSQL
- **Machine Learning:** CatBoost, Scikit-Learn (Logistic Regression), GraphSAGE (via Neo4j GDS)
- **Client-Side AI:** `@mediapipe/face_mesh` (for Reflex Liveness)
- **3D UI:** Spline (`@splinetool/react-spline`)

## 3. The "Schizophrenic App" Environment Strategy

The system must support instantaneous switching between Enterprise Lockdown and Rapid Prototyping modes via environment variables.

- `NEXT_PUBLIC_DEMO_MODE="true"`: Bypasses live government API calls. Injects hardcoded mock data for guaranteed, high-speed UI/UX demos.
- `LOCAL_DEV_BYPASS="true"`: Development mode. Bypasses strict JWT auth, relaxes CORS to `*`, and ignores strict Zod payload validation to allow rapid Postman testing of core ML routes.
- **Implementation:** Use Dependency Injection (e.g., `MockKycService` vs `RealKycService`) resolved at runtime based on these flags.

## 4. Codebase Architecture (Strict Modular Monolith)

Do not place business logic in the Next.js `app/` router. Route handlers should only parse requests and pass them to Domain Modules.

```text
src/
├── app/                    # Next.js App Router (UI Routes & API endpoints)
├── shared/                 # Global UI components, theme, utilities
└── modules/                # DOMAIN-DRIVEN CORE
    ├── kyc/                # Identity & Liveness Module
    │   ├── components/
    │   ├── services/
    │   └── index.ts        # PUBLIC API: AML module can only import from here
    └── aml/                # Transaction & Graph Risk Module
        ├── components/
        ├── services/
        └── index.ts        # PUBLIC API

### 5. Module 1: KYC (Identity Verification)
Reflex Liveness (Active Gaze & Cornea Flash): Do NOT use puzzle-solvers. Implement client-side liveness using MediaPipe. Flash the screen a specific hex color and track the chromatic reflection in landmarks 468 (Left Iris) and 473 (Right Iris) to defeat real-time deepfakes.

Zero-Knowledge Architecture: Tokenize PII. The frontend widget should post to Next.js API routes, which securely communicate with external government endpoints (e.g., Setu/DigiLocker).

### 6. Module 2: AML & The "Money Map" (Fraud Detection)
We utilize a Heterogeneous Ensemble Stacking architecture. Do NOT merge disparate datasets into a single model.

    Level 0 (Base Learners):

        Expert 1 (CatBoost): Trained on mobile money datasets.

        Expert 2 (Random Forest): Trained on corporate fiat/smurfing datasets.

        Expert 3 (GraphSAGE): Trained on crypto topologies (Elliptic dataset).

    Level 1 (Meta-Learner):

        Logistic Regression: Takes the probability outputs [p1, p2, p3] from Level 0 and outputs the final Sentinel Risk Score.

    The Money Map (Graph ML): * Powered by Neo4j. Ingests UTXO clustering and cross-chain bridge data.

    Uses GraphSAGE (or FastRP fallback) to calculate neighborhood risk aggregation. If a clean node is 2 hops away from a sanctioned entity, the risk score propagates across the edges.

### 7. UI / UX Standards
3D Integration: The main landing page utilizes a <Spline> component featuring a segmented Möbius strip mapped to standard page scroll (position: sticky container).

God Mode Dashboard: A hidden route (accessible only in Demo Mode) containing webhook triggers to instantly inject "Smurfing" or "Deepfake" payloads into the active state for flawless live presentations.
```
