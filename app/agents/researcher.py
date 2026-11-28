from app.rag.retriever import HybridRetriever
from app.state import AgentState
from app.tools.search import search_web
from urllib.parse import urlparse


def research_node(state: AgentState, retriever: HybridRetriever) -> AgentState:
    tasks = [task for task in state.get("plan", []) if task.get("owner") == "researcher"]
    for task in tasks:
        state["task_statuses"][task["id"]] = "running"
    queries = [task["instruction"] for task in tasks] or [state["user_goal"]]
    travel = any(task.get("id") == "research_trip_options" for task in tasks)
    if travel:
        queries = [state["user_goal"] + " official tourism transport entry permit"]
        if "lakshadweep" in state["user_goal"].lower():
            queries = ["Lakshadweep how to reach Agatti Kochi ships entry permit site:lakshadweep.gov.in"]
    for query in queries:
        for result in search_web(query, max_results=5 if travel else 3):
            host = (urlparse(result.get("url", "")).hostname or "").lower()
            if travel and not (host.endswith(".gov.in") or host.endswith(".gov") or host.endswith(".nic.in")):
                continue
            if result.get("text"):
                retriever.add_text(result["text"], result.get("url") or "web://search", result.get("title") or "Web result")
    ranked: dict[str, dict] = {}
    for query in queries:
        for hit in retriever.search(query, top_k=4):
            ranked[hit["chunk_id"]] = hit
    hits = sorted(ranked.values(), key=lambda hit: hit.get("score", 0), reverse=True)[:8]
    state["research_data"] = hits
    state["citations"] = [
        {"id": index + 1, "title": hit["title"], "source": hit["source_url"], "snippet": hit["text"], "chunkId": hit["chunk_id"], "locator": hit["locator"]}
        for index, hit in enumerate(hits)
    ]
    for task in tasks:
        state["task_statuses"][task["id"]] = "completed" if hits else "blocked"
    state["agent_logs"].append({"agent_name": "researcher", "action": "retrieve", "message": f"Executed {len(queries)} focused research quer(y/ies) and retrieved {len(hits)} deduplicated evidence chunks."})
    return state

