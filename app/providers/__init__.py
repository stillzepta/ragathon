"""Agent lane: model provider adapters."""

import os
from typing import Protocol

from .gemini import GeminiProvider
from .qwen import QwenProvider


class TextProvider(Protocol):
    def generate(self, system: str, prompt: str) -> str: ...


def provider() -> TextProvider:
    """Select the model used by FastAPI without coupling RAG to an LLM."""
    if os.getenv("MODEL_PROVIDER", "mock").lower() == "qwen":
        return QwenProvider()
    return GeminiProvider()

