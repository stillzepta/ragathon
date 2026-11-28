"""Model adapter with Gemini-first, Groq-fallback, and mock support."""

import json
import os
from collections.abc import Callable
from urllib import request

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
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_model = os.getenv("OPENROUTER_MODEL", "openrouter/free")

    @property
    def requested(self) -> bool:
        return self.provider_name in {"gemini", "groq", "openrouter"}

    @property
    def live(self) -> bool:
        return self.requested and bool(self.gemini_api_key or self.groq_api_key or self.openrouter_api_key)

    def generate(
        self, system: str, prompt: str, *,
        preferred_provider: str | None = None,
        accept: Callable[[str], bool] = bool,
        image_data_url: str | None = None,
    ) -> str:
        self.used_provider = None
        if not self.live:
            return ""

        providers = [preferred_provider or self.provider_name]
        if self.gemini_api_key and "gemini" not in providers:
            providers.append("gemini")
        if self.groq_api_key and "groq" not in providers:
            providers.append("groq")

        for provider_name in providers:
            try:
                if provider_name == "openrouter":
                    response = self._generate_openrouter(system, prompt, image_data_url=image_data_url)
                elif provider_name == "groq":
                    response = self._generate_groq(system, prompt)
                else:
                    response = self._generate_gemini(system, prompt)
                if response and accept(response):
                    self.used_provider = provider_name
                    return response
            except Exception:  # noqa: BLE001, S112 - Provider SDK failures should trigger failover.
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

    def _generate_openrouter(self, system: str, prompt: str, image_data_url: str | None = None) -> str:
        return self._chat_completion(
            "https://openrouter.ai/api/v1/chat/completions",
            self.openrouter_api_key, self.openrouter_model, system, prompt, image_data_url=image_data_url,
        )

    def _generate_groq(self, system: str, prompt: str) -> str:
        return self._chat_completion(
            "https://api.groq.com/openai/v1/chat/completions",
            self.groq_api_key, self.groq_model, system, prompt,
        )

    def _chat_completion(
        self,
        url: str,
        key: str | None,
        model: str,
        system: str,
        prompt: str,
        image_data_url: str | None = None,
    ) -> str:
        if not key:
            return ""
        user_content: str | list[dict] = (
            [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_data_url}},
            ]
            if image_data_url
            else prompt
        )
        payload = json.dumps({
            "model": model,
            "max_tokens": 600,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user_content}],
            "temperature": 0.2,
        }).encode()
        req = request.Request(
            url,
            data=payload,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=45) as response:
            data = json.loads(response.read().decode())
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")


def provider() -> ModelProvider:
    return ModelProvider()

