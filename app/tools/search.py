"""Controlled live web search with SerpAPI, Tavily, and offline fallbacks."""

import os
from typing import Any


def search_web(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    """Use Google results through SerpAPI when configured, then other providers."""
    if os.getenv("WEB_SEARCH_ENABLED", "false").lower() != "true":
        return []
    serpapi_key = os.getenv("SERPAPI_API_KEY", "").strip()
    if serpapi_key:
        try:
            import httpx

            response = httpx.get(
                "https://serpapi.com/search.json",
                params={
                    "engine": "google",
                    "q": query,
                    "api_key": serpapi_key,
                    "num": max(1, min(max_results, 10)),
                    "hl": "en",
                },
                timeout=12,
            )
            response.raise_for_status()
            payload = response.json()
            return [
                {
                    "title": item.get("title", "Google result"),
                    "url": item.get("link", ""),
                    "text": item.get("snippet", ""),
                    "date": item.get("date"),
                    "source": "serpapi-google",
                }
                for item in payload.get("organic_results", [])
                if item.get("link") and item.get("snippet")
            ][:max_results]
        except Exception:
            pass
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

