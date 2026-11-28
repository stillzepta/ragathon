"""Small local corpus plus an extension point for PDF/URL ingestion."""

import hashlib
import re
from typing import Any

SBA_GUIDE = "https://www.sba.gov/counseling/plan-your-business/"
SEED_DOCUMENTS = [
    {
        "title": "SBA market research and competitive analysis (summary)",
        "url": SBA_GUIDE,
        "text": "The SBA suggests evaluating demand, market size, available alternatives, and customer pricing. Interviewing potential customers can help test assumptions about demand and competition.",
    },
    {
        "title": "SBA business planning guide (summary)",
        "url": SBA_GUIDE,
        "text": "The SBA business plan guide recommends describing the target market, competitive advantages, and financial projections such as income, cash flow, and capital expenditure.",
    },
    {
        "title": "SBA startup costs guide (summary)",
        "url": SBA_GUIDE,
        "text": "The SBA recommends separating one-time startup costs from recurring monthly expenses before estimating how much capital the business needs.",
    },
]


def chunk_document(document: dict[str, Any], size: int = 200) -> list[dict[str, Any]]:
    normalized = re.sub(r"\s+", " ", str(document["text"])).strip()
    words = re.findall(r"\S{1,200}", normalized)
    chunks = []
    for index in range(0, len(words), size):
        text = " ".join(words[index : index + size])
        digest = hashlib.sha1(f"{document['url']}:{document['title']}:{index}:{text}".encode()).hexdigest()[:12]
        chunks.append({
            "chunk_id": f"chunk-{digest}",
            "document_id": hashlib.sha1(f"{document['url']}:{document['title']}".encode()).hexdigest()[:12],
            "text": text,
            "source_url": document["url"],
            "title": document["title"],
            "locator": f"chunk {index // size + 1}",
        })
    return chunks


def seed_chunks() -> list[dict[str, Any]]:
    unique: dict[str, dict[str, Any]] = {}
    for document in SEED_DOCUMENTS:
        for chunk in chunk_document(document):
            unique[chunk["chunk_id"]] = chunk
    return list(unique.values())

