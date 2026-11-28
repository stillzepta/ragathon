from app.agents.evaluator import evaluate_node
from app.agents.writer import writer_node
from app.orchestrator.graph import run_due_diligence
from app.providers.gemini import ModelProvider
from app.state import initial_state


GOAL = 'Plan a trip from Goa to Lakshadweep for one person on 12 December 2026 under INR 2,000.'


def test_travel_writer_runs_with_groq_and_preserves_constraints(monkeypatch):
    monkeypatch.setenv('MODEL_PROVIDER', 'groq')
    monkeypatch.setenv('GROQ_API_KEY', 'test-key')
    monkeypatch.setenv('WEB_SEARCH_ENABLED', 'false')
    calls = []

    def generate(self, system, prompt, **kwargs):
        calls.append((system, prompt))
        if system.startswith('You are the senior'):
            self.used_provider = 'groq'
            return ('## Trip plan\nGoa to Lakshadweep on 12 December 2026: the INR 2,000 '
                    'budget is not verified as feasible.\n## How to reach\nFares unknown.\n'
                    '## Stays and food\nCosts unknown.\n## Budget\nPermits and return fares '
                    'must be verified.\n## Unknowns\nTrip duration is missing.')
        return ''

    monkeypatch.setattr(ModelProvider, 'generate', generate)
    result = run_due_diligence(GOAL, persist_checkpoint=False)
    assert 'not verified as feasible' in result['final_output']
    assert result['citations'] == []
    writer_calls = [call for call in calls if call[0].startswith('You are the senior')]
    assert writer_calls
    assert GOAL in writer_calls[0][1]
    assert 'never ask for details already supplied' in writer_calls[0][0]


def test_generic_travel_template_does_not_pass_review(monkeypatch):
    monkeypatch.setenv('MODEL_PROVIDER', 'mock')
    state = initial_state(GOAL, [], 'test-trip')
    state['draft_deliverable'] = ('## Trip plan\nConfirm the destination, travel dates. '
                                  'How to reach, stays and food. [1]')
    state['citations'] = [{'id': 1, 'snippet': 'A travel guide.'}]
    result = evaluate_node(state)
    assert result['quality_score'] < 90
    assert 'budget feasibility' in result['critique_feedback']


def test_private_upload_does_not_reach_travel_writer(monkeypatch):
    monkeypatch.setenv('MODEL_PROVIDER', 'groq')
    monkeypatch.setenv('GROQ_API_KEY', 'test-key')
    state = initial_state(GOAL, [], 'private-trip')
    state['allow_external_analysis'] = False
    state['analysis_report'] = 'Private analysis'
    monkeypatch.setattr(ModelProvider, 'generate', lambda *a, **k: (_ for _ in ()).throw(AssertionError('external call')))
    assert 'not verified as feasible' in writer_node(state)['draft_deliverable']


def test_travel_research_excludes_social_media_prices(monkeypatch):
    monkeypatch.setenv('MODEL_PROVIDER', 'mock')
    monkeypatch.setenv('WEB_SEARCH_ENABLED', 'false')
    monkeypatch.setattr('app.agents.researcher.search_web', lambda *a, **k: [
        {'url': 'https://instagram.com/reel/123', 'title': 'Cheap trip', 'text': 'Lakshadweep trip flight costs 7000'},
        {'url': 'https://lakshadweep.gov.in/tourism/how-to-reach/', 'title': 'Official transport',
         'text': 'Lakshadweep can be reached by ships and flights operated from Kochi.'},
    ])
    state = run_due_diligence(GOAL, persist_checkpoint=False)
    assert state['citations']
    assert all('lakshadweep.gov.in' in item['source'] for item in state['citations'])
    assert '7000' not in state['final_output']
