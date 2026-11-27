"""Model adapter with Gemini-first, Groq-fallback, and mock support."""

import os
from urllib import request
import json
try:
    from dotenv import load_dotenv
except ImportError:  # Keep tests and minimal installs usable; production installs the declared dependency.
    load_dotenv = None

if load_dotenv:
    load_dotenv()


class ModelProvider:
    def __init__(self) -> None:
        self.provider_name = os.getenv("MODEL_PROVIDER", "mock").lower()
        self.gemini_model = os.getenv("MODEL_NAME", "gemini-2.5-flash")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.used_provider = None
        self.groq_api_key = os.getenv("GROQ_API_KEY")

    @property
    def requested(self) -> bool:
        return self.provider_name in {"gemini", "groq"}

    @property
    def live(self) -> bool:
        return self.requested and bool(self.gemini_api_key or self.groq_api_key)

    def generate(self, system: str, prompt: str) -> str:
        if not self.live:
            return ""

        providers = [self.provider_name] if self.provider_name in {"gemini", "groq"} else []
        if self.gemini_api_key and "gemini" not in providers:
            providers.append("gemini")
        if self.groq_api_key and "groq" not in providers:
            providers.append("groq")

        for provider_name in providers:
            try:
                response = self._generate_gemini(system, prompt) if provider_name == "gemini" else self._generate_groq(system, prompt)
                if response:
                    self.used_provider = provider_name
                    return response
            except Exception:
                continue
        return ""

    def _generate_gemini(self, system: str, prompt: str) -> str:
        if not self.gemini_api_key:
            return ""
        from google import genai

        with genai.Client(api_key=self.gemini_api_key, http_options={"timeout": 12000}) as client:
            response = client.models.generate_content(
                model=self.gemini_model, contents=prompt,
                config={"system_instruction": system, "max_output_tokens": 600},
            )
        return response.text or ""

    def _generate_groq(self, system: str, prompt: str) -> str:
        if not self.groq_api_key:
            return ""
        payload = json.dumps({
            "model": self.groq_model,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}],
            "temperature": 0.2,
        }).encode()
        req = request.Request(
            "https://api.groq.com/openai/v1/chat/completions",
            data=payload,
            headers={"Authorization": f"Bearer {self.groq_api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode())
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")


def provider() -> ModelProvider:
    return ModelProvider()

