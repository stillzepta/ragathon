from app.agents.evaluator import evaluate_node
from app.orchestrator.graph import run_due_diligence


def test_due_diligence_applies_review_feedback(tmp_path, monkeypatch):
    checkpoint = tmp_path / "workflow.sqlite3"
    monkeypatch.setenv("CHECKPOINT_DB_PATH", str(checkpoint))
    monkeypatch.setenv("WEB_SEARCH_ENABLED", "false")
    monkeypatch.setenv("MODEL_PROVIDER", "mock")
    state = run_due_diligence("Should we invest in an AI accounting startup?")

    first, revised = state["drafts"]
    assert state["revision_count"] == 1
    assert first["score"] < revised["score"]
    assert "Add a competitor comparison." in first["feedback"]
    assert "## Competitor comparison" not in first["body"]
    assert "## Competitor comparison" in revised["body"]
    assert "## Financial assumptions" in revised["body"]
    assert revised["body"] == state["final_output"]
    assert state["quality_score"] >= 88
    assert checkpoint.exists()

    state["draft_deliverable"] = revised["body"] + "\n> fabricated evidence [1]"
    assert "valid citation IDs" in evaluate_node(state)["critique_feedback"]


def test_mock_and_uploads_keep_external_calls_opt_in(monkeypatch):
    monkeypatch.setenv("MODEL_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "unused")
    monkeypatch.setenv("WEB_SEARCH_ENABLED", "false")
    monkeypatch.setenv("ALLOW_EXTERNAL_UPLOADS", "false")
    state = run_due_diligence(
        "Assess the market for an accounting startup",
        source_text="Accounting startup market evidence from private interviews.",
        persist_checkpoint=False,
    )
    assert state["generation_mode"] == "local"
    assert any("private interviews" in citation["snippet"] for citation in state["citations"])


def test_retriever_ranks_a_matching_upload_over_background_guides():
    from app.rag.retriever import HybridRetriever

    retriever = HybridRetriever()
    retriever.add_text("Invoice automation retention market research", title="Company evidence")
    hits = retriever.search("invoice automation retention market")
    assert hits[0]["title"] == "Company evidence"
    assert hits[0]["score"] == 1
    assert retriever.search("unrelatedword") == []
