import json
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from reportlab.pdfgen.canvas import Canvas

from app.api.main import MAX_BODY_BYTES, app

TOKEN = "local-test-token-" + "a" * 24


def test_supabase_session_is_verified_by_auth_service(client, monkeypatch):
    import httpx

    monkeypatch.delenv('SUPABASE_JWT_SECRET', raising=False)
    async def valid_session(self, url, **kwargs):
        assert url.endswith('/auth/v1/user')
        assert kwargs['headers']['Authorization'] == 'Bearer header.payload.signature'
        return httpx.Response(200, json={'id': 'verified-user'})
    monkeypatch.setattr(httpx.AsyncClient, 'get', valid_session)
    headers = {'Authorization': 'Bearer header.payload.signature'}
    assert client.get('/api/runs/missing', headers=headers).status_code == 404

    async def invalid_session(self, url, **kwargs):
        return httpx.Response(401, json={'error': 'invalid token'})
    monkeypatch.setattr(httpx.AsyncClient, 'get', invalid_session)
    assert client.get('/api/runs/missing', headers=headers).status_code == 401


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("RAGATHON_PUBLIC", "true")
    monkeypatch.setenv("RAGATHON_API_TOKEN", TOKEN)
    monkeypatch.setenv("RUN_DB_PATH", str(tmp_path / "runs.sqlite3"))
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("WEB_SEARCH_ENABLED", "false")
    with TestClient(app, headers={"Authorization": f"Bearer {TOKEN}"}) as test_client:
        yield test_client


def test_results_events_decision_and_exports(client):
    queued = client.post("/api/runs", data={"prompt": "Assess the accounting startup market"})
    assert queued.status_code == 202
    route = f"/api/runs/{queued.json()['id']}"
    stream = client.get(f"{route}/events")
    assert stream.status_code == 200
    events = [json.loads(line[6:]) for line in stream.text.splitlines() if line.startswith("data: ")]
    assert events[0]["status"] == "queued"
    assert events[-1]["status"] == "completed"
    assert {event.get("stage") for event in events} >= {"planner", "researcher", "analyst", "evaluator", "revision"}
    cursor = next(line[4:] for line in stream.text.splitlines() if line.startswith("id: "))
    resumed = client.get(f"{route}/events", headers={"Last-Event-ID": cursor})
    assert '"status": "queued"' not in resumed.text
    assert '"status": "completed"' in resumed.text
    result = client.get(route).json()["result"]
    first, revised = result["drafts"]
    assert result["criticInitialScore"] == first["score"]
    assert result["criticFinalScore"] == revised["score"]
    assert first["body"] != revised["body"]
    decision = {"mission_id": result["id"], "payload": "Ask for retention data.", "status": "approved"}
    assert client.post("/api/approve", json=decision).json()["action"]["status"] == "approved"
    assert client.post("/api/approve", json=decision).status_code == 200
    assert client.post("/api/approve", json={**decision, "status": "rejected"}).status_code == 409
    assert client.get(route).json()["result"]["proposedAction"]["payloadPreview"] == decision["payload"]
    assert client.get(f"{route}/report/md").text.startswith("# AgentVerse")
    assert client.get(f"{route}/report/pdf").content.startswith(b"%PDF")
    assert client.get("/api/runs/missing/events").status_code == 404


@pytest.mark.parametrize("prompt", [
    "Plan a 3-day trip from Delhi to Jaipur for two people",
    "Research the accounting startup market",
])
def test_guest_runs_are_accessible_only_with_their_run_token(client, prompt):
    form = {"prompt": prompt, "domain": "research"}
    guest = {"Authorization": ""}
    assert client.post("/api/runs", data=form, headers={
        **guest, "Origin": "https://untrusted.example",
    }).status_code == 403
    created = client.post("/api/runs", data=form, headers=guest)
    assert created.status_code == 202
    run = created.json()
    route = f"/api/runs/{run['id']}"
    headers = {"Authorization": f"Bearer {run['access_token']}"}
    assert client.get(route, headers=guest).status_code == 401
    assert client.get("/api/runs/different-run", headers=headers).status_code == 401
    assert '"status": "completed"' in client.get(f"{route}/events", headers=headers).text
    assert client.get(route, headers=headers).json()["status"] == "completed"
    assert client.get(f"{route}/report/md", headers=headers).status_code == 200
    assert client.get(f"{route}/report/md", headers=guest).status_code == 401
    assert client.post("/api/run", data=form, headers=headers).status_code == 401


