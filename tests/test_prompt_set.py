import json
from pathlib import Path

import pytest

from app.orchestrator.graph import run_due_diligence


PROMPTS = json.loads((Path(__file__).parent / "prompt_set.json").read_text())


@pytest.mark.parametrize("case", PROMPTS, ids=[case["name"] for case in PROMPTS])
def test_prompt_set_completes_grounded_revision_loop(case):
    state = run_due_diligence(case["prompt"], source_text=case["evidence"])

    assert state["plan"]
    assert state["research_data"]
    assert state["citations"]
    assert state["final_output"].strip()
    assert state["revision_count"] == 1
    assert state["quality_score"] >= 88
    assert any(log["agent_name"] == "critic" for log in state["agent_logs"])
