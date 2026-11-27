from app.orchestrator.graph import run_due_diligence


def test_due_diligence_runs_critic_revision_loop():
    state = run_due_diligence("Should we invest in an AI accounting startup?")

    assert state["revision_count"] == 1
    assert state["quality_score"] >= 88
    assert state["final_output"]
    assert any(log["agent_name"] == "critic" for log in state["agent_logs"])

