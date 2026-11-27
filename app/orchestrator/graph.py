"""Stateful due-diligence workflow with a LangGraph-compatible shape."""

import uuid
import os
import sqlite3
from typing import Any, Optional

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


def build_langgraph(retriever: HybridRetriever) -> Any:
    """Compile the cyclic workflow with a SQLite checkpoint saver."""
    try:
        from langgraph.graph import END, StateGraph
        from langgraph.checkpoint.sqlite import SqliteSaver

        connection = sqlite3.connect(
            os.getenv("CHECKPOINT_DB_PATH", "agentverse.sqlite3"),
            check_same_thread=False,
        )

        graph = StateGraph(AgentState)
        graph.add_node("planner", plan_node)
        graph.add_node("researcher", lambda state: research_node(state, retriever))
        graph.add_node("analyst", analyst_node)
        graph.add_node("evaluator", evaluate_node)
        graph.add_node("revision", _revise_node)
        graph.set_entry_point("planner")
        graph.add_edge("planner", "researcher")
        graph.add_edge("researcher", "analyst")
        graph.add_edge("analyst", "evaluator")
        graph.add_conditional_edges(
            "evaluator",
            lambda state: "revision" if state["quality_score"] < 88 and state["revision_count"] < 2 else "done",
            {"revision": "revision", "done": END},
        )
        graph.add_edge("revision", "analyst")
        return graph.compile(checkpointer=SqliteSaver(connection))
    except (ImportError, ModuleNotFoundError):
        return None


def run_due_diligence(goal: str, criteria: Optional[list[str]] = None, source_text: Optional[str] = None) -> AgentState:
    state = initial_state(goal, criteria or [], f"run-{uuid.uuid4().hex[:10]}")
    retriever = HybridRetriever()
    if source_text:
        retriever.add_text(source_text)
    workflow = build_langgraph(retriever)
    if workflow:
        state = workflow.invoke(state, config={"configurable": {"thread_id": state["run_id"]}})
    else:
        state = plan_node(state)
        state = research_node(state, retriever)
        state = analyst_node(state)
        state = evaluate_node(state)
        while state["quality_score"] < 88 and state["revision_count"] < 2:
            state = _revise_node(state)
            state = analyst_node(state)
            state = evaluate_node(state)
    state["final_output"] = state["draft_deliverable"]
    return state

