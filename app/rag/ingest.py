"""Small local corpus plus an extension point for PDF/URL ingestion."""

import hashlib
import re
from typing import Any

SEED_DOCUMENTS = [
    {"title": "Startup Due Diligence Playbook", "url": "https://example.org/agentverse/due-diligence-playbook", "text": "A diligence memo should separate observed facts, model assumptions, and open questions. Review market size, competitors, distribution, retention, unit economics, cash needs, and execution risks."},
    {"title": "Market Sizing Notes", "url": "https://example.org/agentverse/market-sizing", "text": "TAM is the broad revenue opportunity, SAM is the reachable segment, and SOM is the realistically capturable share. A bottom-up estimate should show customers, price, adoption, and a time horizon."},
    {"title": "Investment Risk Checklist", "url": "https://example.org/agentverse/risk-checklist", "text": "Key risks include weak differentiation, concentrated acquisition channels, regulatory exposure, high burn, unproven retention, dependency on a platform, and claims that lack primary evidence. Each risk should have an impact, likelihood, and mitigation."},
]


def chunk_document(document: dict[str, Any], size: int = 500) -> list[dict[str, Any]]:
    words = re.findall(r"\S+", document["text"])
    chunks = []
    for index in range(0, len(words), size):
        text = " ".join(words[index : index + size])
        digest = hashlib.sha1(f"{document['url']}:{index}:{text}".encode()).hexdigest()[:12]
        chunks.append({
            "chunk_id": f"chunk-{digest}",
            "document_id": hashlib.sha1(document["url"].encode()).hexdigest()[:12],
            "text": text,
            "source_url": document["url"],
            "title": document["title"],
            "locator": f"chunk {index // size + 1}",
        })
    return chunks


def seed_chunks() -> list[dict[str, Any]]:
    return [chunk for document in SEED_DOCUMENTS for chunk in chunk_document(document)]

