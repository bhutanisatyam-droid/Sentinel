from datetime import timedelta
from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class StructuringRule(AMLRule):
    """
    Behavioral Rule: Detects 'Smurfing' or Structuring.
    Identifies multiple transactions just below a reporting threshold.
    """
    
    DEFAULT_THRESHOLD = 50_000.0
    LOWER_BOUND_PCT = 0.80
    MIN_COUNT = 3
    WINDOW_HOURS = 72

    def __init__(self, threshold: float = None):
        self.threshold = threshold if threshold else self.DEFAULT_THRESHOLD

    @property
    def rule_id(self) -> str:
        return "R-205"

    @property
    def rule_name(self) -> str:
        return "Potential Structuring (Smurfing)"

    @property
    def default_severity(self) -> Severity:
        return Severity.HIGH

    def evaluate(self, context: RuleContext) -> RuleResult:
        # Define the suspicious range
        lower_bound = self.threshold * self.LOWER_BOUND_PCT
        upper_bound = self.threshold # Exclusive of the exact threshold usually, or inclusive if strictly under CTR
        
        # Is current transaction relevant?
        # We assume Structuring is primarily about Credits/Deposits
        if context.transaction_amount < lower_bound or context.transaction_amount >= upper_bound:
            # Current transaction is not in the "danger zone", but we must check if it completes a pattern?
            # For simplicity, if the current tx isn't suspicious, we might skip, 
            # OR we check if this tx + recent ones form a cluster. 
            # Let's strictly check if *this* transaction is part of a cluster in the window.
            pass

        # Filter recent transactions within window
        window_start = context.transaction_time - timedelta(hours=self.WINDOW_HOURS)
        
        suspicious_txs = []
        
        # Check current transaction
        is_current_suspicious = (lower_bound <= context.transaction_amount < upper_bound)
        if is_current_suspicious:
            suspicious_txs.append({
                'amount': context.transaction_amount,
                'timestamp': context.transaction_time,
                'id': 'current'
            })

        # Check history
        for tx in context.recent_transactions:
            if (tx['timestamp'] >= window_start and 
                lower_bound <= tx['amount'] < upper_bound):
                suspicious_txs.append(tx)

        count = len(suspicious_txs)
        triggered = count >= self.MIN_COUNT

        confidence = 0.0
        explanation = ""
        evidence = {}

        if triggered:
            # Calculate Confidence
            # Factor A: Proximity to threshold. Closer to limit = higher suspicion.
            avg_amount = sum(t['amount'] for t in suspicious_txs) / count
            proximity_score = avg_amount / self.threshold
            
            # Factor B: Count. More transactions = higher suspicion.
            # Normalizing count: 3 -> 0.5, 6 -> 1.0 (capped)
            count_score = min((count - self.MIN_COUNT + 1) * 0.2 + 0.5, 1.0)
            
            confidence = (proximity_score * 0.6) + (count_score * 0.4)
            confidence = min(confidence, 1.0)

            total_amount = sum(t['amount'] for t in suspicious_txs)
            explanation = (f"Detected {count} transactions totaling ₹{total_amount:,.2f} "
                           f"in the range ₹{lower_bound:,.0f}-₹{upper_bound:,.0f} "
                           f"within {self.WINDOW_HOURS} hours.")
            
            evidence = {
                'suspicious_transactions': suspicious_txs,
                'window_start': window_start.isoformat(),
                'threshold_used': self.threshold
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
