"""Qwen inference adapter used by the FastAPI backend.

The model runs on a separate Ubuntu server (for example through Ollama).
RAG remains responsible for retrieval; this adapter only handles generation.
"""

import os
from typing import Any

import httpx


class QwenProvider:
    def __init__(self) -> None:
        self.url = os.getenv("QWEN_SERVER_URL", "http://localhost:8001/generate").rstrip("/")
        self.token = os.getenv("QWEN_SERVER_TOKEN", "")
        self.model = os.getenv("QWEN_MODEL", "qwen3:1.7b")
        self.timeout = float(os.getenv("QWEN_TIMEOUT_SECONDS", "180"))

    def generate(self, system: str, prompt: str) -> str:
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        }
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
        except (httpx.HTTPError, ValueError):
            return ""

        return str(data.get("answer") or data.get("response") or data.get("message", {}).get("content") or "")

