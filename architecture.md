# Sentinel Project Architecture

This document describes the high-level architecture of the **Sentinel** compliance platform. Sentinel is designed as a hybrid-intelligence compliance platform that combines deterministic rules, machine learning anomaly detection, and graph-based structure analysis.

## Overview

The system follows a modern client-server architecture with a Next.js frontend, a FastAPI Python backend, and a PostgreSQL database (via Supabase).

### Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, `react-force-graph-2d` for visualization.
- **Backend:** Python, FastAPI, NetworkX (Graph Computation), Scikit-Learn (Isolation Forest), MediaPipe/OpenCV (Biometrics).
- **Database / Data Store:** PostgreSQL (Supabase) for transactional data, S3 for audit log anchoring.

---

## 1. Adaptive Identity Verification (KYC) Pipeline

The KYC pipeline is asynchronous, device-adaptive, and robust against failures.

- **Document Intake & Intelligent OCR:**
  - Client-side OpenCV.js for real-time quality guidance (blur, glare, edge detection).
  - Two-pass OCR: Google Cloud Vision API as primary, falling back to Pytesseract.
  - Cross-document fuzzy matching for name/DOB comparison.
- **Biometric Verification:**
  - Active Liveness using MediaPipe Face Mesh (challenge-response: blink, head turn, smile).
  - Server-Side Injection Detection analyzing frame metadata to thwart virtual cameras.
  - Face Match via DeepFace with an ArcFace backend.
- **Government Database Verification:**
  - Integration with Setu Sandbox API/DigiLocker OAuth (with PKCE).
  - Strict privacy-preserving data matching with zero Aadhaar hash storage.

---

## 2. Hybrid AML Engine

Sentinel uses a 3-layered detection engine to minimize false positives while complying with regulatory requirements.

### Layer 1: Regulatory Compliance (Deterministic Rules)

Only legally mandated, binary rules dictate immediate action:

- **CTR (Cash Transaction Report):** Checks for monthly cash transactions over ₹10 Lakhs.
- **Sanctions Match:** Fuzzy matching (pg_trgm extension) and transliteration normalization against local cache (UN/OpenSanctions) and API fallback. Protected by a circuit breaker pattern.
- **PEP Screening:** Enhanced monitoring for Politically Exposed Persons.

### Layer 2: Statistical Anomaly Detection (ML)

Finds unknown deviations beyond hardcoded thresholds:

- **Isolation Forest Model:** Detects transaction anomalies based on amount, velocity, time-of-day, and counterparties.
- **Contextual Baseline:** Learns per-user baselines (e.g., dormant wake-ups).
- **Explainability:** SHAP values rank the most suspicious features for **internal prioritization only** (never for regulatory filing).

### Layer 3: Graph Intelligence

Tracks structural patterns across connected accounts:

- **In-Memory Graphs (NetworkX):** Nodes and edges representing accounts and transactions, serialized to JSON for the frontend.
- **Cycle Detection:** Uncovers circular flows (e.g., A→B→C→A) over set time windows.
- **Degree Centrality & Community Detection (Louvain algorithm):** Identifies potential mule account rings and fan-in/fan-out patterns.

---

## 3. Compliance Command Center

The frontend provides the interface for compliance officers to interact with the platform.

- **Overview Dashboard:** Visualizes risk distribution, alert velocity, and automated metric extraction.
- **Graph Visualization (Money Map):** A `react-force-graph-2d` interface color-coded by risk, with click-to-investigate features, pulsing nodes for flagged accounts, and cycle highlighting.
- **Case Detail View:** Structured to present deterministic evidence separate from AI assistance.
- **Deterministic Reporting:** Uses template-based approaches (not raw LLM generation) to compile verified STR/CTR narratives to avoid hallucinations in regulatory submissions. LLMs are restricted strictly to producing internal-only, watermarked investigation narratives on fully anonymized data.

---

## 4. Immutable Audit Trail

All compliance actions, approvals, overrides, and report filings are logged transparently.

- **Hash-Chained Logs:** Each log entry mathematically hashes its contents plus the hash of the preceding entry, ensuring sequential tamper detection.
- **External Anchoring:** To prevent holistic database modification, chain hashes are periodically written outwards (e.g., to an S3 Object Lock).
