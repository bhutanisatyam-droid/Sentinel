import re
from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity

class PEPFlagRule(AMLRule):
    """
    Compliance Rule: Checks if user is a Politically Exposed Person (PEP).
    Uses pattern matching and external risk tier verification.
    """

    PEP_KEYWORDS = [
        r"\bminister\b", r"\bsenator\b", r"\bgovernor\b", 
        r"\bambassador\b", r"\bjudge\b", r"\bmayor\b", r"\bpresident\b"
    ]

    @property
    def rule_id(self) -> str:
        return "R-005"

    @property
    def rule_name(self) -> str:
        return "Politically Exposed Person (PEP)"

    @property
    def default_severity(self) -> Severity:
        return Severity.HIGH

    def evaluate(self, context: RuleContext) -> RuleResult:
        triggered = False
        confidence = 0.0
        explanation = ""
        evidence = {}

        # Check 1: Occupation / Title pattern matching
        # Assuming user_occupation or user_id might contain title info
        combined_text = f"{context.user_occupation} {context.user_id}".lower()
        
        matched_keywords = []
        for pattern in self.PEP_KEYWORDS:
            if re.search(pattern, combined_text):
                matched_keywords.append(pattern.replace(r"\b", "").replace(r"\\", ""))

        if matched_keywords:
            triggered = True
            confidence = 0.7  # Initial hit based on keywords
            explanation = f"User profile contains PEP-related keywords: {', '.join(matched_keywords)}."
            evidence['keywords'] = matched_keywords

        # Check 2: Check risk tier
        if context.user_risk_tier == "PEP":
            triggered = True
            confidence = 1.0
            explanation = "User is explicitly flagged as PEP in risk database."
            evidence['risk_tier'] = context.user_risk_tier
        
        # If triggered, we ensure explanation is clear it's for Enhanced Due Diligence (EDD)
        if triggered and explanation == "":
             explanation = "Potential PEP match requiring Enhanced Due Diligence."

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            severity=self.default_severity,
            confidence=confidence,
            explanation=explanation,
            evidence=evidence
        )
