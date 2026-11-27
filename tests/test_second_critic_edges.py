import pytest

from app.agents.evaluator import evaluate_node
from app.orchestrator.graph import run_due_diligence
from app.providers.gemini import ModelProvider
from app.state import initial_state

APPROVED = '{"verdict":"approve","reason":"The claims are supported."}'
REVISE = '{"verdict":"revise","reason":"Ask for independent retention evidence."}'
HEADINGS = """## Market and risks
## Recommendation
## Unknowns
## Competitor comparison
## Financial assumptions
"""


@pytest.fixture
def review_state(monkeypatch):
    monkeypatch.setenv("MODEL_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini")
    monkeypatch.setenv("GROQ_API_KEY", "test-groq")
    state = initial_state("Assess the accounting startup market.", [], "test-run")
    state["draft_deliverable"] = HEADINGS + "> Retention is unknown. [1]"
    state["citations"] = [{"id": 1, "snippet": "Retention is unknown."}]
    return state


@pytest.mark.parametrize("primary_reply", [
    "", " ", "not JSON", "[]", '{"verdict":"reject","reason":"Unsupported"}',
    '{"verdict":"approve"}', '{"verdict":"approve","reason":" "}',
    '{"verdict":"approve","reason":123}', TimeoutError("Provider timed out"),
])
def test_invalid_or_failed_review_uses_backup(review_state, monkeypatch, primary_reply):
    calls = []

    def groq(self, system, prompt):
        calls.append("groq")
        if isinstance(primary_reply, Exception):
            raise primary_reply
        return primary_reply

    def gemini(self, system, prompt):
        calls.append("gemini")
        return APPROVED

    monkeypatch.setattr(ModelProvider, "_generate_groq", groq)
    monkeypatch.setattr(ModelProvider, "_generate_gemini", gemini)
    result = evaluate_node(review_state)
    assert result["second_review_verdict"] == "approve"
    assert calls == ["groq", "gemini"]


@pytest.mark.parametrize("case", ["mock", "no_keys", "private_attachment", "bad_citation", "below_90"])
def test_review_bypasses_external_providers(review_state, monkeypatch, case):
    if case == "mock":
        monkeypatch.setenv("MODEL_PROVIDER", "mock")
    elif case == "no_keys":
        for key in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY"):
            monkeypatch.delenv(key, raising=False)
    elif case == "private_attachment":
        review_state["allow_external_analysis"] = False
    elif case == "bad_citation":
        review_state["draft_deliverable"] += "\n> Fabricated evidence. [1]"
    else:
        review_state["draft_deliverable"] = HEADINGS

    def unexpected_call(*args, **kwargs):
        pytest.fail("This draft should never reach a model provider")

    monkeypatch.setattr(ModelProvider, "_generate_groq", unexpected_call)
    monkeypatch.setattr(ModelProvider, "_generate_gemini", unexpected_call)

    result = evaluate_node(review_state)
    if case in {"bad_citation", "below_90"}:
        assert result["quality_score"] == 85
        assert result["second_review_verdict"] == "skipped"
    else:
        assert result["quality_score"] == 100
        assert result["second_review_verdict"] == "unavailable"


def test_both_providers_unusable(review_state, monkeypatch):
    monkeypatch.setattr(ModelProvider, "_generate_groq", lambda *args: "")
    monkeypatch.setattr(ModelProvider, "_generate_gemini", lambda *args: "not a verdict")
    result = evaluate_node(review_state)
    assert result["second_review_verdict"] == "unavailable"
    assert "Second review unavailable." in result["drafts"][-1]["feedback"]


def test_critic_prefers_other_provider_when_groq_generated_the_draft(review_state, monkeypatch):
    review_state["generation_mode"] = "groq"

    def unexpected_call(*args):
        pytest.fail("Gemini review succeeded, so Groq should not be called")

    monkeypatch.setattr(ModelProvider, "_generate_groq", unexpected_call)
    monkeypatch.setattr(ModelProvider, "_generate_gemini", lambda *args: APPROVED)
    assert evaluate_node(review_state)["second_review_verdict"] == "approve"


def test_repeated_rejection_stops_at_revision_limit(review_state, monkeypatch):
    monkeypatch.setenv("WEB_SEARCH_ENABLED", "false")
    monkeypatch.setattr(ModelProvider, "_generate_gemini", lambda *args: "How is retention measured?")
    monkeypatch.setattr(ModelProvider, "_generate_groq", lambda *args: REVISE)
    state = run_due_diligence("Should we invest in an AI accounting startup?", persist_checkpoint=False)
    assert state["revision_count"] == 2
    assert len(state["drafts"]) == 3
    assert state["second_review_verdict"] == "revise"
    assert "Draft remains unapproved." in state["drafts"][-1]["feedback"]
