import re

from app.state import AgentState

EVIDENCE_LINE = re.compile(r'^> (.+) \[(\d+)\]$', re.MULTILINE)


def evaluate_node(state: AgentState) -> AgentState:
    draft = state["draft_deliverable"]
    sources = {item["id"]: item["snippet"] for item in state["citations"]}
    quotes = EVIDENCE_LINE.findall(draft)
    lower = draft.lower()
    checks = [
        (15, "## market and risks" in lower, "Cover market and risks."),
        (15, "## recommendation" in lower, "Add a recommendation."),
        (15, "## unknowns" in lower, "Explain what remains unknown."),
        (20, "## competitor comparison" in lower, "Add a competitor comparison."),
        (20, "## financial assumptions" in lower, "Add financial assumptions."),
        (15, bool(quotes) and all(
            quote in sources.get(int(source), "") for quote, source in quotes
        ), "Quote supporting evidence with valid citation IDs."),
    ]
    score = sum(weight for weight, passed, _ in checks if passed)
    missing = [feedback for _, passed, feedback in checks if not passed]
    state["quality_score"] = score
    state["critique_feedback"] = " ".join(missing) if missing else "All rubric checks passed."
    state["drafts"] = [*state["drafts"], {"body": draft, "score": score, "feedback": state["critique_feedback"]}]
    state["agent_logs"].append({"agent_name": "critic", "action": "evaluate", "message": f"Scored draft {score}/100. {state['critique_feedback']}"})
    return state
