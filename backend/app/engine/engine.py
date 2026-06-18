import logging
from typing import List
from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

# Import all rules
from app.engine.rules.ctr_threshold import CTRThresholdRule
from app.engine.rules.pan_evasion import PANEvasionRule
from app.engine.rules.structuring import StructuringRule
from app.engine.rules.sanctions_match import SanctionsMatchRule
from app.engine.rules.pep_flag import PEPFlagRule
from app.engine.rules.dormant_wakeup import DormantWakeUpRule
from app.engine.rules.geo_velocity import GeoVelocityRule
from app.engine.rules.kyc_mismatch import KYCMismatchRule
from app.engine.rules.high_risk_occupation import HighRiskOccupationRule
from app.engine.rules.occupation_mismatch import OccupationMismatchRule

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AMLEngine:
    """
    Core Sentinel AML Engine.
    Orchestrates the execution of all registered rules.
    """

    SEVERITY_WEIGHTS = {
        Severity.LOW: 10,
        Severity.MEDIUM: 25,
        Severity.HIGH: 50,
        Severity.CRITICAL: 100
    }

    def __init__(self):
        self.rules: List[AMLRule] = []
        self._register_default_rules()

    def _register_default_rules(self):
        """Register the standard set of rules defined in the system."""
        self.register_rule(CTRThresholdRule())
        self.register_rule(PANEvasionRule())
        self.register_rule(StructuringRule())
        self.register_rule(SanctionsMatchRule())
        self.register_rule(PEPFlagRule())
        self.register_rule(DormantWakeUpRule())
        self.register_rule(GeoVelocityRule())
        self.register_rule(KYCMismatchRule())
        self.register_rule(HighRiskOccupationRule())
        self.register_rule(OccupationMismatchRule())

    def register_rule(self, rule: AMLRule):
        """Allows registering custom rules at runtime."""
        self.rules.append(rule)
        logger.info(f"Registered rule: {rule.rule_name} ({rule.rule_id})")

    def evaluate(self, context: RuleContext) -> List[RuleResult]:
        """
        Runs the context through all registered rules.
        Ensures robustness: a failure in one rule does not crash the engine.
        """
        results = []
        
        for rule in self.rules:
            try:
                result = rule.evaluate(context)
                if result.triggered:
                    results.append(result)
            except Exception as e:
                logger.error(f"Error executing rule {rule.rule_id}: {str(e)}")
                # Append an error result so ops team knows a rule failed
                results.append(RuleResult(
                    rule_id=rule.rule_id,
                    rule_name=rule.rule_name,
                    triggered=True, # Triggered on error to force review
                    severity=Severity.HIGH,
                    confidence=0.0,
                    explanation=f"Rule execution failed: {str(e)}",
                    evidence={'error_trace': str(e)}
                ))
        
        return results

    def get_max_severity(self, results: List[RuleResult]) -> Severity:
        """Returns the highest severity present in the results."""
        if not results:
            return Severity.LOW
            
        severity_order = {
            Severity.LOW: 1,
            Severity.MEDIUM: 2,
            Severity.HIGH: 3,
            Severity.CRITICAL: 4
        }
        
        max_sev = Severity.LOW
        max_val = 0
        
        for r in results:
            val = severity_order.get(r.severity, 0)
            if val > max_val:
                max_val = val
                max_sev = r.severity
                
        return max_sev

    def compute_transaction_risk(self, results: List[RuleResult]) -> int:
        """
        Computes an aggregate risk score (0-100) for the transaction.
        Formula: Sum(Weight * Confidence) clamped at 100.
        """
        total_score = 0.0
        
        for result in results:
            weight = self.SEVERITY_WEIGHTS.get(result.severity, 0)
            score_contribution = weight * result.confidence
            total_score += score_contribution
            
        return min(int(total_score), 100)
