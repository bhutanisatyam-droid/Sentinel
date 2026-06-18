from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class OccupationMismatchRule(AMLRule):
    """
    Flags accounts/transactions where the transaction amount or account balance 
    is highly irregular for the given occupation (Classic Mule Account Indicator).
    For example: A student with a ₹10,00,000 balance/transaction.
    """
    
    @property
    def rule_id(self) -> str:
        return "OCC-002"

    @property
    def rule_name(self) -> str:
        return "Occupation-Balance Mismatch (Possible Mule)"

    @property
    def default_severity(self) -> Severity:
        return Severity.CRITICAL

    def evaluate(self, context: RuleContext) -> RuleResult:
        if not context.user_occupation:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                severity=Severity.LOW,
                confidence=0.0,
                explanation="No occupation data."
            )
            
        occupation = context.user_occupation.lower()
        amount = context.transaction_amount
        
        # Consider both transaction amount and account balance/avg
        check_amount = amount
        if getattr(context, 'account_balance', None):
             check_amount = max(amount, context.account_balance)
             
        # Rule 1: Student with > ₹1,00,000
        if "student" in occupation and check_amount > 100000:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=True,
                severity=Severity.CRITICAL,
                confidence=0.95,
                explanation=f"Highly suspicious: 'Student' occupation associated with very large amount (₹{check_amount:,.2f}). Possible mule account.",
                evidence={
                    "occupation": context.user_occupation,
                    "amount": check_amount,
                    "threshold": 100000
                }
            )
            
        # Rule 2: Unemployed with > ₹2,00,000
        if "unemployed" in occupation and check_amount > 200000:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=True,
                severity=Severity.HIGH,
                confidence=0.85,
                explanation=f"Suspicious: 'Unemployed' occupation with large amount (₹{check_amount:,.2f}).",
                evidence={
                    "occupation": context.user_occupation,
                    "amount": check_amount,
                    "threshold": 200000
                }
            )

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=False,
            severity=Severity.LOW,
            confidence=1.0,
            explanation="Amount is within expected bounds for occupation."
        )
