from app.rag.retriever import HybridRetriever
from app.state import AgentState
from app.tools.search import search_web


def research_node(state: AgentState, retriever: HybridRetriever) -> AgentState:
    live_results = search_web(state["user_goal"], max_results=5)
    for result in live_results:
        if result.get("text"):
            retriever.add_text(result["text"], result.get("url") or "web://search", result.get("title") or "Web result")
    hits = retriever.search(state["user_goal"] + " competitors market risks financials", top_k=6)
    state["research_data"] = hits
    state["citations"] = [
        {"id": index + 1, "title": hit["title"], "source": hit["source_url"], "snippet": hit["text"]}
        for index, hit in enumerate(hits)
    ]
    state["agent_logs"].append({"agent_name": "researcher", "action": "retrieve", "message": f"Retrieved {len(hits)} grounded chunks."})
    return state

