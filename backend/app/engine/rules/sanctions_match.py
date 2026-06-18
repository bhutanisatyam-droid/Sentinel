from app.engine.rules.base import AMLRule, RuleContext, RuleResult, Severity
import random

from app.providers.base import get_provider, SanctionsProvider



class SanctionsMatchRule(AMLRule):
    """
    Critical Rule: Screens user against sanctions lists.
    """

    def __init__(self):
        self.provider = get_provider(SanctionsProvider)

    @property
    def rule_id(self) -> str:
        return "R-001"

    @property
    def rule_name(self) -> str:
        return "Global Sanctions Hit"

    @property
    def default_severity(self) -> Severity:
        return Severity.CRITICAL

    def evaluate(self, context: RuleContext) -> RuleResult:
        triggered = False
        confidence = 0.0
        explanation = ""
        evidence = {}
        
        # We assume the user's name is available via context.user_id or we'd need a name field.
        # For this implementation, let's assume user_id might contain the name or we define a mock name lookup.
        # In a real scenario, RuleContext would likely have `user_name`. 
        # Using `user_id` as the name proxy for this specific code block requirement.
        target_name = context.user_id 

        try:
            result = self.provider.screen_entity(target_name)
            score = result.get("score", 0.0)
            
            if score > 0.80:
                triggered = True
                confidence = score
                explanation = (f"User matched against {result.get('list')} "
                               f"with confidence score {score}.")
                evidence = result
            
        except Exception as e:
            # Fail-open / Conservative approach
            triggered = True
            confidence = 0.5 # Medium confidence, but CRITICAL severity forces review
            explanation = "Unable to verify sanctions status — manual review required (Provider Down)."
            evidence = {"error": str(e)}

        return RuleResult(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            triggered=triggered,
            severity=self.default_severity,
            confidence=confidence,
            explanation=explanation,
            evidence=evidence
        )
