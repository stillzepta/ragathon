"""Hybrid local retrieval. Swap this implementation for a vector DB without changing agents."""

import re
import math
from typing import Any, Optional

from .embeddings import OpenRouterEmbeddings
from .ingest import chunk_document, seed_chunks


class HybridRetriever:
    def __init__(self, chunks: Optional[list[dict[str, Any]]] = None) -> None:
        self.chunks: list[dict[str, Any]] = []
        self._chunk_ids: set[str] = set()
        self._embeddings: dict[str, list[float]] = {}
        self._embedding_provider = OpenRouterEmbeddings()
        for chunk in seed_chunks() if chunks is None else chunks:
            self._add_chunk(chunk)

    def add_text(self, text: str, source_url: str = "upload://user-document", title: str = "User document") -> None:
        for chunk in chunk_document({"text": text, "url": source_url, "title": title}):
            self._add_chunk(chunk)

    def _add_chunk(self, chunk: dict[str, Any]) -> None:
        if chunk["chunk_id"] not in self._chunk_ids:
            self._chunk_ids.add(chunk["chunk_id"])
            self.chunks.append(chunk)

    @staticmethod
    def _cosine(left: list[float], right: list[float]) -> float:
        if not left or not right or len(left) != len(right):
            return 0.0
        numerator = sum(a * b for a, b in zip(left, right))
        denominator = math.sqrt(sum(a * a for a in left)) * math.sqrt(sum(b * b for b in right))
        return numerator / denominator if denominator else 0.0

    def search(self, query: str, top_k: int = 6) -> list[dict[str, Any]]:
        query_tokens = set(re.findall(r"[a-z0-9]+", query.lower()))
        if not query_tokens:
            return []
        ranked = []
        query_embedding: list[float] = []
        if self._embedding_provider.enabled:
            try:
                query_embedding = self._embedding_provider.embed([query])[0]
                missing = [chunk for chunk in self.chunks if chunk["chunk_id"] not in self._embeddings]
                if missing:
                    vectors = self._embedding_provider.embed([chunk["text"] for chunk in missing])
                    self._embeddings.update({chunk["chunk_id"]: vector for chunk, vector in zip(missing, vectors)})
            except Exception:
                query_embedding = []
        for chunk in self.chunks:
            tokens = re.findall(r"[a-z0-9]+", chunk["text"].lower())
            overlap = len(query_tokens.intersection(tokens))
            # Transparent lexical baseline: exact phrase matches receive a small boost.
            phrase_boost = 0.15 if query.lower().strip() in chunk["text"].lower() else 0
            score = min(1.0, overlap / len(query_tokens) + phrase_boost) if overlap else 0.0
            semantic = self._cosine(query_embedding, self._embeddings.get(chunk["chunk_id"], []))
            combined = (0.65 * score + 0.35 * semantic) if query_embedding else score
            if score or semantic:
                result = dict(chunk, lexical_score=round(score, 3))
                if query_embedding:
                    result["semantic_score"] = round(semantic, 3)
                ranked.append((combined, result))
        ranked.sort(key=lambda item: item[0], reverse=True)
        return [dict(chunk, score=round(score, 3)) for score, chunk in ranked[:top_k]]


def default_retriever() -> HybridRetriever:
    return HybridRetriever()

