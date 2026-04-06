import os
from openai import OpenAI
from config import GROQ_API_KEY, OPENROUTER_API_KEY, AI_PROVIDER


class AIService:
    """
    AI service with automatic failover between Groq and OpenRouter.

    Flow:
    1. Try the preferred provider (default: Groq)
    2. If rate-limited (429), automatically switch to the other provider
    3. If both fail, return the error message

    Both Groq and OpenRouter use the OpenAI SDK format, making them easy to swap!
    """

    def __init__(self):
        # Configure Groq (Uses Llama 3)
        self.groq_client = None
        if GROQ_API_KEY:
            self.groq_client = OpenAI(
                api_key=GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )

        # Configure OpenRouter (Uses free tier models like Gemini Flash Lite)
        self.or_client = None
        if OPENROUTER_API_KEY:
            self.or_client = OpenAI(
                api_key=OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
            )

        # Provider order: primary first, fallback second
        self.primary = AI_PROVIDER or "groq"
        self.fallback = "openrouter" if self.primary == "groq" else "groq"

        print(f"🤖 AI Service: primary={self.primary}, fallback={self.fallback}")
        print(f"   Groq:       {'✅ configured' if self.groq_client else '❌ no API key'}")
        print(f"   OpenRouter: {'✅ configured' if self.or_client else '❌ no API key'}")

    async def chat(self, message: str, context: str = "") -> str:
        """
        Send a chat message. Tries primary provider first,
        falls back to the other if rate-limited.
        """
        # Try primary provider
        try:
            return await self._call_provider(self.primary, message, context)
        except RateLimitError as e:
            print(f"⚠️ {self.primary} rate-limited, switching to {self.fallback}...")

        # Try fallback provider
        try:
            reply = await self._call_provider(self.fallback, message, context)
            return f"💡 (ตอบโดย {self.fallback.upper()})\n\n{reply}"
        except RateLimitError:
            return (
                "⚠️ ทั้ง Groq และ OpenRouter ถูกจำกัดอัตราการใช้งาน\n"
                "กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
            )
        except Exception as e:
            return f"⚠️ {self.fallback} error: {str(e)}"

    async def _call_provider(self, provider: str, message: str, context: str) -> str:
        """Route to the correct provider."""
        if provider == "groq":
            return await self._call_openai_compatible(
                client=self.groq_client,
                model="llama-3.3-70b-versatile",
                message=message,
                context=context,
                provider_name="Groq"
            )
        elif provider == "openrouter":
            return await self._call_openai_compatible(
                client=self.or_client,
                model="google/gemini-2.5-flash",
                message=message,
                context=context,
                provider_name="OpenRouter"
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")

    def _build_system_prompt(self, context: str) -> str:
        """Build the system prompt (shared between providers)."""
        prompt = (
            "คุณคือผู้เชี่ยวชาญด้านการเกษตรและดิน (soil expert). "
            "ตอบคำถามเกี่ยวกับดินและพืชเป็นภาษาไทย. "
            "ห้ามวิเคราะห์ข้อมูลดิบใหม่ — ให้ใช้ผลการวิเคราะห์จากระบบ DinApp เท่านั้น."
        )
        if context:
            prompt += f"\n\nผลวิเคราะห์จากระบบ DinApp:\n{context}"
        return prompt

    async def _call_openai_compatible(self, client, model: str, message: str, context: str, provider_name: str) -> str:
        if not client:
            raise ProviderNotConfiguredError(f"{provider_name} API key not configured.")

        system_prompt = self._build_system_prompt(context)

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                max_tokens=1024,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "rate" in error_msg.lower() or "quota" in error_msg.lower():
                raise RateLimitError(f"{provider_name}: {error_msg}")
            raise


# ===== Custom Exceptions =====
class RateLimitError(Exception):
    pass

class ProviderNotConfiguredError(Exception):
    pass


# Singleton instance
ai_service = AIService()
