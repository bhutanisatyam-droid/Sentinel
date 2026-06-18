from datetime import timedelta
from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class CTRThresholdRule(AMLRule):
    """
    Regulatory Rule: Cash Transaction Report (CTR).
    Mandates reporting for transactions > 10 Lakhs or cumulative cash deposits > 10 Lakhs/month.
    """
    
    THRESHOLD = 1_000_000.0  # 10 Lakh INR

    @property
    def rule_id(self) -> str:
        return "R-101"

    @property
    def rule_name(self) -> str:
        return "CTR Threshold Exceeded"

    @property
    def default_severity(self) -> Severity:
        return Severity.CRITICAL

    def evaluate(self, context: RuleContext) -> RuleResult:
        triggered = False
        explanation = ""
        evidence = {}

        # Check 1: Single Transaction Threshold
        if context.transaction_amount > self.THRESHOLD:
            triggered = True
            diff = context.transaction_amount - self.THRESHOLD
            explanation = (f"Single transaction amount ₹{context.transaction_amount:,.2f} "
                           f"exceeds CTR threshold by ₹{diff:,.2f}.")
            evidence['trigger_type'] = "single_transaction"
            evidence['amount'] = context.transaction_amount

        # Check 2: Cumulative Cash Deposits (if single check didn't trigger)
        # Assuming we look back 30 days
        current_amount = context.transaction_amount if context.transaction_type == "CASH_DEPOSIT" else 0.0
        
        # Calculate past cash deposits
        cutoff_date = context.transaction_time - timedelta(days=30)
        past_deposits = [
            tx for tx in context.recent_transactions 
            if tx.get('type') == "CASH_DEPOSIT" and tx.get('timestamp') >= cutoff_date
        ]
        
        total_past_cash = sum(tx['amount'] for tx in past_deposits)
        total_monthly_cash = total_past_cash + current_amount

        if not triggered and total_monthly_cash > self.THRESHOLD:
            triggered = True
            diff = total_monthly_cash - self.THRESHOLD
            explanation = (f"Cumulative cash deposits ₹{total_monthly_cash:,.2f} in last 30 days "
                           f"exceed CTR threshold by ₹{diff:,.2f}.")
            evidence['trigger_type'] = "cumulative_cash"
            evidence['total_monthly_cash'] = total_monthly_cash
            evidence['transaction_ids'] = [tx.get('id') for tx in past_deposits] # Assuming ID exists or is implied

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            severity=self.default_severity,
            confidence=1.0,  # Regulatory binary requirement
            explanation=explanation,
            evidence=evidence
        )
