"""Shared typed contracts. All lanes coordinate through these models."""

from typing import Literal

from pydantic import BaseModel, Field


class RetrievedChunk(BaseModel):
    chunk_id: str
    document_id: str
    text: str
    source_url: str
    locator: str | None = None
    score: float = Field(ge=0, le=1)


class ClaimSupport(BaseModel):
    claim: str
    supported_by: list[str] = Field(default_factory=list)
    support_type: Literal["direct", "inference", "unsupported"]


class RetrievalContext(BaseModel):
    query: str
    retrieved_chunks: list[RetrievedChunk] = Field(default_factory=list)
    claims: list[ClaimSupport] = Field(default_factory=list)

