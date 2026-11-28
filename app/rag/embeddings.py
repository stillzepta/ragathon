"""Optional OpenRouter embedding adapter; retrieval remains local when unset."""

import json
import os
from urllib import request


class OpenRouterEmbeddings:
    def __init__(self) -> None:
        self.api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        self.model = os.getenv("EMBEDDING_MODEL", "openai/text-embedding-3-small")

    @property
    def enabled(self) -> bool:
        return os.getenv("EMBEDDING_PROVIDER", "local").lower() == "openrouter" and bool(self.api_key)

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not self.enabled or not texts:
            return []
        body = json.dumps({"model": self.model, "input": texts}).encode()
        req = request.Request(
            "https://openrouter.ai/api/v1/embeddings",
            data=body,
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        with request.urlopen(req, timeout=20) as response:
            payload = json.loads(response.read().decode())
        return [item["embedding"] for item in sorted(payload.get("data", []), key=lambda item: item.get("index", 0))]
