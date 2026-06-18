from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class HighRiskOccupationRule(AMLRule):
    """
    Flags transactions where the user's occupation is known to be
    associated with higher risk of money laundering or frequent cash flow.
    """
    
    HIGH_RISK_OCCUPATIONS = [
        "crypto", "cryptocurrency", "jeweler", "cash", "pep", 
        "politician", "casino", "gambling", "betting",
        "hawala", "unregistered money service"
    ]
    
    MEDIUM_RISK_OCCUPATIONS = [
        "real estate", "foreign exchange", "cash intensive business",
        "nightclub", "restaurant", "bar", "liquor", "pawn shop",
        "car dealer", "antique dealer"
    ]

    @property
    def rule_id(self) -> str:
        return "OCC-001"

    @property
    def rule_name(self) -> str:
        return "High-Risk Occupation"

    @property
    def default_severity(self) -> Severity:
        return Severity.MEDIUM

    def evaluate(self, context: RuleContext) -> RuleResult:
        if not context.user_occupation:
            return RuleResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                triggered=False,
                severity=self.default_severity,
                confidence=0.0,
                explanation="No occupation provided for assessment."
            )
            
        occupation_lower = context.user_occupation.lower()
        
        # Check High Risk
        for keyword in self.HIGH_RISK_OCCUPATIONS:
            if keyword in occupation_lower:
                return RuleResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    triggered=True,
                    severity=Severity.HIGH,
                    confidence=0.9,
                    explanation=f"User's occupation '{context.user_occupation}' matches high-risk category '{keyword}'.",
                    evidence={"occupation": context.user_occupation, "matched_keyword": keyword, "risk_level": "HIGH"}
                )
                
        # Check Medium Risk
        for keyword in self.MEDIUM_RISK_OCCUPATIONS:
            if keyword in occupation_lower:
                return RuleResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    triggered=True,
                    severity=Severity.MEDIUM,
                    confidence=0.8,
                    explanation=f"User's occupation '{context.user_occupation}' matches medium-risk category '{keyword}'.",
                    evidence={"occupation": context.user_occupation, "matched_keyword": keyword, "risk_level": "MEDIUM"}
                )
                
        # Low risk / No flag
        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=False,
            severity=Severity.LOW,
            confidence=1.0,
            explanation="Occupation is standard risk."
        )
