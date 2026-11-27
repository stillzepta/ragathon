from app.state import AgentState


def plan_node(state: AgentState) -> AgentState:
    state["plan"] = [
        "Define the company, customer, and investment question",
        "Research competitors, market sizing, and evidence",
        "Analyze differentiation, risks, unit economics, and assumptions",
        "Write an investment memo with citations and recommendation",
    ]
    state["agent_logs"].append({"agent_name": "orchestrator", "action": "plan", "message": "Created due-diligence task graph."})
    return state

