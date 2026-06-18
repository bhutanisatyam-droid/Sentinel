class AMLEngine:
    @staticmethod
    def compute_transaction_risk(rule_results: list) -> int:
        """Mock implementation: Replace with actual AMLEngine logic."""
        return sum(rule.get("score", 0) for rule in rule_results)


class RiskScoringEngine:
    def calculate_onboarding_risk(self, user_data: dict) -> dict:
        reasons = []

        # 1. Identity Consistency (30% weight scope)
        id_score = 0
        identity = user_data.get("identity", {})
        
        name_match = identity.get("name_match_score", 1.0)
        if name_match < 0.9:
            id_score += 15
            reasons.append(f"Name match score low ({name_match})")

        if identity.get("dob_mismatch", False):
            id_score += 50
            reasons.append("DOB mismatch between documents")

        face_match = identity.get("face_match_score", 1.0)
        if face_match < 0.6:
            id_score += 60
            reasons.append(f"Face match score critically low ({face_match})")
        elif face_match < 0.8:
            id_score += 40
            reasons.append(f"Face match score low ({face_match})")

        if identity.get("ocr_confidence_low", False):
            id_score += 10
            reasons.append("OCR confidence low on one or more fields")

        # 2. Watchlist Screening (50% weight scope)
        wl_score = 0
        watchlist = user_data.get("watchlist", {})
        
        if watchlist.get("pep_status_confirmed", False):
            wl_score += 40
            reasons.append("PEP status confirmed")

        sanctions_status = watchlist.get("sanctions_status", "CLEAN")
        if sanctions_status == "HIT":
            wl_score += 100
            reasons.append("Sanctions hit (Auto-reject)")
        elif sanctions_status == "UNKNOWN":
            wl_score += 80
            reasons.append("Sanctions status UNKNOWN (Manual review required)")

        if watchlist.get("adverse_media_found", False):
            wl_score += 30
            reasons.append("Adverse media found")

        # 3. Demographics (20% weight scope)
        demo_score = 0
        demographics = user_data.get("demographics", {})
        
        age = demographics.get("age", 30)
        if age < 18 or age > 80:
            demo_score += 10
            reasons.append(f"Age outside standard range ({age})")

        occupation = demographics.get("occupation", "")
        if occupation in {"Jeweler", "Real Estate", "Money Exchanger"}:
            demo_score += 40
            reasons.append(f"High-risk occupation ({occupation})")

        if demographics.get("high_risk_ip_country", False):
            demo_score += 100
            reasons.append("High-risk IP country (Auto-reject)")

        account_age_days = demographics.get("account_age_days", 30)
        if account_age_days < 7:
            demo_score += 5
            reasons.append("New account (< 7 days)")

        # Final Calculation
        total_sum = id_score + wl_score + demo_score
        final_score = min(total_sum, 100)

        # Determine Tier and Auto-Decision
        if final_score == 100:
            tier = "BLACKLIST"
            auto_decision = "reject"
        elif final_score >= 61:
            tier = "RED"
            auto_decision = "review"
        elif final_score >= 21:
            tier = "YELLOW"
            auto_decision = "review"
        else:
            tier = "GREEN"
            auto_decision = "approve"

        return {
            "score": final_score,
            "tier": tier,
            "reasons": reasons,
            "auto_decision": auto_decision,
            "breakdown": {
                "identity_score": id_score,
                "watchlist_score": wl_score,
                "demographic_score": demo_score
            }
        }

    def calculate_transaction_risk(self, rule_results: list, anomaly_result: dict, graph_signals: dict) -> dict:
        reasons = []

        # Layer 1 - Rules Engine
        layer1_score = AMLEngine.compute_transaction_risk(rule_results)
        if layer1_score > 0:
            reasons.append(f"Rules engine contributed {layer1_score} points")

        # Layer 2 - Machine Learning Anomaly Score
        anomaly_score_raw = anomaly_result.get("anomaly_score", 0.0)
        layer2_score = min(int(anomaly_score_raw * 40), 40)
        if layer2_score > 0:
            reasons.append(f"Anomaly detection contributed {layer2_score} points")

        # Layer 3 - Graph Network Signals
        layer3_score = 0
        if graph_signals.get("in_cycle", False):
            layer3_score += 30
            reasons.append("Graph: Entity is in a suspicious transaction cycle")

        fan_in = graph_signals.get("fan_in", 0)
        fan_out = graph_signals.get("fan_out", 0)
        if fan_in > 5 or fan_out > 5:
            layer3_score += 20
            reasons.append(f"Graph: High fan-in ({fan_in}) or fan-out ({fan_out})")

        if graph_signals.get("high_centrality", False):
            layer3_score += 10
            reasons.append("Graph: Entity demonstrates high network centrality")

        # Combined Calculation
        combined_score = min(layer1_score + layer2_score + layer3_score, 100)

        return {
            "score": combined_score,
            "reasons": reasons,
            "breakdown": {
                "layer1_rules_score": layer1_score,
                "layer2_ml_score": layer2_score,
                "layer3_graph_score": layer3_score
            }
        }
