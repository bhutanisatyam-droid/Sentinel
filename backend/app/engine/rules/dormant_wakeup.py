from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class DormantWakeUpRule(AMLRule):
    """
    Behavioral Rule: Detects sudden activity in a dormant account.
    """
    
    DORMANCY_THRESHOLD_DAYS = 180
    AMOUNT_THRESHOLD = 50_000.0

    @property
    def rule_id(self) -> str:
        return "R-301"

    @property
    def rule_name(self) -> str:
        return "Dormant Account Wake-up"

    @property
    def default_severity(self) -> Severity:
        return Severity.MEDIUM

    def evaluate(self, context: RuleContext) -> RuleResult:
        triggered = False
        confidence = 0.0
        explanation = ""
        evidence = {}

        is_dormant = context.user_last_activity_days > self.DORMANCY_THRESHOLD_DAYS
        is_large_tx = context.transaction_amount > self.AMOUNT_THRESHOLD

        if is_dormant and is_large_tx:
            triggered = True
            
            # Confidence scaling based on duration
            days = context.user_last_activity_days
            if 180 <= days < 270:
                # Map 180->0.5, 270->0.65
                confidence = 0.5 + ((days - 180) / 90) * 0.15
            elif 270 <= days < 365:
                # Map 270->0.65, 365->0.80
                confidence = 0.65 + ((days - 270) / 95) * 0.15
            else:
                # > 365
                confidence = 0.80 + (min(days - 365, 365) / 365) * 0.15
                confidence = min(confidence, 0.95)

            explanation = (f"Account active after {days} days of dormancy with "
                           f"significant transaction of ₹{context.transaction_amount:,.2f}.")
            
            evidence = {
                'dormancy_days': days,
                'last_activity_threshold': self.DORMANCY_THRESHOLD_DAYS,
                'current_amount': context.transaction_amount
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
