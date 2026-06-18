from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class PANEvasionRule(AMLRule):
    """
    Regulatory Rule: PAN Limit Evasion.
    Flags cash deposits or transfers just below the ₹50,000 PAN requirement threshold.
    """
    
    EVASION_THRESHOLD = 49_000.0  
    PAN_LIMIT = 50_000.0

    @property
    def rule_id(self) -> str:
        return "R-102"

    @property
    def rule_name(self) -> str:
        return "PAN Limit Evasion"

    @property
    def default_severity(self) -> Severity:
        return Severity.MEDIUM

    def evaluate(self, context: RuleContext) -> RuleResult:
        triggered = False
        explanation = ""
        evidence = {}

        if self.EVASION_THRESHOLD <= context.transaction_amount < self.PAN_LIMIT:
            triggered = True
            explanation = (f"Transaction amount ₹{context.transaction_amount:,.2f} is just below the "
                           f"₹{self.PAN_LIMIT:,.0f} mandatory PAN reporting limit, indicating potential structuring.")
            evidence['trigger_type'] = "pan_evasion_single"
            evidence['amount'] = context.transaction_amount

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            severity=self.default_severity,
            confidence=0.85 if triggered else 0.0,
            explanation=explanation,
            evidence=evidence
        )
