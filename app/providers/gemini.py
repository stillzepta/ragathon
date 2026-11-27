"""Gemini adapter with a deterministic fallback for local demos."""

import os


class GeminiProvider:
    def __init__(self) -> None:
        self.model = os.getenv("MODEL_NAME", "gemini-2.0-flash")
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    @property
    def live(self) -> bool:
        return bool(self.api_key and os.getenv("MODEL_PROVIDER", "mock") != "mock")

    def generate(self, system: str, prompt: str) -> str:
        if not self.live:
            return ""
        try:
            from google import genai

            client = genai.Client(api_key=self.api_key)
            response = client.models.generate_content(
                model=self.model,
                contents=f"SYSTEM:\n{system}\n\nUSER:\n{prompt}",
            )
            return response.text or ""
        except Exception:
            return ""


def provider() -> GeminiProvider:
    return GeminiProvider()

