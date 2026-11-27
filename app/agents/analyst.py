from app.state import AgentState


def analyst_node(state: AgentState) -> AgentState:
    evidence = "\n".join(f"- {item['text']} [{item['source_url']}]" for item in state["research_data"])
    state["analysis_report"] = (
        f"## Executive view\n\nThe opportunity should be treated as **promising but unproven**. "
        f"The available evidence supports a structured diligence process for: {state['user_goal']}\n\n"
        "## Market and competition\n\nAssess TAM/SAM/SOM bottom-up, direct alternatives, switching costs, and distribution access.\n\n"
        "## Risks and financial questions\n\nValidate retention, acquisition cost, gross margin, burn, runway, regulatory exposure, and platform dependencies.\n\n"
        "## Recommendation\n\nProceed to a focused validation round with explicit evidence requests before investing."
    )
    state["draft_deliverable"] = state["analysis_report"]
    state["agent_logs"].append({"agent_name": "analyst", "action": "synthesize", "message": "Produced investment memo draft."})
    return state