def test_access_body_and_scope_limits(client):
    assert client.get("/api/runs/missing", headers={"Authorization": ""}).status_code == 401
    assert client.post("/api/runs", content=b"x" * (MAX_BODY_BYTES + 1)).status_code == 413
    assert client.post("/api/runs", data={"prompt": "Assess a company", "domain": "career"}).status_code == 422


def test_upload_formats(client):
    pdf = BytesIO()
    drawing = Canvas(pdf)
    drawing.drawString(40, 700, "Accounting startup market evidence from a PDF.")
    drawing.save()
    for filename, content in (
        ("accounting.pdf", pdf.getvalue()),
        ("accounting.csv", b"market,evidence\naccounting,startup"),
        ("accounting.json", b'{"market": "accounting startup"}'),
    ):
        response = client.post(
            "/api/run", data={"prompt": "Assess the accounting startup market"},
            files={"file": (filename, content)},
        )
        assert response.status_code == 200
        assert any(item["title"] == filename for item in response.json()["citations"])


def test_invalid_attachment_and_origin_have_clear_errors(client):
    bad_file = client.post(
        "/api/run", data={"prompt": "Assess the market"},
        files={"file": ("accounting.json", b"{bad json")},
    )
    assert bad_file.status_code == 422
    assert "JSON could not be read" in bad_file.json()["detail"]
    assert client.post(
        "/api/runs", data={"prompt": "Assess the market"},
        headers={"Origin": "https://untrusted.example"},
    ).status_code == 403


def test_store_keeps_results_and_expires_old_runs(tmp_path, monkeypatch):
    from app.storage.runs import RunStore

    path = str(tmp_path / "runs.sqlite3")
    store = RunStore(path)
    monkeypatch.setattr("app.storage.runs.time.time", lambda: 100)
    store.create("finished")
    store.finish("finished", "completed", {"proposedAction": {"status": "pending"}})
    store.decide("finished", "rejected", None)
    store.create("interrupted")
    reopened = RunStore(path)
    reopened.recover()
    assert reopened.get("finished")["result"]["proposedAction"]["status"] == "rejected"
    assert reopened.get("interrupted")["status"] == "failed"
    monkeypatch.setattr("app.storage.runs.time.time", lambda: 201)
    reopened.prune(100)
    assert reopened.get("finished") is None
    assert not reopened.events("finished", 0)


def test_chat_uses_one_model_with_fallback_and_no_workflow(client, monkeypatch):
    from app.providers.gemini import ModelProvider

    monkeypatch.setenv("MODEL_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    calls = []

    def gemini(self, system, prompt):
        calls.append(("gemini", prompt))
        return " " if prompt == "User: hello" else "RAG retrieves evidence before answering."

    def groq(self, system, prompt):
        calls.append(("groq", prompt))
        return "Hello! How can I help?"

    def unexpected_workflow(*args, **kwargs):
        pytest.fail("Chat should not start the due-diligence workflow")

    monkeypatch.setattr(ModelProvider, "_generate_gemini", gemini)
    monkeypatch.setattr(ModelProvider, "_generate_groq", groq)
    monkeypatch.setattr("app.api.main.run_due_diligence", unexpected_workflow)

    assert client.post("/api/chat", data={"prompt": " hello "}, headers={"Authorization": ""}).json() == {
        "reply": "Hello! How can I help?"
    }
    assert client.post("/api/chat", data={"prompt": "What is RAG?"}).json() == {
        "reply": "RAG retrieves evidence before answering."
    }
    assert calls == [("gemini", "User: hello"), ("groq", "User: hello"), ("gemini", "User: What is RAG?")]


def test_public_chat_validates_origin_and_reports_model_unavailability(client):
    assert client.post(
        "/api/chat", data={"prompt": "hello"}, headers={"Authorization": ""}
    ).status_code == 503
    assert client.post(
        "/api/chat", data={"prompt": "hello"}, headers={"Origin": "https://untrusted.example"}
    ).status_code == 403
    for prompt in (" ", "a" * 4001):
        assert client.post("/api/chat", data={"prompt": prompt}).status_code == 422
    assert client.post("/api/chat", data={"prompt": "hello"}).status_code == 503
