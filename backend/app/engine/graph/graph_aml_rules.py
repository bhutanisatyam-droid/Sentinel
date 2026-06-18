class AMLRule:
    """Base class for AML rules."""
    rule_id = "UNKNOWN"
    severity = "INFO"
    
    def __init__(self, graph_engine):
        self.graph_engine = graph_engine

    def evaluate(self, context: dict) -> dict:
        raise NotImplementedError("Subclasses must implement evaluate()")

class CircularFlowRule(AMLRule):
    rule_id = "AML_CIRCULAR_FLOW_001"
    severity = "HIGH"

    def evaluate(self, context: dict) -> dict:
        user_id = context.get("user_id")
        if not user_id:
            return {"triggered": False}

        cycle_results = self.graph_engine.detect_cycles(max_length=5)
        
        user_cycles = [c["nodes"] for c in cycle_results if user_id in c["nodes"]]
        if not user_cycles:
            return {"triggered": False, "confidence": 0.0}

        # Find the shortest cycle the user is in to determine confidence
        shortest_cycle_length = min([len(c) for c in user_cycles])
        
        confidence = 0.5  # default
        if shortest_cycle_length == 3:
            confidence = 0.9
        elif shortest_cycle_length == 4:
            confidence = 0.8
        elif shortest_cycle_length == 5:
            confidence = 0.7

        # Compile evidence
        evidence = {
            "cycles": user_cycles,
            "message": f"User is part of {len(user_cycles)} cycle(s). Shortest cycle length: {shortest_cycle_length}"
        }

        return {
            "triggered": True,
            "rule_id": self.rule_id,
            "severity": self.severity,
            "confidence": confidence,
            "evidence": evidence
        }

class FanPatternRule(AMLRule):
    rule_id = "AML_FAN_PATTERN_001"
    severity = "HIGH"

    def evaluate(self, context: dict) -> dict:
        user_id = context.get("user_id")
        if not user_id:
            return {"triggered": False}

        risk_signals = self.graph_engine.get_node_risk_signals(user_id)
        
        in_degree = risk_signals.get("in_degree", 0)
        out_degree = risk_signals.get("out_degree", 0)
        
        is_fan_in = in_degree > 5
        is_fan_out = out_degree > 5

        if not (is_fan_in or is_fan_out):
            return {"triggered": False, "confidence": 0.0}

        # Higher in/out degree = higher confidence
        max_degree = max(in_degree, out_degree)
        confidence = min(1.0, 0.5 + (max_degree - 5) * 0.05) 

        evidence = {
            "in_degree": in_degree,
            "out_degree": out_degree,
            "pattern_type": "FAN_IN" if is_fan_in else "FAN_OUT"
        }
        
        if is_fan_in and is_fan_out:
             evidence["pattern_type"] = "FAN_IN_AND_OUT"

        return {
            "triggered": True,
            "rule_id": self.rule_id,
            "severity": self.severity,
            "confidence": confidence,
            "evidence": evidence
        }
