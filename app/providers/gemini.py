
"""Model adapter with Gemini-first, Groq and OpenRouter fallback."""

import json
import logging
import os
from collections.abc import Callable
from urllib import request

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

# Production starts (uvicorn --env-file, Vercel, or the process manager) own
# environment loading. Avoid implicitly reading a developer's .env during
# tests or library imports, which can turn a deterministic run into a live run.
if load_dotenv and os.getenv("DIABLO_LOAD_DOTENV", "false").lower() == "true":
    load_dotenv()

logger = logging.getLogger(__name__)


class ModelProvider:
    def __init__(self) -> None:
        self.provider_name = os.getenv("MODEL_PROVIDER", "mock").lower()

        configured_model = os.getenv("MODEL_NAME", "").strip()
        if configured_model in {
            "",
            "gemini-2.5-flash",
            "gemini-2.5-flash-latest",
        }:
            configured_model = "gemini-3.8-flash"

        self.gemini_model = configured_model
        self.groq_model = os.getenv(
            "GROQ_MODEL", "openai/gpt-oss-20b"
        )

        self.gemini_api_key = (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
        )
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_model = os.getenv(
            "OPENROUTER_MODEL", "openrouter/free"
        )

        self.used_provider = None

    @property
    def requested(self) -> bool:
        return self.provider_name in {
            "gemini", "groq", "openrouter"
        }

    @property
    def live(self) -> bool:
        return bool(
            self.gemini_api_key
            or self.groq_api_key
            or self.openrouter_api_key
        )

    def generate(
        self,
        system: str,
        prompt: str,
        *,
        preferred_provider: str | None = None,
        accept: Callable[[str], bool] = bool,
        image_data_url: str | None = None,
    ) -> str:

        self.used_provider = None

        if not self.live:
            logger.error("No model provider API key configured")
            return ""

        first = preferred_provider or self.provider_name
        providers = [first]

        for name, key in [
            ("gemini", self.gemini_api_key),
            ("groq", self.groq_api_key),
            ("openrouter", self.openrouter_api_key),
        ]:
            if key and name not in providers:
                providers.append(name)

        for provider_name in providers:
            try:
                if provider_name == "openrouter":
                    response = self._generate_openrouter(
                        system, prompt,
                        image_data_url=image_data_url
                    )
                elif provider_name == "groq":
                    response = self._generate_groq(system, prompt)
                elif provider_name == "gemini":
                    response = self._generate_gemini(system, prompt)
                else:
                    continue

                if response and accept(response):
                    self.used_provider = provider_name
                    return response

                logger.warning(
                    "Provider %s returned an empty or rejected response",
                    provider_name,
                )

            except Exception:
                logger.exception(
                    "Model provider %s failed",
                    provider_name,
                )

        return ""

    def _generate_gemini(self, system: str, prompt: str) -> str:
        if not self.gemini_api_key:
            return ""

        from google import genai

        with genai.Client(
            api_key=self.gemini_api_key,
            http_options={"timeout": 12000},
        ) as client:
            response = client.models.generate_content(
                model=self.gemini_model,
                contents=prompt,
                config={
                    "system_instruction": system,
                    "max_output_tokens": 600,
                },
            )

        return response.text or ""

    def _generate_openrouter(
        self,
        system: str,
        prompt: str,
        image_data_url: str | None = None,
    ) -> str:
        return self._chat_completion(
            "https://openrouter.ai/api/v1/chat/completions",
            self.openrouter_api_key,
            self.openrouter_model,
            system,
            prompt,
            image_data_url=image_data_url,
        )

    def _generate_groq(self, system: str, prompt: str) -> str:
        return self._chat_completion(
            "https://api.groq.com/openai/v1/chat/completions",
            self.groq_api_key,
            self.groq_model,
            system,
            prompt,
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

        user_content = (
            [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {"url": image_data_url},
                },
            ]
            if image_data_url
            else prompt
        )

        payload = json.dumps({
            "model": model,
            "max_tokens": 600,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.2,
        }).encode()

        req = request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "User-Agent": "diablo-research-workspace/1.0",
            },
            method="POST",
        )

        with request.urlopen(req, timeout=45) as response:
            data = json.loads(response.read().decode())

        return (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )


def provider() -> ModelProvider:
    return ModelProvider()

