"""Shared typed contracts. All lanes coordinate through these models."""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: str
    text: str
    source_url: str
    locator: Optional[str] = None
    score: float = Field(ge=0, le=1)


class ClaimSupport(BaseModel):
    claim: str
    supported_by: List[str] = Field(default_factory=list)
    support_type: Literal["direct", "inference", "unsupported"]


class RetrievalContext(BaseModel):
    query: str
    retrieved_chunks: List[RetrievedChunk] = Field(default_factory=list)
    claims: List[ClaimSupport] = Field(default_factory=list)

