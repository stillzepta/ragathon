from app.tools.search import search_web


def test_serpapi_google_results_are_normalized(monkeypatch):
    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {"organic_results": [{"title": "Primary source", "link": "https://example.com", "snippet": "Evidence"}]}

    monkeypatch.setenv("WEB_SEARCH_ENABLED", "true")
    monkeypatch.setenv("SERPAPI_API_KEY", "test-key")
    monkeypatch.setattr("httpx.get", lambda *args, **kwargs: Response())
    assert search_web("test query", max_results=1) == [{
        "title": "Primary source",
        "url": "https://example.com",
        "text": "Evidence",
        "date": None,
        "source": "serpapi-google",
    }]
