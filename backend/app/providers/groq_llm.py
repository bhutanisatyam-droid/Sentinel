import asyncio
from openai import AsyncOpenAI
from typing import Dict, Any, Tuple
from app.providers.base import LLMProvider
from app.config import get_settings
from app.utils.pii_redactor import redact_for_llm
import json

settings = get_settings()

class GroqLLMProvider(LLMProvider):
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
            max_retries=0  # Disable SDK retries to prevent blocking Uvicorn worker
        )
        self.model = "llama-3.1-8b-instant"

    async def generate_alert_summary(self, alert_context: Dict[str, Any]) -> str:
        # Use the existing PII redactor from app.utils.pii_redactor
        redacted_json = redact_for_llm(
            json.dumps(alert_context, default=str),
            known_names=[alert_context.get("customer_name", "")]
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an AML compliance analyst assistant. "
                            "Generate a brief, professional summary of why this transaction was flagged. "
                            "Be factual and objective. Use industry terminology. "
                            "Maximum 3 sentences. Do not speculate. "
                            "Do not make claims about intent. "
                            "Only describe the observed pattern. "
                            "End with: '[AI-GENERATED — NOT FOR REGULATORY FILING]'"
                        )
                    },
                    {
                        "role": "user",
                        "content": redacted_json
                    }
                ],
                temperature=0.1,
                max_tokens=200
            )
            summary = response.choices[0].message.content.strip()

            # Ensure watermark is present
            if "[AI-GENERATED" not in summary:
                summary += "\n[AI-GENERATED — NOT FOR REGULATORY FILING]"

            return summary

        except Exception as e:
            err_str = str(e)
            if "429" in err_str:
                rules_triggered = alert_context.get("rules_triggered", [])
                amount = alert_context.get("transaction", {}).get("amount", "Unknown")
                return f"[AI-GENERATED — NOT FOR REGULATORY FILING]\nRate Limit Exceeded. Auto-Explainability: Flagged for manual review due to suspicious profile. Amount: ₹{amount}. Rules triggered: {', '.join(rules_triggered)}."
            return f"Automated summary unavailable ({err_str[:50]}). Please review transaction details manually."

    async def generate_kyc_rejection_explanation(self, match_score: float) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful customer support assistant for Sentinel, an AI-powered KYC system. "
                            "The user's KYC verification failed because their live selfie biometric match score against "
                            "their ID document was too low (below the 75% threshold). "
                            "Write a polite, empathetic 3-sentence explanation instructing them to try again, "
                            "ensure good lighting, and make sure their face is clearly visible and matches the ID. "
                            "Do NOT mention any internal details or code. Just state the match score conceptually or rounded."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"The user's face match score was {match_score}%."
                    }
                ],
                temperature=0.3,
                max_tokens=150
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Verification rejected due to a biometric match score of {match_score}%. Please ensure good lighting and a clear view of your face, then try again."
