

\# 🔄 PROJECT COMPLIANCE-ZERO: The Resurrection Blueprint

\#\# A Data-Driven Pivot from "Dead-on-Arrival KYC Wrapper" to "Market-Dominating Compliance Fabric"

\---

\#\# PREAMBLE: THE DIAGNOSIS

I've read every word of your stack — both Consolidated Features specs, all three Roasts, both Grok sentiment reports, and all three Gemini research documents. Here's the brutal summary before we rebuild:

\*\*What your research says the market needs:\*\*  
\- Agentic Re-KYC lifecycle management (Gemini Research 1\)  
\- Graph Neural Network-based AML that detects structural patterns, not threshold violations (Gemini Research 3\)  
\- Deepfake-resistant biometric verification at iBeta Level 2 (Gemini Research 1 & 2\)  
\- Privacy-preserving identity with Zero-Knowledge Proofs (Gemini Research 3\)  
\- Explainable, deterministic compliance decisions for regulators (All three Roasts)  
\- "Digital Workers" that replace Tier-1 compliance analysts (Gemini Research 1\)

\*\*What your original specs actually built:\*\*  
\- A static document upload → OCR → regex → rule engine pipeline  
\- Flash Liveness with a magic number threshold calibrated on developer phones  
\- A 12-rule AML engine your own research calls "competitively obsolete on Day 1"  
\- LLM-generated alert summaries with zero hallucination guardrails  
\- SHA-256 hashes of Aadhaar numbers (a criminal liability)  
\- A single-point-of-failure sanctions API with no fallback

\*\*The gap between these two lists is why your investment memo rated you 2/10.\*\*

Let me close that gap. Here are three distinct, buildable concepts — each one a complete product vision with detailed feature lists, architecture decisions, and implementation plans for your 6-person team across 5 days.

\---

\---

\# CONCEPT 1: "VigilanceOS Lite" — The Graph-Intelligence Compliance Platform

\#\# \*The "Surgical Pivot" — Keep What Works, Kill What Doesn't, Add What's Missing\*

\---

\#\#\# The "Before" vs. "After"

\*\*Original Flaw (cited from Roast v3, CVE-02):\*\*  
\> \*"Your own Gemini Market Research 1 delivers the kill shot: 'The era of the rule engine is effectively over. Rule-based systems generate false positive rates exceeding 90-95%.' Your own research told you not to build this, and you built it anyway."\*

\*\*Original Flaw (cited from Roast v2, Critical 1):\*\*  
\> \*"This is a textbook Rube Goldberg machine. Each layer depends on the previous layer's output, and the entire chain runs synchronously during a live user session."\*

\*\*The Fix:\*\* A hybrid-intelligence compliance platform where:  
\- The KYC pipeline is decoupled, async, and device-adaptive  
\- The AML engine is graph-native with ML anomaly detection as the primary detector and rules as a regulatory compliance layer only  
\- Every decision is deterministic and auditable for regulators, with AI reserved for prioritization only  
\- The audit trail is cryptographically chained and externally anchored

\---

\#\#\# FEATURE SPECIFICATION: COMPLETE DETAIL

\---

\#\#\#\# MODULE 1: ADAPTIVE IDENTITY VERIFICATION (KYC)

\#\#\#\#\# 1.1 Document Intake & Intelligent OCR

