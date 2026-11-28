"""Shared typed contracts. All lanes coordinate through these models."""

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class PlanTask(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_]{2,63}$")
    owner: Literal["researcher", "analyst", "writer", "evaluator"]
    instruction: str = Field(min_length=1)
    depends_on: list[str] = Field(default_factory=list)
    success_criteria: list[str] = Field(min_length=1)


class TaskPlan(BaseModel):
    tasks: list[PlanTask] = Field(min_length=1, max_length=12)


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


class DueDiligenceRequest(BaseModel):
    prompt: str
    domain: str = "bizintel"
    quality_criteria: List[str] = Field(
        default_factory=lambda: [
            "Use verifiable evidence and cite sources",
            "Cover competitors, market, risks, and financial assumptions",
            "Make uncertainty and recommended next steps explicit",
        ]
    )


class EvaluationResult(BaseModel):
    score: int = Field(ge=1, le=100)
    passed: bool
    feedback: str
    criteria: dict[str, int] = Field(default_factory=dict)

