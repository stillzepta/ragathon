"""Writer agent: turns the analyst's structured synthesis into the user-facing draft."""

from app.state import AgentState


def writer_node(state: AgentState) -> AgentState:
    tasks = [task for task in state.get("plan", []) if task.get("owner") == "writer"]
    for task in tasks:
        state["task_statuses"][task["id"]] = "running"
    draft = state.get("analysis_report", "").strip()
    if not draft:
        draft = "## Direct answer\n\nNo supported answer was produced from the available evidence."
    state["draft_deliverable"] = draft
    for task in tasks:
        state["task_statuses"][task["id"]] = "completed"
    state["agent_logs"].append({"agent_name": "writer", "action": "draft", "message": f"Executed {len(tasks)} writer task(s) and prepared the user-facing draft."})
    return state
