"""Optional live web search with a safe offline fallback."""

import os
from typing import Any


def search_web(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    """Use Tavily when configured, then DuckDuckGo, otherwise return no live hits."""
    if os.getenv("WEB_SEARCH_ENABLED", "false").lower() != "true":
        return []
    api_key = os.getenv("TAVILY_API_KEY")
    if api_key:
        try:
            from tavily import TavilyClient

            response = TavilyClient(api_key=api_key).search(query=query, max_results=max_results, timeout=8)
            return [
                {"title": item.get("title", "Web result"), "url": item.get("url", ""), "text": item.get("content", "")}
                for item in response.get("results", [])
            ]
        except Exception:
            pass
    try:
        from ddgs import DDGS

        return [
            {"title": item.get("title", "Web result"), "url": item.get("href", ""), "text": item.get("body", "")}
            for item in DDGS(timeout=8).text(query, max_results=max_results, backend="duckduckgo")
        ]
    except Exception:
        return []

