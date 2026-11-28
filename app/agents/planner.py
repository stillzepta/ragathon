from app.models import TaskPlan
from app.state import AgentState


ALLOWED_OWNERS = {"researcher", "analyst", "writer", "evaluator"}


def validate_plan(plan: TaskPlan) -> None:
    ids = [task.id for task in plan.tasks]
    if len(ids) != len(set(ids)):
        raise ValueError("Task IDs must be unique.")
    known = set(ids)
    for task in plan.tasks:
        if task.owner not in ALLOWED_OWNERS or any(dep not in known for dep in task.depends_on):
            raise ValueError(f"Invalid owner or dependency for task '{task.id}'.")
    visiting: set[str] = set()
    visited: set[str] = set()
    dependencies = {task.id: task.depends_on for task in plan.tasks}
    def visit(task_id: str) -> None:
        if task_id in visiting:
            raise ValueError("Task dependencies contain a cycle.")
        if task_id in visited:
            return
        visiting.add(task_id)
        for dep in dependencies[task_id]:
            visit(dep)
        visiting.remove(task_id)
        visited.add(task_id)
    for task_id in ids:
        visit(task_id)


def plan_node(state: AgentState) -> AgentState:
    goal = state["user_goal"].lower()
    travel = any(term in goal for term in ("trip", "travel", "itinerary", "vacation", "holiday", "journey"))
    if travel:
        tasks = [
            {"id": "clarify_trip", "owner": "analyst", "instruction": "Identify missing destination, dates, duration, budget, travelers, transport preference, and interests; state what must be confirmed before booking.", "success_criteria": ["Missing trip constraints identified", "No unsupported booking claims"]},
            {"id": "research_trip_options", "owner": "researcher", "instruction": f"Research transport, neighborhoods and stays, food options, and attractions relevant to: {state['user_goal']}", "success_criteria": ["Useful travel sources", "Practical options with citations"]},
            {"id": "write_itinerary", "owner": "writer", "instruction": "Write a concise itinerary with how to reach, where to stay, what to eat, and day-by-day activities; ask focused clarifying questions when inputs are missing.", "depends_on": ["clarify_trip", "research_trip_options"], "success_criteria": ["Directly answers the travel request", "Separates estimates from confirmed details"]},
            {"id": "check_trip_report", "owner": "evaluator", "instruction": "Check that the itinerary answers the user's actual trip, flags missing dates/budget, and does not invent live prices or availability.", "depends_on": ["write_itinerary"], "success_criteria": ["Relevant critique", "Safe recommendation"]},
        ]
    else:
        tasks = [
            {"id": "research_sources", "owner": "researcher", "instruction": f"Find focused, primary evidence for: {state['user_goal']}", "success_criteria": ["Relevant sources", "Source excerpts"]},
            {"id": "compare_evidence", "owner": "analyst", "instruction": "Compare claims, identify agreement and conflict, and separate facts from inference.", "depends_on": ["research_sources"], "success_criteria": ["Evidence synthesis", "Uncertainties identified"]},
            {"id": "write_report", "owner": "writer", "instruction": "Write a direct answer or report grounded in the research and analysis.", "depends_on": ["compare_evidence"], "success_criteria": ["Answers the request", "Citations attached"]},
            {"id": "critique_report", "owner": "evaluator", "instruction": "Check evidence coverage, citation validity, contradictions, and unsupported claims.", "depends_on": ["write_report"], "success_criteria": ["Actionable critique", "Verdict"]},
        ]
    plan = TaskPlan(tasks=tasks)
    validate_plan(plan)
    state["plan"] = [task.model_dump() for task in plan.tasks]
    state["task_statuses"] = {task.id: "queued" for task in plan.tasks}
    state["agent_logs"].append({"agent_name": "orchestrator", "action": "plan", "message": f"Decomposed the request into {len(plan.tasks)} assigned tasks."})
    return state

