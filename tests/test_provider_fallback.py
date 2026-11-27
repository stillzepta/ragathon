from app.providers.gemini import ModelProvider


def test_gemini_failure_falls_back_to_groq(monkeypatch):
    monkeypatch.setenv("MODEL_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "gemini-key")
    monkeypatch.setenv("GROQ_API_KEY", "groq-key")
    model = ModelProvider()
    calls = []

    monkeypatch.setattr(model, "_generate_gemini", lambda system, prompt: calls.append("gemini") or "")
    monkeypatch.setattr(model, "_generate_groq", lambda system, prompt: calls.append("groq") or "Groq answer")

    assert model.generate("system", "prompt") == "Groq answer"
    assert calls == ["gemini", "groq"]
