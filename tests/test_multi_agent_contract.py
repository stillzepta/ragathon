from app.orchestrator.graph import run_due_diligence


def test_run_exposes_owned_tasks_and_terminal_statuses(monkeypatch):
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("WEB_SEARCH_ENABLED", "false")
    state = run_due_diligence(
        "Compare three alternatives to Notion for a small engineering team.",
        source_text="A team needs collaborative docs, permissions, search, and version history.",
        persist_checkpoint=False,
    )

    assert [task["owner"] for task in state["plan"]] == ["researcher", "analyst", "writer", "evaluator"]
    assert all(status in {"completed", "blocked"} for status in state["task_statuses"].values())
    assert {log["agent_name"] for log in state["agent_logs"]} >= {"orchestrator", "researcher", "analyst", "writer", "critic"}


def test_research_task_is_request_specific(monkeypatch):
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    monkeypatch.setenv("WEB_SEARCH_ENABLED", "false")
    first = run_due_diligence("Compare note-taking tools for engineers", persist_checkpoint=False)
    second = run_due_diligence("Explain solid-state battery challenges", persist_checkpoint=False)
    assert first["plan"][0]["instruction"] != second["plan"][0]["instruction"]
