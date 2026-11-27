"""Sequential due-diligence workflow with an optional SQLite checkpointer."""

import os
import sqlite3
import uuid
from collections.abc import Callable
from contextlib import closing
from typing import Any

from app.agents.analyst import analyst_node
from app.agents.evaluator import evaluate_node
from app.agents.planner import plan_node
from app.agents.researcher import research_node
from app.rag.retriever import HybridRetriever
from app.state import AgentState, initial_state


def _revise_node(state: AgentState) -> AgentState:
    state["revision_count"] += 1
    state["agent_logs"].append({"agent_name": "orchestrator", "action": "revise", "message": state["critique_feedback"]})
    return state


def _route(state: AgentState) -> str:
    can_improve = bool(state["citations"]) or state["revision_count"] == 0
    should_revise = state["quality_score"] < 88 and state["revision_count"] < 2
    return "revision" if can_improve and should_revise else "done"


def build_langgraph(nodes: dict[str, Callable], checkpointer: Any) -> Any:
    from langgraph.graph import END, StateGraph

    graph = StateGraph(AgentState)
    for name, node in nodes.items():
        graph.add_node(name, node)
    graph.set_entry_point("planner")
    graph.add_edge("planner", "researcher")
    graph.add_edge("researcher", "analyst")
    graph.add_edge("analyst", "evaluator")
    graph.add_conditional_edges("evaluator", _route, {"revision": "revision", "done": END})
    graph.add_edge("revision", "analyst")
    return graph.compile(checkpointer=checkpointer)


def checkpoint_path() -> str:
    return os.getenv("CHECKPOINT_DB_PATH", "agentverse.sqlite3")


def run_due_diligence(
    goal: str,
    criteria: list[str] | None = None,
    source_text: str | None = None,
    *,
    run_id: str | None = None,
    source_name: str | None = None,
    on_step: Callable[[str, dict], None] | None = None,
    persist_checkpoint: bool = True,
) -> AgentState:
    state = initial_state(goal, criteria or [], run_id or f"run-{uuid.uuid4().hex}")
    state["allow_external_analysis"] = not source_text or os.getenv("ALLOW_EXTERNAL_UPLOADS", "false").lower() == "true"
    retriever = HybridRetriever()
    if source_text:
        retriever.add_text(source_text, title=source_name or "User document")

    def track(name: str, node: Callable) -> Callable:
        def run_node(current: AgentState) -> AgentState:
            if on_step:
                on_step(name, {"action": "started", "message": f"{name.capitalize()} started."})
            result = node(current)
            if on_step:
                on_step(name, result["agent_logs"][-1])
            return result
        return run_node

    nodes = {name: track(name, node) for name, node in {
        "planner": plan_node,
        "researcher": lambda state: research_node(state, retriever),
        "analyst": analyst_node,
        "evaluator": evaluate_node,
        "revision": _revise_node,
    }.items()}

    try:
        from langgraph.checkpoint.sqlite import SqliteSaver
    except ImportError:
        for name in ("planner", "researcher", "analyst", "evaluator"):
            state = nodes[name](state)
        while _route(state) == "revision":
            for name in ("revision", "analyst", "evaluator"):
                state = nodes[name](state)
    else:
        path = checkpoint_path() if persist_checkpoint else ":memory:"
        with closing(sqlite3.connect(path, check_same_thread=False)) as connection:
            workflow = build_langgraph(nodes, SqliteSaver(connection))
            state = workflow.invoke(state, config={"configurable": {"thread_id": state["run_id"]}})
    state["final_output"] = state["draft_deliverable"]
    return state
