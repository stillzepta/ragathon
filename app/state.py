"""LangGraph-compatible shared execution state."""

from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    user_goal: str
    plan: list[str]
    current_step: int
    research_data: list[dict[str, Any]]
    analysis_report: str
    draft_deliverable: str
    critique_feedback: str
    quality_score: int
    revision_count: int
    agent_logs: list[dict[str, Any]]
    final_output: str
    citations: list[dict[str, Any]]
    quality_criteria: list[str]
    drafts: list[dict[str, Any]]
    generation_mode: str
    allow_external_analysis: bool
    run_id: str


def initial_state(goal: str, criteria: list[str], run_id: str) -> AgentState:
    return {
        "user_goal": goal,
        "plan": [],
        "current_step": 0,
        "research_data": [],
        "analysis_report": "",
        "draft_deliverable": "",
        "critique_feedback": "",
        "quality_score": 0,
        "revision_count": 0,
        "agent_logs": [],
        "final_output": "",
        "citations": [],
        "quality_criteria": criteria,
        "drafts": [],
        "generation_mode": "local",
        "run_id": run_id,
    }

