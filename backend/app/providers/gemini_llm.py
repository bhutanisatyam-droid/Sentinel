import google.generativeai as genai
from typing import Dict, Any, Tuple
from app.providers.base import LLMProvider
from app.config import get_settings
import json

settings = get_settings()

class GeminiLLMProvider(LLMProvider):
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def _redact_pii(self, context: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """
        Simple redaction strategy. In production, use Microsoft Presidio or similar.
        """
        redacted = context.copy()
        redaction_map = {}
        
        # Redact Name
        if "customer_name" in redacted:
            fake_name = "ENTITY_001"
            redaction_map[fake_name] = redacted["customer_name"]
            redacted["customer_name"] = fake_name

        # Redact ID info
        if "account_id" in redacted:
             fake_id = "ACC_XXX"
             redaction_map[fake_id] = redacted["account_id"]
             redacted["account_id"] = fake_id

        return redacted, redaction_map

    async def generate_alert_summary(self, alert_context: Dict[str, Any]) -> str:
        redacted_context, _ = self._redact_pii(alert_context)
        
        prompt = f"""
        System: You are an AML compliance analyst assistant. Generate a brief,
        professional summary of why this transaction was flagged. Be factual and
        objective. Use industry terminology. Maximum 2 sentences. Do not speculate.
        Do not make claims about intent. Only describe the observed pattern.
        
        User: {json.dumps(redacted_context)}
        """

        try:
            response = await self.model.generate_content_async(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1
                )
            )
            summary = response.text
            
            # Basic validation
            if len(summary) > 500:
                return "Transaction flagged due to unusual activity patterns. (Summary truncated)"
            
            return summary

        except Exception:
            # Fallback
            return "Automated summary unavailable. Please review transaction details manually."
