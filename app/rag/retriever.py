"""Hybrid local retrieval. Swap this implementation for a vector DB without changing agents."""

import re
from typing import Any, Optional

from .ingest import chunk_document, seed_chunks


class HybridRetriever:
    def __init__(self, chunks: Optional[list[dict[str, Any]]] = None) -> None:
        self.chunks = chunks or seed_chunks()

    def add_text(self, text: str, source_url: str = "upload://user-document", title: str = "User document") -> None:
        self.chunks.extend(chunk_document({"text": text, "url": source_url, "title": title}))

    def search(self, query: str, top_k: int = 6) -> list[dict[str, Any]]:
        query_tokens = set(re.findall(r"[a-z0-9]+", query.lower()))
        ranked = []
        for chunk in self.chunks:
            tokens = re.findall(r"[a-z0-9]+", chunk["text"].lower())
            overlap = len(query_tokens.intersection(tokens))
            if overlap:
                ranked.append((overlap / max(len(query_tokens), 1), chunk))
        ranked.sort(key=lambda item: item[0], reverse=True)
        return [dict(chunk, score=round(score, 3)) for score, chunk in ranked[:top_k]]


def default_retriever() -> HybridRetriever:
    return HybridRetriever()

