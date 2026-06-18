from datetime import timedelta
from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class KYCMismatchRule(AMLRule):
    """
    KYC Rule: Compares transaction volume against declared occupation income profile.
    """

    # Monthly thresholds in INR
    OCCUPATION_THRESHOLDS = {
        "Student": 50_000.0,
        "Salaried": 500_000.0,
        "Business Owner": 5_000_000.0,
        "Jeweler": 10_000_000.0,
        "Real Estate": 10_000_000.0,
        "Unemployed": 10_000.0
    }
    
    DEFAULT_THRESHOLD = 200_000.0

    @property
    def rule_id(self) -> str:
        return "R-501"

    @property
    def rule_name(self) -> str:
        return "KYC Profile Mismatch"

    @property
    def default_severity(self) -> Severity:
        return Severity.HIGH

    def evaluate(self, context: RuleContext) -> RuleResult:
        triggered = False
        confidence = 0.0
        explanation = ""
        evidence = {}

        occupation = context.user_occupation if context.user_occupation else "Unemployed"
        limit = self.OCCUPATION_THRESHOLDS.get(occupation, self.DEFAULT_THRESHOLD)

        # Calculate monthly volume (Current + Last 30 days)
        cutoff_date = context.transaction_time - timedelta(days=30)
        past_volume = sum(
            tx['amount'] for tx in context.recent_transactions 
            if tx.get('timestamp') >= cutoff_date
        )
        total_volume = past_volume + context.transaction_amount

        if total_volume > limit:
            triggered = True
            
            multiple = total_volume / limit
            
            # Confidence logic
            # 2x limit -> 0.7
            # 5x limit -> 0.9
            # 10x limit -> 1.0
            if multiple >= 10:
                confidence = 1.0
            elif multiple >= 5:
                confidence = 0.9
            elif multiple >= 2:
                confidence = 0.7
            else:
                confidence = 0.5 + (multiple - 1) * 0.2

            explanation = (f"Monthly volume ₹{total_volume:,.2f} exceeds declared occupation "
                           f"('{occupation}') threshold of ₹{limit:,.2f} by {multiple:.1f}x.")
            
            evidence = {
                'occupation': occupation,
                'threshold': limit,
                'total_volume_30d': total_volume,
                'exceed_multiplier': round(multiple, 2)
            }

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            severity=self.default_severity,
            confidence=confidence,
            explanation=explanation,
            evidence=evidence
        )