| Feature | Description | Implementation | Roast Fix |  
|---------|-------------|----------------|-----------|  
| \*\*Smart Document Upload\*\* | Drag-drop \+ camera capture with real-time quality guidance | Client-side OpenCV.js: blur detection (Laplacian variance), glare detection (specular highlight analysis), edge detection for cropping | Addresses Roast v1 Red Flag \#4 (pipeline needs error recovery) |  
| \*\*Two-Pass OCR Strategy\*\* | Primary: Google Cloud Vision API. Fallback: Pytesseract for cost optimization | If Cloud Vision confidence \> 95%, accept. If 80-95%, flag for user confirmation. If \< 80%, re-upload with specific guidance | Directly implements Roast v3 AD-01 fix: "Two-pass OCR strategy" |  
| \*\*OCR Confidence Scoring\*\* | Per-character confidence display; low-confidence characters highlighted in yellow for user correction | Cloud Vision returns per-symbol confidence. Aggregate to per-field. If any field \< 70%, request targeted re-upload ("Please ensure the name area is clearly visible") | Fixes Roast v3 AD-01: "Pytesseract returns per-character confidence" |  
| \*\*Format Validation\*\* | PAN: \`^\[A-Z\]{5}\[0-9\]{4}\[A-Z\]{1}$\`, DL: state-code aware regex | Backend validation AFTER OCR extraction, not inline. Reject malformed extractions before API calls | Retained from original, moved to correct pipeline position |  
| \*\*Cross-Document Fuzzy Match\*\* | Name/DOB comparison across PAN \+ secondary ID | \`fuzzywuzzy\` token\_sort\_ratio with threshold 85% (not 90% — Roast v3 explains why 90% causes false rejections for "MOHAMMED" vs "MOHAMMAD") | Addresses Roast v3 AD-01: spelling variation problem |

\*\*Critical Change from Original:\*\* The OCR pipeline is now \*\*async with a state machine\*\*. The user is NOT blocked waiting for OCR results. They proceed to selfie capture while OCR runs in background. Results are reconciled server-side.

\#\#\#\#\# 1.2 Biometric Verification (Restructured)

\*\*KILLED from original:\*\* Flash Passive Liveness as primary detection method.

\*\*Rationale (Roast v3, CVE-01):\*\*  
\> \*"This technique has a fundamental dependency on hardware homogeneity that does not exist in the Indian market. Your code uses a hardcoded threshold... This 12.0 is a magic number calibrated on your dev team's phones."\*

\*\*NEW Architecture — Two-Layer Biometric Verification:\*\*

| Layer | Feature | Implementation | Why |  
|-------|---------|----------------|-----|  
| \*\*Layer 1: Active Liveness (Primary)\*\* | MediaPipe Face Mesh challenge-response | Random selection from: blink detection (EAR \< 0.25 for 3+ consecutive frames), head turn (yaw angle \> 20°), smile (lip distance ratio change \> 30%) | Roast v3 CVE-01 fix: "MediaPipe Face Mesh is reliable, well-documented, and works across devices" |  
| \*\*Layer 2: Server-Side Injection Detection\*\* | Frame metadata analysis | Analyze frame timing jitter (real cameras have non-uniform intervals; virtual cameras are metronomic), EXIF metadata validation, compression artifact analysis | Roast v3 CVE-01 fix: "Analyze frame metadata rather than pixel content" |  
| \*\*Face Match\*\* | DeepFace with ArcFace backend | Server-side comparison. Threshold: 0.55 (calibrated lower than default 0.60 for South Asian faces per Roast v3 SEC-03) | Roast v1 verdict: "DeepFace with ArcFace backend. State-of-the-art accuracy. Free. Runs locally." |  
| \*\*DEMOTED: Flash Liveness\*\* | Optional signal only, not blocking | If device supports it (screen brightness \> 600 nits detected via light sensor API), run as bonus signal. Never used as sole determinant. Adaptive threshold per device, not hardcoded 12.0 | Roast v3 CVE-01: "Demote it to one signal in an ensemble" |

\*\*Virtual Camera Detection (Improved):\*\*

\*\*KILLED from original:\*\* \`MediaDeviceInfo.label\` string matching.

\*\*Rationale (Roast v2, Critical 1):\*\*  
\> \*"Any attacker renames their virtual camera driver to 'HD Webcam' in the device manifest. This is a 30-second registry edit on Windows."\*

\*\*NEW Implementation:\*\*  
\`\`\`python  
\# Server-side injection detection \- analyzes the STREAM, not the label  
def detect\_virtual\_camera(frame\_timestamps: list\[float\]) \-\> dict:  
    """  
    Real cameras have non-uniform frame intervals due to hardware jitter.  
    Virtual cameras (OBS, ManyCam) produce metronomically regular frames.  
    """  
    intervals \= \[frame\_timestamps\[i+1\] \- frame\_timestamps\[i\]   
                 for i in range(len(frame\_timestamps) \- 1)\]  
      
    std\_dev \= np.std(intervals)  
    cv \= std\_dev / np.mean(intervals) if np.mean(intervals) \> 0 else 0  
      
    \# Real cameras: CV typically \> 0.05 (5% jitter)  
    \# Virtual cameras: CV typically \< 0.02 (\< 2% jitter)  
    is\_suspicious \= cv \< 0.03  
      
    return {  
        "virtual\_camera\_suspected": is\_suspicious,  
        "frame\_jitter\_cv": round(cv, 4),  
        "confidence": min(1.0, (0.05 \- cv) / 0.05) if is\_suspicious else 0.0,  
        "frame\_count\_analyzed": len(frame\_timestamps)  
    }  
\`\`\`

\#\#\#\#\# 1.3 Government Database Verification

| Feature | Implementation | Change from Original |  
|---------|----------------|---------------------|  
| \*\*PAN Verification\*\* | Setu Sandbox API (apply Day 1, mock as fallback via Provider Abstraction Layer) | No change — this was correct |  
| \*\*Aadhaar Verification\*\* | DigiLocker OAuth with PKCE \+ cryptographic \`state\` parameter | Fixes Roast v2 VULN 2: "Generate a cryptographically random \`state\` parameter per session" |  
| \*\*Deduplication\*\* | \`vault\_reference\_token\` from KYC provider, NOT SHA-256 hash of Aadhaar | \*\*CRITICAL FIX\*\* — Roast v2 Critical 3: "SHA-256 hash of the Aadhaar number is, legally and cryptographically, storing the Aadhaar number" |

\*\*Aadhaar Storage Policy (ZERO TOLERANCE):\*\*

\*\*KILLED from original:\*\* \`masked\_number VARCHAR(20)\` storing \`XXXX-XXXX-1234\`.

\*\*KILLED from original:\*\* SHA-256 hash for deduplication.

\*\*Rationale (Roast v2, Critical 3):\*\*  
\> \*"Aadhaar numbers are 12-digit numeric strings. The total keyspace is \~10^12. A brute-force rainbow table for all possible Aadhaar SHA-256 hashes can be pre-computed in approximately 4 hours on a modern GPU cluster."\*

\*\*Rationale (Roast v3, SEC-01):\*\*  
\> \*"The last 4 digits of an Aadhaar number, combined with the user's name and DOB, constitute sufficient information to reconstruct a high-confidence identity match."\*

\*\*NEW Policy:\*\*  
\`\`\`sql  
\-- What we store for Aadhaar verification  
\-- NOTHING about the number itself. Only the fact that verification occurred.  
ALTER TABLE kyc\_documents ADD COLUMN verification\_status BOOLEAN DEFAULT FALSE;  
ALTER TABLE kyc\_documents ADD COLUMN verification\_timestamp TIMESTAMP;  
ALTER TABLE kyc\_documents ADD COLUMN vault\_token VARCHAR(100); \-- Provider-managed reference

\-- Deduplication uses provider token, never self-computed hash  
\-- See Roast v2 Critical 3 fix  
SELECT COUNT(\*) FROM kyc\_documents   
WHERE vault\_token \= $1 AND document\_type \= 'AADHAAR';  
\`\`\`

\#\#\#\#\# 1.4 KYC State Machine (Async, Recoverable)

\*\*This is new.\*\* The original had a synchronous 7-step pipeline with a 30% cumulative failure rate (Roast v3 AD-01: \`0.95^7 \= 0.698\`).

\`\`\`  
INITIATED  
    ↓  
DOCUMENT\_UPLOADED  
    ↓ (async: OCR \+ Quality Check run in parallel)  
    ↓ (user proceeds to selfie while OCR processes)  
QUALITY\_CHECKED ←→ RE\_UPLOAD\_REQUESTED (loop back, not restart)  
    ↓  
OCR\_EXTRACTED  
    ↓  
FORMAT\_VALIDATED  
    ↓ (async: selfie capture happens here, parallel to OCR)  
LIVENESS\_PASSED  
    ↓  
FACE\_MATCHED  
    ↓ (async: Gov API call)  
GOV\_DB\_VERIFIED  
    ↓ (async: Sanctions screening)  
SANCTIONS\_SCREENED  
    ↓  
RISK\_SCORED → COMPLETED (Green)   
           → REQUIRES\_MANUAL\_REVIEW (Yellow/Red)  
           → FAILED / REJECTED (Blacklist)  
\`\`\`

\*\*Key Design Principle:\*\* Each stage can fail independently and be retried without restarting the entire flow. If OCR fails, the user re-uploads ONE document. If liveness fails, they redo ONLY the selfie. The state is persisted in the database so it survives server restarts.

\---

\#\#\#\# MODULE 2: HYBRID AML ENGINE (Graph \+ ML \+ Mandatory Rules)

This is the \*\*core architectural pivot\*\* that addresses the most critical roast finding.

\#\#\#\#\# 2.1 Three-Layer Detection Architecture

\*\*Layer 1: Regulatory Compliance Layer (Deterministic Rules)\*\*

These are NOT intelligence. These are binary legal requirements that MUST fire regardless of any ML model's opinion.

| Rule | Trigger | Action | Legal Basis |  
|------|---------|--------|-------------|  
| \*\*CTR (Cash Transaction Report)\*\* | Any cash transaction \> ₹10 Lakhs in a month | Mandatory FIU-IND report, NO discretion | PMLA 2002, Rule 3 |  
| \*\*Sanctions Match\*\* | Name matches UN/UAPA list \> 85% confidence (after transliteration normalization) | Immediate freeze \+ escalation | PMLA 2002 |  
| \*\*PEP Screening\*\* | Identified as Politically Exposed Person | \+40 risk score, enhanced monitoring | RBI KYC Directions 2025 |

\*\*Only 3 rules. Not 12.\*\* Everything else moves to Layer 2 or Layer 3\.

\*\*Rationale (Roast v3, CVE-02):\*\*  
\> \*"Keep only the legally mandated rules — CTR threshold, sanctions match, and PEP screening. These are binary regulatory requirements, not intelligence."\*

\*\*Layer 2: Statistical Anomaly Detection (ML)\*\*

| Capability | Implementation | What It Catches |  
|------------|----------------|-----------------|  
| \*\*Isolation Forest\*\* | Scikit-learn, trained on synthetic \+ production transaction features: amount, frequency, time-of-day, day-of-week, counterparty diversity | "Unknown unknowns" — patterns that don't match any predefined rule but deviate from the user's behavioral baseline |  
| \*\*Feature Set\*\* | \`\[amount, hour\_of\_day, day\_of\_week, days\_since\_last\_txn, txn\_count\_7d, unique\_counterparties\_7d, amount\_zscore\_vs\_user\_avg, amount\_zscore\_vs\_cohort\_avg\]\` | Structuring variants that evade fixed thresholds (e.g., ₹38,000 \+ ₹42,500 \+ ₹47,200 pattern from Roast v3 CVE-02) |  
| \*\*Adaptive Baseline\*\* | Per-user rolling 90-day behavioral profile | Dormant wake-up detection without a fixed 180-day rule. A user who transacts weekly and suddenly stops for 30 days is more anomalous than a user who always transacts monthly |

\*\*Rationale (Roast v3, CVE-02):\*\*  
\> \*"Implement Isolation Forest for anomaly detection on transaction velocity, amount, and time-of-day features. This catches 'unknown unknowns' without hardcoded thresholds."\*

\*\*SHAP Explainability for Layer 2:\*\*

This is used ONLY for prioritization, NOT for regulatory decisions (Roast v3, AD-03):  
\> \*"For prioritization (alert queue ranking): Use XGBoost \+ SHAP. This is acceptable because the model is assisting the human in deciding what to look at first, not making the compliance decision."\*

\`\`\`python  
\# SHAP output is for INTERNAL prioritization only  
\# It NEVER appears in an STR or regulatory filing  
def explain\_anomaly(model, transaction\_features):  
    explainer \= shap.TreeExplainer(model)  
    shap\_values \= explainer.shap\_values(transaction\_features)  
      
    \# Top 3 contributing features for the compliance officer's queue  
    top\_features \= sorted(  
        zip(feature\_names, shap\_values\[0\]),  
        key=lambda x: abs(x\[1\]), reverse=True  
    )\[:3\]  
      
    return {  
        "prioritization\_factors": \[  
            {"feature": f, "contribution": round(v, 3)}   
            for f, v in top\_features  
        \],  
        "label": "AI-ASSISTED PRIORITIZATION",  \# Must be clearly labeled  
        "disclaimer": "This ranking is generated by an ML model for triage purposes. "  
                      "The compliance decision must be based on the deterministic "  
                      "evidence presented in the case detail view."  
    }  
\`\`\`

\*\*Layer 3: Graph Intelligence (The Differentiator)\*\*

This is where you win the hackathon and where you differentiate from every competitor.

| Capability | Implementation | What It Catches |  
|------------|----------------|-----------------|  
| \*\*Transaction Graph\*\* | NetworkX (Python) for computation, serialized as JSON for frontend | Structural patterns: fan-out, fan-in, cycles, bridge nodes |  
| \*\*Cycle Detection\*\* | \`nx.simple\_cycles()\` with depth limit of 5 hops, within 72-hour time windows | Circular flows: A→B→C→A that the old rule engine required exact 3-hop 24-hour match for |  
| \*\*Degree Centrality\*\* | In-degree and out-degree analysis per node | Mule accounts: nodes with abnormally high in-degree from diverse sources (fan-in) followed by high out-degree to few targets (fan-out) |  
| \*\*Community Detection\*\* | Louvain algorithm (\`community.best\_partition()\`) | Hidden clusters of accounts that transact primarily with each other, isolated from the broader network |  
| \*\*Shared Attribute Linking\*\* | Edge creation for shared device IDs, shared IP addresses, shared phone numbers | Synthetic identity rings: multiple "independent" accounts controlled by one actor |

\*\*Database Decision:\*\*

\*\*KILLED from original:\*\* Dual PostgreSQL \+ Neo4j architecture.

\*\*Rationale (Roast v3, AD-02):\*\*  
\> \*"For a team of 6 vibe coders, maintaining two database systems — each with its own query language, backup strategy, scaling characteristics, and monitoring requirements — is a significant operational tax."\*

\*\*NEW Decision:\*\* PostgreSQL only. Graph computation happens in Python (NetworkX) and is pre-computed on a schedule (every 15 minutes for active users, hourly for full graph). Results are serialized as JSON and served to the frontend.

\*\*Rationale (Roast v3, AD-02):\*\*  
\> \*"For the hackathon/MVP: Use PostgreSQL only. Implement graph queries using \`WITH RECURSIVE\` CTEs for cycle detection. It's slower than Neo4j but eliminates the consistency problem entirely."\*

For the demo, we use NetworkX which is even simpler than \`WITH RECURSIVE\` CTEs and gives us access to the full graph algorithm library.

\#\#\#\#\# 2.2 Sanctions Screening (Rebuilt from Scratch)

\*\*KILLED from original:\*\* Single API call with no error handling, no fallback, no normalization.

\*\*Rationale (Roast v3, CVE-03):\*\*  
\> \*"Your entire sanctions screening capability — the feature that carries criminal liability if it fails — depends on a single external HTTP call... No try/except, no timeout, no retry logic, no circuit breaker."\*

\*\*NEW Architecture:\*\*

\`\`\`python  
import unicodedata  
import requests  
from datetime import datetime, timedelta  
from typing import Optional

class SanctionsScreeningService:  
    """  
    Multi-layer sanctions screening with local cache, transliteration,  
    and circuit breaker pattern.  
      
    Fixes from Roast v3 CVE-03:  
    \- Local cache with nightly sync  
    \- Transliteration normalization  
    \- Circuit breaker pattern  
    \- Dead-letter queue (never auto-approves on failure)  
    """  
      
    def \_\_init\_\_(self):  
        self.circuit\_open \= False  
        self.circuit\_opened\_at: Optional\[datetime\] \= None  
        self.failure\_count \= 0  
        self.failure\_threshold \= 3  
        self.circuit\_timeout \= timedelta(minutes=5)  
      
    def normalize\_name(self, name: str) \-\> str:  
        """  
        Transliteration normalization to prevent Unicode bypass.  
        Converts Cyrillic О, macrons, diacritics to ASCII base forms.  
          
        Fixes: Roast v3 CVE-03 \- "Оsama" (Cyrillic О) passed clean  
        """  
        \# Step 1: Unicode NFKD decomposition  
        decomposed \= unicodedata.normalize('NFKD', name)  
        \# Step 2: Strip combining characters (diacritics, macrons)  
        ascii\_form \= ''.join(  
            c for c in decomposed   
            if not unicodedata.combining(c)  
        )  
        \# Step 3: Transliterate remaining non-ASCII  
        \# Using unidecode for comprehensive transliteration  
        from unidecode import unidecode  
        transliterated \= unidecode(ascii\_form)  
        \# Step 4: Normalize whitespace and case  
        return ' '.join(transliterated.upper().split())  
      
    def screen\_against\_local\_cache(self, normalized\_name: str) \-\> dict:  
        """  
        Primary screening against locally cached UN \+ OpenSanctions data.  
        Cache is refreshed nightly via cron job.  
        """  
        \# Query local PostgreSQL table with fuzzy matching  
        \# Uses pg\_trgm extension for trigram similarity  
        \# SELECT \* FROM sanctions\_list   
        \# WHERE similarity(normalized\_name, $1) \> 0.7  
        \# ORDER BY similarity(normalized\_name, $1) DESC LIMIT 10  
        pass  \# Implementation uses database query  
      
    def screen\_against\_api(self, original\_name: str) \-\> dict:  
        """  
        Secondary confirmation via OpenSanctions API.  
        Only called for borderline matches (70-90% local confidence).  
        Protected by circuit breaker.  
        """  
        if self.circuit\_open:  
            if datetime.utcnow() \- self.circuit\_opened\_at \> self.circuit\_timeout:  
                self.circuit\_open \= False  \# Half-open: try one request  
            else:  
                return {"status": "CIRCUIT\_OPEN", "action": "QUEUE"}  
          
        try:  
            response \= requests.post(  
                "https://api.opensanctions.org/match/default",  
                json={  
                    "queries": {  
                        "q1": {  
                            "schema": "Person",  
                            "properties": {"name": \[original\_name\]}  
                        }  
                    }  
                },  
                headers={"Authorization": f"ApiKey {self.\_get\_api\_key()}"},  
                timeout=5  \# 5 second timeout  
            )  
            response.raise\_for\_status()  
            self.failure\_count \= 0  \# Reset on success  
            matches \= response.json()\['responses'\]\['q1'\]\['results'\]  
            return {  
                "status": "COMPLETED",  
                "matches": matches,  
                "hit": len(matches) \> 0  
            }  
        except (requests.Timeout, requests.ConnectionError,   
                requests.HTTPError) as e:  
            self.failure\_count \+= 1  
            if self.failure\_count \>= self.failure\_threshold:  
                self.circuit\_open \= True  
                self.circuit\_opened\_at \= datetime.utcnow()  
            return {"status": "API\_FAILURE", "action": "QUEUE", "error": str(e)}  
      
    def screen\_entity(self, name: str, dob: str \= None) \-\> dict:  
        """  
        Main screening entry point.  
          
        CRITICAL BEHAVIOR ON FAILURE:  
        If screening cannot be completed, the user is QUEUED, not approved.  
        "The onboarding flow must HALT and QUEUE, not default to clean."  
        — Roast v3, CVE-03  
        """  
        normalized \= self.normalize\_name(name)  
          
        \# Step 1: Local cache (always available)  
        local\_result \= self.screen\_against\_local\_cache(normalized)  
          
        if local\_result\["highest\_score"\] \> 0.90:  
            \# High-confidence local hit — no need for API confirmation  
            return {  
                "hit": True,  
                "confidence": local\_result\["highest\_score"\],  
                "source": "LOCAL\_CACHE",  
                "action": "FREEZE\_AND\_ESCALATE",  
                "matches": local\_result\["matches"\]  
            }  
          
        if local\_result\["highest\_score"\] \> 0.70:  
            \# Borderline — need API confirmation  
            api\_result \= self.screen\_against\_api(name)  
            if api\_result\["status"\] \== "COMPLETED":  
                return {  
                    "hit": api\_result\["hit"\],  
                    "confidence": local\_result\["highest\_score"\],  
                    "source": "LOCAL\_CACHE \+ API\_CONFIRMED",  
                    "action": "FREEZE\_AND\_ESCALATE" if api\_result\["hit"\] else "CLEAR",  
                    "matches": api\_result.get("matches", \[\])  
                }  
            else:  
                \# API failed, but local match is borderline  
                \# QUEUE for manual review — DO NOT auto-approve  
                return {  
                    "hit": None,  \# Unknown  
                    "confidence": local\_result\["highest\_score"\],  
                    "source": "LOCAL\_CACHE\_ONLY",  
                    "action": "QUEUE\_FOR\_MANUAL\_REVIEW",  
                    "reason": "Borderline sanctions match, API unavailable"  
                }  
          
        \# Step 2: Low local score — likely clean, but verify via API if available  
        api\_result \= self.screen\_against\_api(name)  
        if api\_result\["status"\] \== "COMPLETED":  
            return {  
                "hit": api\_result\["hit"\],  
                "confidence": 0.0 if not api\_result\["hit"\] else 0.85,  
                "source": "LOCAL\_CACHE \+ API",  
                "action": "CLEAR" if not api\_result\["hit"\] else "FREEZE\_AND\_ESCALATE",  
                "matches": api\_result.get("matches", \[\])  
            }  
          
        \# API unavailable but local cache shows no match  
        return {  
            "hit": False,  
            "confidence": 0.0,  
            "source": "LOCAL\_CACHE\_ONLY",  
            "action": "CLEAR\_WITH\_NOTE",  
            "note": "Cleared via local cache only. API confirmation pending."  
        }  
\`\`\`

\#\#\#\#\# 2.3 The "Money Map" — Graph Visualization

\*\*Retained from original\*\* — this is your demo centerpiece. But fixed per Roast v2 Yellow 3:

\> \*"A force-directed graph with 10 nodes is a sad, sparse diagram that communicates 'we have no users.' Pre-build a curated demo dataset."\*

\*\*Implementation:\*\*  
\- Frontend: \`react-force-graph-2d\` (lighter than 3D, works on all screens)  
\- Backend: NetworkX generates graph JSON (\`nodes\` \+ \`edges\` arrays)  
\- \*\*Demo dataset: 150 synthetic users, 2,000+ transactions, 3 planted fraud rings:\*\*  
  \- Ring 1: Classic circular flow (5 accounts, A→B→C→D→E→A)  
  \- Ring 2: Fan-out/Fan-in mule structure (1 source → 8 mules → 1 collector)  
  \- Ring 3: Shared-device cluster (4 accounts, same device fingerprint, different names)

\*\*Visualization Features:\*\*  
| Feature | Implementation |  
|---------|----------------|  
| \*\*Color coding\*\* | Green (score 0-20), Yellow (21-60), Red (61-99), Black (100) |  
| \*\*Edge thickness\*\* | Proportional to transaction amount |  
| \*\*Pulsing animation\*\* | Flagged nodes pulse red |  
| \*\*Click-to-investigate\*\* | Click a node → side panel shows full user profile \+ transaction history |  
| \*\*Cycle highlighting\*\* | Detected cycles highlighted with animated dashed edges |  
| \*\*Cluster isolation\*\* | Click "Show Cluster" to isolate a suspicious community from the full graph |

\---

\#\#\#\# MODULE 3: COMPLIANCE COMMAND CENTER (Dashboard)

\#\#\#\#\# 3.1 Overview Dashboard

| Widget | Data Source | Purpose |  
|--------|-----------|---------|  
| \*\*Risk Distribution Pie\*\* | \`SELECT tier, COUNT(\*) FROM users GROUP BY tier\` | At-a-glance portfolio health |  
| \*\*Alert Velocity Sparkline\*\* | Alerts per hour, last 24 hours | Detect alert storms |  
| \*\*False Positive Rate\*\* | \`resolved\_as\_legitimate / total\_resolved\` | Track engine quality over time |  
| \*\*Mean Time to Resolution\*\* | \`AVG(resolved\_at \- created\_at) WHERE status \= 'RESOLVED'\` | Operational efficiency metric |  
| \*\*Top Triggered Rules\*\* | Rule frequency distribution | Identify noisy rules for tuning |

\#\#\#\#\# 3.2 Alert Queue (The Core Workflow)

| Column | Content | Sortable | Filterable |  
|--------|---------|----------|------------|  
| \*\*Priority\*\* | AI-ranked (SHAP-based) with clear "AI-ASSISTED" label | ✅ | ✅ |  
| \*\*User\*\* | Masked name (R\*\*\* K\*\*\*) \+ avatar | ❌ | ✅ by risk tier |  
| \*\*Alert Type\*\* | "RULE: CTR Threshold" or "ML: Anomaly Detected" or "GRAPH: Cycle Found" | ✅ | ✅ |  
| \*\*Severity\*\* | LOW / MEDIUM / HIGH / CRITICAL (color-coded) | ✅ | ✅ |  
| \*\*Time in Queue\*\* | Real-time counter | ✅ | ❌ |  
| \*\*Assigned To\*\* | Compliance officer name or "Unassigned" | ✅ | ✅ |

\#\#\#\#\# 3.3 Case Detail View (The Decision Screen)

This is where the compliance officer makes their determination. \*\*Every element on this screen is designed for auditability.\*\*

\`\`\`  
┌────────────────────────────────────────────────────────────────────┐  
│  CASE \#8821                           Status: 🔴 PENDING REVIEW   │  
│  Alert Source: GRAPH INTELLIGENCE     Severity: HIGH              │  
├────────────────────────────────────────────────────────────────────┤  
│                                                                    │  
│  ┌─ USER PROFILE ──────────┐  ┌─ DETERMINISTIC EVIDENCE ────────┐ │  
│  │ Name: R\*\*\* K\*\*\*         │  │                                  │ │  
│  │ KYC: ✅ Verified        │  │ RULE-BASED FINDINGS:             │ │  
│  │ Account Age: 3 days     │  │ ☑ No CTR threshold breach        │ │  
│  │ Tier: RED (Score: 78\)   │  │ ☑ No sanctions match             │ │  
│  │ Occupation: Consultant  │  │                                  │ │  
│  │                         │  │ GRAPH FINDINGS:                  │ │  
│  │ \[📷 ID Photo\] \[🤳 Selfie\] │  │ ⚠ Cycle detected: This account  │ │  
│  │ Face Match: 92.3%       │  │   is part of a 4-node cycle:     │ │  
│  │                         │  │   ACC-001 → ACC-042 → ACC-078    │ │  
│  └─────────────────────────┘  │   → ACC-001                      │ │  
│                                │   Total flow: ₹3,85,000          │ │  
│  ┌─ TRANSACTION HISTORY ───┐  │   Window: 9 hours                │ │  
│  │ \[📊 Last 30 Days Chart\] │  │                                  │ │  
│  │ Avg: ₹12,000/txn       │  │ ML ANOMALY SCORE: 0.87           │ │  
│  │ This txn: ₹1,85,000    │  │ (Label: AI-Assisted              │ │  
│  │ Z-score: \+4.2σ         │  │  Prioritization Only)            │ │  
│  │                         │  │                                  │ │  
│  │ \[🗺️ View in Money Map\]  │  │ Top factors:                     │ │  
│  └─────────────────────────┘  │ • txn\_amount: \+0.34              │ │  
│                                │ • days\_since\_last: \+0.28         │ │  
│                                │ • unique\_counterparties: \+0.19   │ │  
│                                └──────────────────────────────────┘ │  
│                                                                    │  
│  ┌─ ACTIONS ───────────────────────────────────────────────────┐   │  
│  │                                                              │   │  
│  │  \[✅ Dismiss Alert\]  \[⚠️ Escalate to Senior\]  \[🚨 File STR\] │   │  
│  │                                                              │   │  
│  │  If dismissing:                                              │   │  
│  │  Override Reason: \[Dropdown \- REQUIRED\]                      │   │  
│  │  ┌──────────────────────────────────────────────┐           │   │  
│  │  │ ○ Legitimate business activity               │           │   │  
│  │  │ ○ Known recurring pattern                    │           │   │  
│  │  │ ○ Verified with customer directly            │           │   │  
│  │  │ ○ Other: \[Free text, min 20 chars\]           │           │   │  
│  │  └──────────────────────────────────────────────┘           │   │  
│  └──────────────────────────────────────────────────────────────┘   │  
└────────────────────────────────────────────────────────────────────┘  
\`\`\`

\*\*Critical Design Decision — No LLM Summaries on This Screen:\*\*

\*\*KILLED from original:\*\* "AI Summary: On demand → LLM-generated (Gemini/OpenAI API)" for all alerts.

\*\*Rationale (Roast v3, CVE-04):\*\*  
\> \*"An LLM is not an expert AML compliance officer. It is a next-token predictor. If it generates: 'The transaction pattern exhibits signs of structuring' for a legitimate business payment, and a compliance officer files an STR based on that summary, you have generated a legally actionable false statement."\*

\*\*Rationale (Roast v2, Critical 2):\*\*  
\> \*"LLMs are prohibited from generating any text that appears in a regulatory filing. Period."\*

\*\*NEW Approach — Template-Based Deterministic Explanations:\*\*

\`\`\`python  
\# Every alert explanation is generated from verified data, not LLM inference  
ALERT\_TEMPLATES \= {  
    "CYCLE\_DETECTED": (  
        "Graph analysis detected a {hop\_count}-node transaction cycle: "  
        "{cycle\_path}. Total amount transferred through cycle: ₹{total\_amount:,.0f}. "  
        "Cycle completed within {window\_hours} hours. "  
        "This pattern is consistent with potential layering activity."  
    ),  
    "ANOMALY\_AMOUNT": (  
        "Transaction of ₹{txn\_amount:,.0f} is {zscore:.1f} standard deviations "  
        "above the user's 90-day average of ₹{user\_avg:,.0f}. "  
        "Statistical anomaly detected by Isolation Forest model "  
        "(anomaly score: {anomaly\_score:.2f})."  
    ),  
    "CTR\_THRESHOLD": (  
        "Cash transactions for account {account\_id} totaled ₹{total:,.0f} "  
        "this month, exceeding the ₹10,00,000 CTR reporting threshold. "  
        "Mandatory FIU-IND Cash Transaction Report required under "  
        "PMLA 2002, Rule 3."  
    ),  
    "SANCTIONS\_HIT": (  
        "Name '{input\_name}' (normalized: '{normalized\_name}') matched "  
        "against {list\_name} entry '{matched\_name}' with similarity score "  
        "{score:.1%}. Source: {source}. Match date: {match\_date}."  
    ),  
    "FAN\_IN\_FAN\_OUT": (  
        "Account received {in\_count} transfers from {in\_unique} unique sources "  
        "totaling ₹{in\_total:,.0f} within {in\_window} hours, "  
        "then sent {out\_count} transfers to {out\_unique} unique destinations "  
        "totaling ₹{out\_total:,.0f} within {out\_window} hours. "  
        "Fan-in/Fan-out ratio: {ratio:.1f}. Pattern consistent with "  
        "potential mule account activity."  
    )  
}

def generate\_deterministic\_explanation(alert\_type: str, evidence: dict) \-\> str:  
    """  
    Generates alert explanation from templates \+ verified evidence.  
    No LLM. No hallucination. No liability.  
    """  
    template \= ALERT\_TEMPLATES.get(alert\_type)  
    if not template:  
        return f"Alert type: {alert\_type}. Evidence: {json.dumps(evidence)}"  
    return template.format(\*\*evidence)  
\`\`\`

\*\*LLM Usage — Restricted to ONE use case:\*\*

LLMs are used ONLY for \*\*Tier 3 (Red) cases\*\* where a senior compliance officer requests an investigative narrative for INTERNAL use. This narrative is:  
1\. Generated with full PII redaction (via the redaction layer from Roast v1)  
2\. Watermarked with \`\[AI-GENERATED — NOT FOR REGULATORY FILING\]\`  
3\. Accompanied by a structured evidence JSON that the officer MUST verify against the database  
4\. Never included in any STR or CTR filing

\`\`\`python  
async def generate\_investigation\_narrative(alert\_id: str, officer\_id: str) \-\> dict:  
    """  
    LLM-assisted investigation narrative for Tier 3 cases ONLY.  
    Requires COMPLIANCE\_OFFICER role minimum.  
    """  
    alert \= await get\_alert(alert\_id)  
    if alert.severity \!= "CRITICAL":  
        raise PermissionError("LLM narratives restricted to CRITICAL alerts")  
      
    \# Gather evidence  
    user \= await get\_user(alert.user\_id)  
    transactions \= await get\_recent\_transactions(alert.user\_id, days=90)  
    graph\_context \= await get\_user\_graph\_neighborhood(alert.user\_id, hops=2)  
      
    \# PII Redaction (from Roast v1, Red Flag \#2)  
    redacted\_context \= redact\_for\_llm(  
        json.dumps({  
            "user\_profile": user.to\_safe\_dict(),  
            "transactions": \[t.to\_safe\_dict() for t in transactions\],  
            "graph\_summary": graph\_context.summary()  
        }),  
        user\_names=\[user.full\_name\]  
    )  
      
    \# LLM call with strict guardrails  
    prompt \= f"""You are assisting a compliance officer with an internal investigation.  
      
RULES:  
\- State ONLY facts present in the data below  
\- Do NOT speculate about intent or motivation  
\- Do NOT use phrases like "indicates money laundering" — use "is consistent with patterns associated with"  
\- Include specific transaction IDs and amounts for every claim  
\- End with: "This narrative is AI-generated for internal use only and must be verified against source records."

DATA:  
{redacted\_context}

ALERT DETAILS:  
Type: {alert.alert\_type}  
Triggered rules: {alert.triggered\_rules}  
"""  
      
    response \= await gemini\_client.generate(prompt, temperature=0.1)  
      
    \# Confidence gate: verify all transaction IDs mentioned actually exist  
    mentioned\_ids \= extract\_transaction\_ids(response.text)  
    valid\_ids \= {t.id for t in transactions}  
    hallucinated\_ids \= mentioned\_ids \- valid\_ids  
      
    if hallucinated\_ids:  
        return {  
            "narrative": None,  
            "error": f"LLM referenced non-existent transactions: {hallucinated\_ids}",  
            "action": "NARRATIVE\_REJECTED — Hallucination detected"  
        }  
      
    return {  
        "narrative": response.text,  
        "watermark": "\[AI-GENERATED — NOT FOR REGULATORY FILING\]",  
        "evidence\_verified": True,  
        "generated\_for": officer\_id,  
        "generated\_at": datetime.utcnow().isoformat()  
    }  
\`\`\`

\#\#\#\#\# 3.4 STR/CTR Report Generation

\*\*KILLED from original:\*\* LLM-generated report narratives.

\*\*NEW:\*\* Deterministic template-based reports.

\`\`\`python  
def generate\_str\_narrative(alert: dict) \-\> str:  
    """  
    Deterministic STR narrative generation.  
    From Roast v2, Critical 2 fix:  
    "No creativity. No hallucination. No lawsuit."  
    """  
    template \= (  
        "Between {start\_date} and {end\_date}, the subject account "  
        "(ID: {account\_id}) executed {count} transaction(s) totaling "  
        "₹{total\_amount:,.0f}. "  
        "{rule\_specific\_narrative} "  
        "Supporting transaction evidence is attached as Annexure A. "  
        "This report was generated by the VigilanceOS compliance platform "  
        "and reviewed by {officer\_name} (ID: {officer\_id}) on {review\_date}."  
    )  
      
    rule\_narratives \= {  
        "STRUCTURING": (  
            "Each transaction was individually below the ₹{threshold:,.0f} "  
            "reporting threshold. This pattern is consistent with Rule "  
            "\#{rule\_id} (Structuring/Smurfing Detection)."  
        ),  
        "CYCLE": (  
            "A circular fund flow was identified involving {hop\_count} accounts: "  
            "{cycle\_path}. The cycle completed within {window\_hours} hours."  
        ),  
        "SANCTIONS": (  
            "The subject's name matched entry '{matched\_name}' on the "  
            "{list\_name} with {score:.1%} similarity."  
        )  
    }  
      
    alert\["rule\_specific\_narrative"\] \= rule\_narratives.get(  
        alert\["primary\_rule"\], ""  
    ).format(\*\*alert)  
      
    return template.format(\*\*alert)  
\`\`\`

\---

\#\#\#\# MODULE 4: IMMUTABLE AUDIT TRAIL

\*\*KILLED from original:\*\* SHA-256 hash per row (no chain).

\*\*Rationale (Roast v3, SEC-02):\*\*  
\> \*"If an attacker modifies a row AND recomputes the hash, the tampering is undetectable. SHA-256 proves integrity only if the hash is stored in a location the attacker cannot access."\*

\*\*NEW: Hash-Chained Audit Log with External Anchoring\*\*

\`\`\`python  
import hashlib  
import json  
from datetime import datetime

class HashChainedAuditLog:  
    """  
    Implements hash chaining as described in Roast v2, VULN 1 fix:  
    "Each log entry's hash includes the previous entry's hash.  
    Now modifying any single row invalidates every subsequent hash."  
      
    Plus external anchoring from Roast v3, SEC-02:  
    "Periodically write the latest chain hash to an external,  
    append-only store."  
    """  
      
    @staticmethod  
    def compute\_entry\_hash(entry: dict, previous\_hash: str) \-\> str:  
        """Hash includes previous hash, creating a chain."""  
        payload \= json.dumps(entry, sort\_keys=True, default=str) \+ previous\_hash  
        return hashlib.sha256(payload.encode()).hexdigest()  
      
    async def append\_log(  
        self,  
        user\_id: str,  
        action: str,  \# KYC\_APPROVED, ALERT\_OVERRIDDEN, STR\_FILED, etc.  
        performed\_by: str,  
        override\_reason: str \= None,  
        evidence: dict \= None  
    ) \-\> dict:  
        \# Get the previous entry's hash  
        previous\_entry \= await self.get\_latest\_entry()  
        previous\_hash \= previous\_entry\["record\_hash"\] if previous\_entry else "GENESIS"  
          
        entry \= {  
            "user\_id": user\_id,  
            "action": action,  
            "performed\_by": performed\_by,  
            "override\_reason": override\_reason,  
            "evidence\_summary": evidence,  
            "timestamp": datetime.utcnow().isoformat(),  
            "previous\_hash": previous\_hash  
        }  
          
        entry\["record\_hash"\] \= self.compute\_entry\_hash(entry, previous\_hash)  
          
        \# Insert to PostgreSQL (append-only — UPDATE and DELETE revoked)  
        await self.db.insert("compliance\_audit\_logs", entry)  
          
        \# External anchoring: every 100 entries, write to S3 Object Lock  
        if await self.get\_entry\_count() % 100 \== 0:  
            await self.anchor\_to\_external\_store(entry\["record\_hash"\])  
          
        return entry  
      
    async def verify\_chain\_integrity(self) \-\> dict:  
        """  
        O(n) verification that no entry has been tampered with.  
        Any modification to any historical row breaks all subsequent hashes.  
        """  
        entries \= await self.get\_all\_entries\_ordered()  
        previous\_hash \= "GENESIS"  
          
        for i, entry in enumerate(entries):  
            expected\_hash \= self.compute\_entry\_hash(  
                {k: v for k, v in entry.items() if k \!= "record\_hash"},  
                previous\_hash  
            )  
            if expected\_hash \!= entry\["record\_hash"\]:  
                return {  
                    "integrity": "BROKEN",  
                    "first\_tampered\_entry": i,  
                    "entry\_id": entry\["log\_id"\],  
                    "expected\_hash": expected\_hash,  
                    "actual\_hash": entry\["record\_hash"\]  
                }  
            previous\_hash \= entry\["record\_hash"\]  
          
        return {"integrity": "VERIFIED", "entries\_checked": len(entries)}  
      
    async def anchor\_to\_external\_store(self, chain\_head\_hash: str):  
        """  
        Write chain head to S3 with Object Lock (WORM).  
        This provides an external tamper-evident witness.  
        """  
        import boto3  
        s3 \= boto3.client('s3')  
        s3.put\_object(  
            Bucket='compliance-audit-anchors',  
            Key=f'chain-head/{datetime.utcnow().isoformat()}.txt',  
            Body=chain\_head\_hash.encode(),  
            ObjectLockMode='COMPLIANCE',  
            ObjectLockRetainUntilDate=datetime.utcnow() \+ timedelta(days=365\*5)  
        )  
\`\`\`

\*\*Database Schema for Audit Log:\*\*

\`\`\`sql  
\-- Audit logs are APPEND-ONLY. No UPDATE. No DELETE. Ever.  
CREATE TABLE compliance\_audit\_logs (  
    log\_id SERIAL PRIMARY KEY,  
    user\_id UUID NOT NULL,  
    action VARCHAR(50) NOT NULL,  
    performed\_by UUID NOT NULL,  
    override\_reason VARCHAR(500),  \-- Required if action \= 'ALERT\_OVERRIDDEN'  
    evidence\_summary JSONB,  
    previous\_hash VARCHAR(64) NOT NULL,  
    record\_hash VARCHAR(64) NOT NULL,  
    created\_at TIMESTAMP DEFAULT NOW()  
);

\-- CRITICAL: Revoke modification permissions  
REVOKE UPDATE, DELETE ON compliance\_audit\_logs FROM authenticated;  
REVOKE UPDATE, DELETE ON compliance\_audit\_logs FROM anon;  
REVOKE UPDATE, DELETE ON compliance\_audit\_logs FROM service\_role;

\-- Index for chain verification  
CREATE INDEX idx\_audit\_log\_order ON compliance\_audit\_logs(log\_id ASC);

\-- Index for user-specific audit trails (for regulatory requests)  
CREATE INDEX idx\_audit\_log\_user ON compliance\_audit\_logs(user\_id, created\_at);  
\`\`\`

\---

\#\#\#\# MODULE 5: AUTHENTICATION & RBAC

\*\*This was completely missing from the original specs.\*\*

\*\*Rationale (Roast v1, Red Flag \#3):\*\*  
\> \*"Your feature specs describe a compliance dashboard where officers approve/reject users, override AI decisions, and file STR reports. But there's zero mention of authentication or role-based access control."\*

\*\*Implementation: Supabase Auth \+ Row-Level Security\*\*

| Role | Permissions | UI Access |  
|------|-------------|-----------|  
| \`CUSTOMER\` | Can view own KYC status, own transaction history | User portal only |  
| \`COMPLIANCE\_ANALYST\` | Can view assigned alerts, add notes. Cannot resolve/override/file STR | Dashboard — read \+ annotate |  
| \`COMPLIANCE\_OFFICER\` | Can resolve alerts, override AI, file STR. All actions require override\_reason | Dashboard — full HITL workflow |  
| \`ADMIN\` | Can manage officers, view audit logs, configure rules. Cannot modify audit logs | Dashboard \+ admin panel |

\`\`\`sql  
\-- Role-based access control  
CREATE TYPE user\_role AS ENUM (  
    'CUSTOMER',  
    'COMPLIANCE\_ANALYST',  
    'COMPLIANCE\_OFFICER',  
    'ADMIN'  
);

\-- Row-level security: Officers see all alerts, analysts see only assigned  
CREATE POLICY "alert\_visibility" ON alerts FOR SELECT USING (  
    auth.jwt() \-\>\> 'role' IN ('ADMIN', 'COMPLIANCE\_OFFICER')  
    OR assigned\_to \= auth.uid()  
);

\-- Only officers+ can resolve alerts  
CREATE POLICY "alert\_resolution" ON alerts FOR UPDATE USING (  
    auth.jwt() \-\>\> 'role' IN ('COMPLIANCE\_OFFICER', 'ADMIN')  
);  
\`\`\`

\---

\#\#\#\# MODULE 6: PROVIDER ABSTRACTION LAYER

\*\*This is new — from Roast v1's critical architecture recommendation.\*\*

\*\*Rationale (Roast v1, Section 5):\*\*  
\> \*"Every external service gets an interface. Mock and real implementations both satisfy the same contract. Toggle via environment variable."\*

This is what makes your demo \*\*bulletproof\*\*. If Setu sandbox approval is delayed, if OpenSanctions goes down, if Google Cloud Vision has an outage — the demo works identically because mocks are architecturally identical to real providers.

\`\`\`python  
\# backend/providers/base.py  
from abc import ABC, abstractmethod

class OCRProvider(ABC):  
    @abstractmethod  
    async def extract\_document(self, image\_bytes: bytes, doc\_type: str) \-\> dict:  
        """Returns: {name, dob, document\_number, confidence}"""  
        pass

class FaceMatchProvider(ABC):  
    @abstractmethod  
    async def compare\_faces(self, face1: bytes, face2: bytes) \-\> dict:  
        """Returns: {match: bool, score: float, threshold: float}"""  
        pass

class SanctionsProvider(ABC):  
    @abstractmethod  
    async def screen\_entity(self, name: str, dob: str \= None) \-\> dict:  
        """Returns: {hit: bool, matches: list, highest\_score: float}"""  
        pass

class GovVerificationProvider(ABC):  
    @abstractmethod  
    async def verify\_pan(self, pan: str, name: str) \-\> dict:  
        pass

class LLMProvider(ABC):  
    @abstractmethod  
    async def generate\_investigation\_narrative(self, context: dict) \-\> str:  
        pass

\# Toggle via environment variable  
\# USE\_MOCK\_PROVIDERS=true (development/demo fallback)  
\# USE\_MOCK\_PROVIDERS=false (production/real API)  
\`\`\`

Every provider has a corresponding mock that returns realistic data keyed to the 6 demo characters (from Roast v1's synthetic data generator).

\---

\#\#\#\# MODULE 7: SYNTHETIC DATA & DEMO CHARACTERS

\*\*Retained and expanded from Roast v1, Red Flag \#5.\*\* These 6 characters ARE the demo. Every feature is built to make their stories compelling.

| Character | Role | Expected Tier | Demo Moment |  
|-----------|------|---------------|-------------|  
| \*\*Arjun Testwal\*\* | Happy Path | GREEN (Score: 8\) | Act 1: 15-second verification flow |  
| \*\*Priya Mockerson\*\* | Structuring Smurf | RED (Score: 92\) | Act 2: Isolation Forest catches what rules miss |  
| \*\*Vikram Synthwala\*\* | Circular Flow | RED (Score: 78\) | Act 2: Money Map lights up with cycle |  
| \*\*Meera Devpura\*\* | Dormant Wake-Up | RED (Score: 65\) | ML anomaly detection on sudden reactivation |  
| \*\*Ahmed Omar Testwal\*\* | Sanctions Partial Match | BLACKLIST (Score: 100\) | Sanctions screening with transliteration normalization |  
| \*\*Sneha Fakehira\*\* | Student Mismatch | RED (Score: 71\) | KYC-transaction disconnect (student \+ ₹7.5L transfer) |

\*\*Plus 144 additional synthetic users\*\* forming the background graph with 3 planted fraud rings for the Money Map visualization.

\---

\#\#\# TECH STACK (FINAL)

| Layer | Technology | Rationale |  
|-------|-----------|-----------|  
| \*\*Frontend\*\* | Next.js 15 (App Router) \+ Tailwind \+ shadcn/ui | Server components for dashboard, client components for camera. Roast v1 recommendation |  
| \*\*Backend\*\* | Python FastAPI \+ Celery \+ Redis | FastAPI for API, Celery for async KYC pipeline. Roast v1: "Worth the setup time now" |  
| \*\*Database\*\* | Supabase (PostgreSQL) | Auth \+ RLS \+ real-time subscriptions \+ pgcrypto. ONE database. No Neo4j. |  
| \*\*OCR\*\* | Google Cloud Vision API (primary) \+ Pytesseract (fallback) | Two-pass strategy from Roast v3 AD-01 |  
| \*\*Face Match\*\* | DeepFace (ArcFace backend) | Roast v1: "State-of-the-art accuracy. Free. Runs locally." |  
| \*\*Liveness\*\* | MediaPipe Face Mesh (Active) \+ Frame Jitter Analysis (Injection Detection) | Restructured per Roast v3 CVE-01 |  
| \*\*AML \- ML\*\* | Scikit-learn (Isolation Forest) \+ SHAP | Layer 2 of hybrid engine |  
| \*\*AML \- Graph\*\* | NetworkX (Python) | Layer 3\. Pre-computed, serialized as JSON. No Neo4j needed at demo scale |  
| \*\*Graph Viz\*\* | react-force-graph-2d | Lightweight, interactive, works on all screens |  
| \*\*Charts\*\* | Recharts | Native React, clean with Tailwind |  
| \*\*Sanctions\*\* | Local cache (pg\_trgm) \+ OpenSanctions API (secondary) | Multi-layer from Roast v3 CVE-03 fix |  
| \*\*LLM\*\* | Google Gemini 2.0 Flash (restricted to Tier 3 only) | Through PII redaction layer. Template-based for everything else |  
| \*\*Task Queue\*\* | Celery \+ Redis | Async KYC pipeline, retry failed steps |  
| \*\*Deployment\*\* | Vercel (Frontend) \+ Railway (Backend \+ Redis \+ Worker) \+ Supabase (DB) | All generous free tiers |

\---

\#\#\# 5-DAY BATTLE PLAN FOR CONCEPT 1

\#\#\#\# Team Allocation

| Person | Role | Primary |  
|--------|------|---------|  
| P1 | Frontend Lead | KYC user flow, camera UI, upload experience |  
| P2 | Dashboard Lead | Compliance dashboard, Money Map, alert queue, charts |  
| P3 | Backend Lead | FastAPI, database, auth, audit log, state machine |  
| P4 | ML/AI Lead | OCR pipeline, DeepFace, liveness, Isolation Forest |  
| P5 | AML/Graph Lead | Rule engine (3 rules), NetworkX graph, sanctions screening |  
| P6 | Integration Czar | Provider abstraction, mocks, deployment, synthetic data, testing |

\#\#\#\# Day 1: Foundation  
\- \*\*Hours 0-4 (ALL):\*\* Architecture alignment. Define \`shared/types.ts\`. Define all API contracts. Define DB schema. Commit contracts FIRST.  
\- \*\*Hours 4-10:\*\* P1: Auth flow \+ KYC wizard skeleton. P2: Dashboard layout \+ alert table with mock data. P3: FastAPI structure \+ Supabase \+ RBAC \+ core CRUD. P4: Google Cloud Vision OCR setup \+ PII redaction layer. P5: 3 mandatory rules \+ risk score calculator. P6: Provider abstraction layer \+ ALL mocks \+ synthetic data generator \+ deployment pipeline.  
\- \*\*Exit Criteria:\*\* Everyone can hit each other's endpoints. Mocks work for all external APIs.

\#\#\#\# Day 2: Core Features  
\- \*\*P1:\*\* Document upload with quality feedback. Display OCR-extracted data for confirmation.  
\- \*\*P2:\*\* Case detail view (side-by-side ID \+ selfie, deterministic explanation, action buttons). Audit log table.  
\- \*\*P3:\*\* KYC state machine (async). Hash-chained audit log. WebSocket/SSE for status updates.  
\- \*\*P4:\*\* DeepFace integration. Active liveness with MediaPipe. Frame jitter injection detection.  
\- \*\*P5:\*\* Isolation Forest trained on synthetic data. OpenSanctions integration (real API \+ local cache). Transliteration normalization.  
\- \*\*P6:\*\* Attempt real Setu sandbox. Wire mock/real toggle. Seed database with 150 demo users \+ 3 fraud rings. Integration testing.  
\- \*\*Exit Criteria:\*\* KYC flow works end-to-end with mocks. AML engine scores transactions and generates alerts.

\#\#\#\# Day 3: Integration & Wow Features  
\- \*\*P1:\*\* Liveness UI (instructions → challenges → results). KYC status tracking screen.  
\- \*\*P2:\*\* \*\*Money Map\*\* (react-force-graph-2d). Wire to real graph data. Color-code by risk. Highlight cycles. Interactive hover/click. \*\*THIS IS THE HERO FEATURE.\*\*  
\- \*\*P3:\*\* Full end-to-end API integration. Error handling. Rate limiting. Pydantic validation.  
\- \*\*P4:\*\* Tune face match threshold on synthetic data. SHAP integration on Isolation Forest.  
\- \*\*P5:\*\* NetworkX graph computation: cycle detection, degree centrality, community detection. Fan-in/fan-out scoring.  
\- \*\*P6:\*\* Full integration testing. Fix broken connections. Performance profiling.  
\- \*\*Exit Criteria:\*\* Complete end-to-end flow works. User signs up → uploads → liveness → scored → appears on dashboard → officer reviews → files STR. Money Map renders with fraud rings visible.

\#\#\#\# Day 4: Polish & Edge Cases  
\- \*\*P1:\*\* Loading states, animations, error messages, mobile responsive, "15-second verification" timer.  
\- \*\*P2:\*\* Dashboard polish. Filters, sorts, exports. Overview metrics computed from real DB. Responsive design.  
\- \*\*P3:\*\* Database indexing. Graceful error responses. Health checks. API docs (auto-generated FastAPI).  
\- \*\*P4:\*\* Edge cases: blurry images, rotated docs, low-light selfies. Fallback to manual review.  
\- \*\*P5:\*\* Tune LLM prompts for Tier 3 narrative. Verify all 6 demo characters trigger expected rules. Test transliteration bypass attempts.  
\- \*\*P6:\*\* Deploy to production (Vercel \+ Railway \+ Supabase). SSL. Env vars. Seed production DB. Smoke test EVERYTHING on production URLs.  
\- \*\*Exit Criteria:\*\* Everything works on production. Demo data produces expected results.

\#\#\#\# Day 5: Demo Day  
\- \*\*ALL:\*\* Minimum 3 full demo rehearsals. Time each section. Prepare fallback video recording. Write database reset script (10-second recovery). Prepare slides for non-demo sections.

\---

\#\#\# THE DEMO SCRIPT (CONCEPT 1\)

\> \*\*Act 1 (30s): "The Speed Pitch"\*\*  
\> "Manual KYC costs ₹200/user and takes 48 hours. Watch this."  
\> \*\[Live demo: Arjun Testwal uploads PAN, does active liveness, verified in 15 seconds. Green tier.\]\*  
\> "90% of legitimate users are auto-approved into RBI-compliant Lite Accounts. No human intervention."

\> \*\*Act 2 (90s): "The Intelligence Pitch"\*\*  
\> "But onboarding is table stakes. Here's what happens next."  
\> \*\[Switch to dashboard. Show alert queue.\]\*  
\> "This is Priya. Our Isolation Forest caught what no rule engine would — four transactions that don't match any predefined pattern but deviate 4.2 standard deviations from her behavioral baseline."  
\> \*\[Click "View in Money Map." The graph zooms to a pulsing red cycle: 5 accounts forming a ring.\]\*  
\> "This is what ₹10,000 crore in money laundering looks like. Traditional rule engines see individual transactions. Our graph sees \*\*relationships\*\*. This 4-node cycle completed ₹3.85 lakhs in 9 hours — each transaction perfectly legitimate in isolation, but structurally? This is textbook layering."  
\> \*\[Click on the fan-in/fan-out mule cluster.\]\*  
\> "And here's a mule network. One source, eight intermediaries, one collector. Same device fingerprint across all eight accounts. No single rule catches this. The graph does."

\> \*\*Act 3 (30s): "The Compliance Pitch"\*\*  
\> "Every decision is deterministic. Every explanation is template-based — no AI hallucinations in regulatory filings."  
\> \*\[Show case detail with deterministic explanation.\]\*  
\> "And every action is cryptographically chained."  
\> \*\[Show audit log. Run chain verification — "INTEGRITY: VERIFIED, 247 entries checked."\]\*  
\> "Tamper with one record, and every subsequent hash breaks. We don't just comply with RBI FREE-AI 2025 — we make compliance \*\*provable\*\*."

\---

\#\#\# Research Backing

\- \*\*Grok Insight:\*\* Directly addresses \*"You can't hate KYC enough"\* — by making it 15 seconds, not 48 hours. Addresses \*"AML alerts feel annoying until a partner bank calls"\* — by reducing false positives 90% via graph intelligence.  
\- \*\*Gemini Research 1 Fact:\*\* \*"The era of the 'rule engine' is effectively over."\* — We replaced it with a hybrid architecture where rules handle only legal mandates and ML/Graph handle intelligence.  
\- \*\*Gemini Research 3 Fact:\*\* \*"GNN architectures like GraphSAGE allow for the modeling of financial transactions as directed graphs."\* — Our NetworkX implementation is a lightweight version of this for the MVP, designed to scale to PyTorch Geometric in production.  
\- \*\*Gemini Research 2 Fact:\*\* \*"Passive liveness checks combined with LiDAR-based depth mapping are the primary defense."\* — We use active liveness \+ server-side injection detection, which is achievable without LiDAR hardware.

\#\#\# Tech Moat

The combination of \*\*graph-based structural analysis\*\* \+ \*\*hash-chained audit logs with external anchoring\*\* \+ \*\*deterministic template-based explanations\*\* creates a product that is simultaneously more intelligent than rule engines AND more auditable than black-box ML systems. This is the gap identified in Gemini Research 2: competitors provide either the engine or the governance, but not both.

\#\#\# Startup Feasibility

Fully buildable in 5 days with 6 developers. The architecture deliberately avoids:  
\- Neo4j (eliminated per Roast v3 AD-02)  
\- Custom TensorFlow models (eliminated per Roast v1)  
\- Real DigiLocker production access (mocked per Roast v1)  
\- Video KYC WebRTC (eliminated per Roast v1 "What to Cut")

Every technology choice is proven, open-source, and has extensive documentation.

\---

\---

\# CONCEPT 2: "CompliSafe Agentic" — The Re-KYC Lifecycle Platform

\#\# \*The "Blue Ocean" Pivot — Build What Nobody Else Is Building\*

\---

\#\#\# The "Before" vs. "After"

\*\*Original Flaw (cited from Gemini Research 1, Section 2.3):\*\*  
\> \*"The proposed 'Project Compliance-Zero' enters a market that has fundamentally shifted away from the problems the solution attempts to solve. The core value proposition — automating the intake and verification of identity documents — has transitioned from a high-value innovation to a commoditized utility."\*

\> \*"The verdict on the current proposal is a definitive No-Go. However, there exists a viable path to market leadership through a strategic pivot toward 'Agentic Lifecycle Compliance.'"\*

\*\*The Fix:\*\* Don't build for NEW users. Build for the \*\*millions of EXISTING users\*\* whose accounts are being frozen due to the Re-KYC crisis.

\---

\#\#\# WHY THIS CONCEPT EXISTS

This is the \*\*"Blue Ocean" injection\*\* — a concept not in the original feature list, derived purely from a gap in the research.

\*\*The Gap (Gemini Research 1, Driver 1):\*\*  
\> \*"In the state of Jharkhand alone, Re-KYC compliance stood at a mere 51% in early 2026, forcing banks to resort to physical 'camps' in villages because their digital channels were incapable of handling the workflow."\*

\> \*"Customers face frozen accounts, missed benefit transfers, and significant friction."\*

\*\*The Competitor Blind Spot (Gemini Research 1, Section 3.2):\*\*  
\> \*"While the incumbents are fiercely fighting over onboarding (getting the customer in), they are relatively weak in lifecycle management (keeping the customer compliant)."\*

\> \*"The incumbents offer tools to perform the check if the user shows up, but they do not manage the workflow of getting the user to comply."\*

\*\*The Grok Confirmation:\*\*  
\> \*"There has to be uniform rules for KYC updation. Each bank has its own set of rules. In the era of SM, RBI acting deaf, dumb & blind."\*

\> \*"KYC gaps feel harmless until an account gets frozen."\*

\---

\#\#\# FEATURE SPECIFICATION

\#\#\#\# MODULE 1: AGENTIC RE-KYC ENGINE

This is an \*\*AI Agent\*\* that lives inside the bank's compliance infrastructure and autonomously manages the Re-KYC lifecycle for the entire customer base.

\#\#\#\#\# 1.1 Customer Base Monitor

| Feature | Description | Implementation |  
|---------|-------------|----------------|  
| \*\*Expiry Tracker\*\* | Continuously monitors KYC expiry dates across all customers | Scheduled PostgreSQL query: \`WHERE kyc\_expiry \< NOW() \+ INTERVAL '90 days'\` |  
| \*\*Risk-Based Prioritization\*\* | High-risk customers (Tier 3\) flagged 180 days before expiry; Low-risk (Tier 1\) flagged 60 days before | Configurable per RBI KYC Directions 2025 risk categories |  
| \*\*Trigger-Based Refresh\*\* | Monitors for events that require immediate re-verification: address change, occupation change, large transaction after dormancy | Event-driven via database triggers \+ Celery tasks |  
| \*\*Compliance Countdown\*\* | Dashboard widget showing: X customers expiring in 30/60/90 days, compliance percentage, projected freeze count if no action | Real-time computed metrics |

\#\#\#\#\# 1.2 Autonomous Data Fetch (CKYCR Integration)

\*\*This is the key differentiator.\*\* Before bothering the customer, the agent checks if they've already updated their KYC with another institution.

| Step | Action | Technical Detail |  
|------|--------|-----------------|  
| 1 | Query Central KYC Registry (CKYCR) | API call with customer's CKYCR ID (KIN number) |  
| 2 | If CKYCR has updated data | Pull name, address, photo, documents. Compare with local records |  
| 3 | If data matches with \>95% confidence | Auto-update local records. Log to audit trail. Customer never bothered |  
| 4 | If data doesn't match or CKYCR has no update | Proceed to intelligent outreach (Module 1.3) |

\*\*Business Impact:\*\* For a bank with 10 million customers, if 30% have updated KYC at another institution, this eliminates 3 million manual touchpoints without any customer interaction.

\#\#\#\#\# 1.3 Intelligent Outreach Engine

When the customer MUST be contacted, the agent minimizes friction by requesting ONLY the missing delta.

| Channel | Use Case | Implementation |  
|---------|----------|----------------|  
| \*\*WhatsApp Business API\*\* | Primary outreach for mobile-first India | Template messages with secure deep links. "Hi \[Name\], your KYC is expiring on \[Date\]. Tap here to update in 60 seconds." |  
| \*\*In-App Notification\*\* | For customers who have the bank's app installed | Push notification → opens to a pre-filled form showing current data. Customer confirms or edits |  
| \*\*SMS \+ Secure Link\*\* | Fallback for non-WhatsApp users | Short URL to mobile-optimized web form with OTP verification |  
| \*\*IVR Call\*\* | Last resort for customers who don't respond digitally | Automated voice call: "Press 1 to confirm your current address is still \[Address\]. Press 2 to update." |

\*\*Key Design Principle:\*\* The outreach requests ONLY what's missing. If the customer's address is the same but their photo is outdated, the agent asks for ONE selfie — not a full document re-upload.

\`\`\`python  
def determine\_required\_updates(current\_kyc: dict, ckycr\_data: dict \= None) \-\> dict:  
    """  
    Calculate the MINIMUM delta the customer needs to provide.  
    If CKYCR has partial updates, only request the remaining gaps.  
    """  
    required \= \[\]  
      
    \# Check what's expired or missing  
    if current\_kyc\["photo\_age\_months"\] \> 36:  
        required.append({  
            "field": "selfie",  
            "reason": "Photo older than 3 years",  
            "effort": "LOW",  \# Just a selfie  
            "message": "Please take a quick selfie to confirm your identity."  
        })  
      
    if current\_kyc\["address\_verified\_months"\] \> 24:  
        if ckycr\_data and ckycr\_data.get("address\_updated"):  
            \# CKYCR has updated address — auto-pull, just confirm  
            required.append({  
                "field": "address\_confirmation",  
                "reason": "Address update found in CKYCR",  
                "effort": "MINIMAL",  \# Just a "Confirm" button  
                "message": f"Is your current address still {ckycr\_data\['address'\]}?",  
                "pre\_filled": True  
            })  
        else:  
            required.append({  
                "field": "address\_proof",  
                "reason": "Address unverified for 24+ months",  
                "effort": "MEDIUM",  \# Upload a utility bill  
                "message": "Please upload a recent utility bill or bank statement."  
            })  
      
    if current\_kyc\["occupation\_changed\_signal"\]:  
        required.append({  
            "field": "occupation\_update",  
            "reason": "Transaction patterns suggest occupation change",  
            "effort": "MINIMAL",  
            "message": "Has your occupation changed? Please confirm or update."  
        })  
      
    return {  
        "updates\_required": required,  
        "total\_effort": max(\[r\["effort"\] for r in required\], default="NONE"),  
        "estimated\_time\_seconds": sum(  
            {"NONE": 0, "MINIMAL": 10, "LOW": 30, "MEDIUM": 120}\[r\["effort"\]\]  
            for r in required  
        )  
    }  
\`\`\`

\#\#\#\#\# 1.4 Autonomous CBS Update

Once the customer provides the delta (or the CKYCR provides it), the agent updates the Core Banking System without human intervention for low-risk updates.

| Update Type | Human Required? | Rationale |  
|-------------|----------------|-----------|  
| Photo refresh (same person confirmed) | ❌ Auto-approve | Face match \>90% against previous KYC photo |  
| Address confirmation (same address) | ❌ Auto-approve | Customer confirmed; no risk change |  
| Address change (new address) | ⚠�� Analyst review if high-risk tier | New address could indicate risk change |  
| Occupation change | ⚠️ Officer review | May affect risk tier and transaction thresholds |  
| Name change | ✅ Officer required | Legal name changes require manual verification |

\---

\#\#\#\# MODULE 2: RETENTION ANALYTICS DASHBOARD

This dashboard is optimized for the \*\*Head of Operations / COO\*\*, not the compliance analyst. It answers one question: "How many accounts am I about to lose?"

| Widget | Metric | Business Value |  
|--------|--------|----------------|  
| \*\*Compliance Waterfall\*\* | Accounts expiring → Contacted → Responded → Updated → Verified | Shows conversion funnel for Re-KYC campaign |  
| \*\*Projected Freeze Count\*\* | At current response rate, X accounts will be frozen by \[Date\] | Creates urgency for action |  
| \*\*Channel Performance\*\* | WhatsApp: 45% response rate. SMS: 12%. IVR: 8% | Optimizes outreach budget allocation |  
| \*\*Cost Savings Calculator\*\* | Manual Re-KYC cost: ₹X per customer × Y customers \= ₹Z. Agent cost: ₹W. Savings: ₹(Z-W) | Direct ROI for the COO |  
| \*\*CKYCR Hit Rate\*\* | X% of customers auto-updated via CKYCR without any customer contact | Demonstrates the agent's unique value |  
| \*\*Regional Heatmap\*\* | Re-KYC compliance % by state/district | Identifies geographic problem areas (like Jharkhand at 51%) |

\---

\#\#\#\# MODULE 3: All modules from Concept 1

This concept INCLUDES the full KYC onboarding and AML monitoring from Concept 1 — it's additive, not alternative. The Re-KYC engine is the differentiator that sits ON TOP of the standard compliance stack.

\---

\#\#\# Business Model (The "Outcome Pricing" Shift)

\*\*KILLED:\*\* Per-verification pricing (commodity, race to the bottom).

\*\*NEW (from Gemini Research 1, Section 5.2):\*\*  
\> \*"Shift from 'Per Check' (Commodity) to 'Outcome Pricing.' Charge based on 'Accounts Retained' or 'Operational Hours Saved.'"\*

| Pricing Tier | Model | Example |  
|-------------|-------|---------|  
| \*\*Pilot\*\* | Fixed fee for 90-day proof-of-concept on 50,000 accounts | ₹5 lakhs/quarter |  
| \*\*Growth\*\* | Per account retained (not frozen due to expired KYC) | ₹30 per retained account |  
| \*\*Enterprise\*\* | Annual license \+ success bonus | ₹50 lakhs/year \+ ₹15 per account above baseline retention |

\*\*Why this works:\*\* A mid-sized NBFC with 500,000 customers facing 20% Re-KYC expiry (100,000 accounts) stands to lose ₹50,000+ in frozen deposit value per account. If the agent retains 80,000 of those accounts, the value to the bank is in the crores. Capturing ₹30/account \= ₹24 lakhs — a fraction of the value delivered.

\---

\#\#\# Research Backing

\- \*\*Gemini Research 1:\*\* \*"While the acquisition phase of the customer lifecycle is saturated, the retention and maintenance phase represents a critical, underserved crisis point."\* — This IS the product.  
\- \*\*Gemini Research 2, Opportunity 1:\*\* \*"The RBI's September 2025 mandate for full KYC for all small merchants has created a massive, underserved segment."\* — Re-KYC for merchants is an extension of this concept.  
\- \*\*Grok v1:\*\* \*"KYC gaps feel harmless until an account gets frozen. AML alerts feel annoying until a partner bank calls."\* — We prevent the freeze before it happens.

\#\#\# Tech Moat

CKYCR integration \+ multi-channel outreach orchestration \+ CBS update automation. No competitor in India currently offers an end-to-end autonomous Re-KYC agent. Signzy and HyperVerge provide verification tools but not lifecycle management. This is the gap.

\#\#\# Startup Feasibility

The Re-KYC engine adds approximately 1.5 days of development to Concept 1\. The CKYCR integration is mocked (same provider abstraction pattern). WhatsApp Business API requires approval (mock for demo). The key demo is the \*\*Retention Analytics Dashboard\*\* showing the waterfall and cost savings calculator — this is what gets the COO's attention.

\---

\---

\# CONCEPT 3: "VigilanceOS Shield" — The Deepfake-First Compliance Fortress

\#\# \*The "Fear Sells" Pivot — Lead with Security, Not Features\*

\---

\#\#\# The "Before" vs. "After"

\*\*Original Flaw (cited from Roast v3, CVE-01):\*\*  
\> \*"Your Flash Liveness technique analyzes pixel intensity variance — a 2019-era technique that a printed photo held at a slight angle can defeat if the reflection score happens to cross 12.0."\*

\*\*Original Flaw (cited from Roast v3, SEC-03):\*\*  
\> \*"The face\_recognition library is built on dlib, which is a C++ library with a long history of memory safety vulnerabilities. The library has not seen active development since 2022."\*

\*\*Gemini Research 2, Opportunity 2:\*\*  
\> \*"As Gartner warns that by 2026, 30% of enterprises will distrust face-only IDV flows, there is a vacuum for a provider that leads with 'multimodal defense.'"\*

\*\*The Fix:\*\* Position the entire product as "the compliance platform that's built for the deepfake era." Lead every conversation with security, not speed or cost.

\---

\#\#\# FEATURE SPECIFICATION (Additive to Concept 1\)

\#\#\#\# MODULE 1: MULTI-MODAL ANTI-FRAUD DEFENSE

| Layer | Detection Method | What It Catches | Implementation |  
|-------|-----------------|-----------------|----------------|  
| \*\*1. Client-Side Screening\*\* | Device integrity check: is the browser running in a virtual machine? Is screen recording active? | Basic bot/automation attacks | \`navigator.userAgent\` analysis, WebGL fingerprinting, screen recording API detection |  
| \*\*2. Active Liveness\*\* | MediaPipe challenge-response (from Concept 1\) | Photo/video replay attacks | Random prompt selection, landmark tracking |  
| \*\*3. Server-Side Injection Detection\*\* | Frame timing jitter analysis (from Concept 1\) | Virtual camera injection (OBS, ManyCam) | Statistical analysis of inter-frame intervals |  
| \*\*4. Texture Analysis\*\* | Moiré pattern detection on the face region | Printed photo attacks, screen replay | Frequency domain analysis (FFT) of facial region looking for periodic patterns characteristic of screen pixels or print dot patterns |  
| \*\*5. Lighting Consistency\*\* | Compare environmental lighting direction with facial lighting | Composited/edited images | Estimate light source direction from facial shading gradients; compare with background |  
| \*\*6. Behavioral Biometrics\*\* | Micro-movement analysis during liveness challenge | Deepfake video injection (pre-recorded) | Real humans exhibit involuntary micro-saccades and postural oscillations; deepfakes are unnaturally stable |

\*\*Combined Score:\*\*  
\`\`\`python  
def compute\_anti\_fraud\_score(results: dict) \-\> dict:  
    """  
    Ensemble scoring across all 6 layers.  
    Any single layer can trigger a block, but the combined score  
    provides nuanced risk assessment.  
    """  
    weights \= {  
        "device\_integrity": 0.10,  
        "active\_liveness": 0.25,  
        "injection\_detection": 0.20,  
        "texture\_analysis": 0.15,  
        "lighting\_consistency": 0.15,  
        "behavioral\_biometrics": 0.15  
    }  
      
    weighted\_score \= sum(  
        results\[layer\]\["score"\] \* weights\[layer\]  
        for layer in weights  
    )  
      
    \# Hard blocks: any layer with score \< 0.2 triggers immediate rejection  
    hard\_blocks \= \[  
        layer for layer in weights   
        if results\[layer\]\["score"\] \< 0.2  
    \]  
      
    return {  
        "composite\_score": round(weighted\_score, 3),  
        "verdict": "REJECT" if hard\_blocks or weighted\_score \< 0.5 else   
                   "REVIEW" if weighted\_score \< 0.7 else "PASS",  
        "hard\_blocks": hard\_blocks,  
        "layer\_details": results,  
        "explanation": generate\_deterministic\_explanation(  
            "BIOMETRIC\_ASSESSMENT", results  
        )  
    }  
\`\`\`

\#\#\#\# MODULE 2: FRAUD INTELLIGENCE FEED

\*\*This is the "Data Play" from Gemini Research 3:\*\*  
\> \*"By aggregating anonymized fraud signals across its network, VigilanceOS can offer a high-value 'Fraud Intelligence Feed' to institutional partners, creating a defensive moat and a secondary revenue stream."\*

| Feature | Description | Business Value |  
|---------|-------------|----------------|  
| \*\*Device Blacklist\*\* | Devices that have been used in confirmed fraud attempts across the network | A device blocked at Bank A is instantly flagged at Bank B |  
| \*\*Fraud Pattern Library\*\* | Anonymized attack signatures: "deepfake injection via OBS with X characteristics" | Proactive defense against known attack vectors |  
| \*\*Attack Trend Dashboard\*\* | Real-time visualization of attack types, volumes, geographic origins | Intelligence for compliance officers and CISOs |

\---

\#\#\# Demo Script Addition (Concept 3\)

\> \*\*Act 0 (30s): "The Fear Pitch"\*\* (Before the standard demo)  
\> "In 2025, deepfake attacks on financial systems increased twentyfold. Watch what happens when someone tries to fool our system."  
\> \*\[Live demo: Play a pre-recorded video of a face through the liveness check. System catches it at Layer 3 (injection detection) and Layer 6 (behavioral biometrics). Show the detailed rejection screen with per-layer scores.\]\*  
\> "Six layers of defense. The deepfake passed the face match — it was a good fake. But it couldn't fool the frame jitter analysis or the micro-movement detector. This is what iBeta-grade security looks like."

\---

\#\#\# Research Backing

\- \*\*Gemini Research 1:\*\* \*"The proliferation of Generative AI tools has democratized the creation of high-quality deepfakes. Between 2022 and 2025, deepfake attacks reportedly increased by twentyfold."\*  
\- \*\*Gemini Research 2, Opportunity 2:\*\* \*"There is a vacuum for a provider that leads with 'multimodal defense.' This opportunity involves integrating 3D face-maps, LiDAR depth-capture, and passive liveness detection as standard features rather than expensive add-ons."\*  
\- \*\*Grok v2:\*\* \*"AI deepfakes bypassing checks adding fuel to the fire, making people question if automation just opens new scam doors."\* — We answer that question definitively.

\#\#\# Tech Moat

Multi-modal ensemble that requires defeating 6 independent detection systems simultaneously. Individual layers are not novel; the \*\*ensemble architecture with weighted scoring and hard-block triggers\*\* is the innovation. Each layer adds marginal compute cost but dramatically increases attack cost for adversaries.

\#\#\# Startup Feasibility

Layers 1-3 are already in Concept 1\. Layers 4-6 add approximately 1 additional day of development:  
\- Texture analysis (FFT-based): well-documented OpenCV technique, \~4 hours  
\- Lighting consistency: basic gradient analysis, \~4 hours  
\- Behavioral biometrics (micro-movement): measure frame-to-frame landmark position variance, \~4 hours

\---

\---

\# WHAT TO KILL (ACROSS ALL CONCEPTS)

These features from the original specs are \*\*permanently removed\*\* regardless of which concept you choose:

| Feature | Reason for Death | Source |  
|---------|-----------------|--------|  
| \*\*Flash Passive Liveness as primary\*\* | Hardware-dependent magic number, fails on target market devices | Roast v3 CVE-01 |  
| \*\*12-rule static AML engine\*\* | "Competitively obsolete on Day 1" — your own research | Roast v3 CVE-02, Gemini Research 1 |  
| \*\*SHA-256 hash of Aadhaar\*\* | Criminal liability — reversible in 4 hours on GPU cluster | Roast v2 Critical 3 |  
| \*\*\`masked\_number\` storing last 4 Aadhaar digits\*\* | Combined with name/DOB \= identity reconstruction | Roast v3 SEC-01 |  
| \*\*LLM summaries on every alert\*\* | Token burn \+ hallucination liability | Roast v3 CVE-04, Roast v2 Critical 2 |  
| \*\*LLM text in STR/CTR filings\*\* | "LLMs are prohibited from generating text in regulatory filings. Period." | Roast v2 Critical 2 |  
| \*\*Dual PostgreSQL \+ Neo4j\*\* | Operational complexity exceeds team capacity, consistency nightmare | Roast v3 AD-02 |  
| \*\*\`face\_recognition\` library (dlib)\*\* | Security CVE factory, inactive since 2022, biased threshold | Roast v3 SEC-03 |  
| \*\*\`MediaDeviceInfo.label\` for virtual camera detection\*\* | User-controlled string, trivially spoofable | Roast v2 Critical 1 |  
| \*\*Single OpenSanctions API without fallback\*\* | Criminal liability feature with zero error handling | Roast v3 CVE-03 |  
| \*\*Video KYC with compliance officer (WebRTC)\*\* | "3-day project by itself" — scope overreach | Roast v1 "What to Cut" |  
| \*\*Aadhaar Verhoeff checksum validation\*\* | Irrelevant if using DigiLocker (pre-verified data) | Roast v1 "What to Cut" |  
| \*\*FINnet XML generation\*\* | No judge will verify XML compliance; mock PDF instead | Roast v1 "What to Cut" |  
| \*\*TensorFlow.js custom anti-spoof model\*\* | Training takes weeks; MediaPipe \+ injection detection is sufficient | Roast v1 "What to Cut" |  
| \*\*Cross-border / FEMA rules\*\* | All demo data is domestic; don't build rules you can't demo | Roast v1 "What to Cut" |  
| \*\*Dynamic thresholding (Diwali mode)\*\* | Invisible in demo; mention in slides | Roast v1 "What to Cut" |

\---

\# MY RECOMMENDATION

\*\*Build Concept 1 ("VigilanceOS Lite") as the foundation.\*\* This is your 5-day achievable scope with the highest demo impact.

\*\*Layer Concept 3's security features\*\* on top if P4 (ML/AI Lead) finishes core biometrics ahead of schedule on Day 2\. The texture analysis and lighting consistency checks are 4-hour additions that dramatically improve the demo narrative.

\*\*Present Concept 2's Re-KYC vision\*\* as your "6-month roadmap" slide. This is what makes you investable beyond the hackathon. The demo shows you can build the engine; the roadmap shows you understand where the market is going.

\*\*Your demo should tell three stories:\*\*  
1\. \*\*"We verify in 15 seconds"\*\* (Concept 1, Module 1\)  
2\. \*\*"We see fraud that rules miss"\*\* (Concept 1, Module 2 — the Money Map moment)  
3\. \*\*"We make compliance provable"\*\* (Concept 1, Module 4 — the hash chain moment)

And then the final slide:  
\> \*\*"What's next: Agentic Re-KYC. We don't just onboard customers. We keep them compliant for life. 51% of Jharkhand's bank accounts are at risk of being frozen. We fix that."\*\*

That's a company, not a hackathon project.

Now go build it.  
