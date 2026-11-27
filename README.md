# RAGathon Multi-Agent Workspace

A parallel-friendly hackathon project for a multi-agent, RAG-grounded workflow engine.

The system decomposes a user goal, retrieves evidence, delegates work to specialist agents, stores shared state, and evaluates/revises the final artifact.

## Team lanes

| Lane | Directory | Owns |
|---|---|---|
| Platform | `app/orchestrator/`, `app/storage/` | State machine, task queue, persistence, event log |
| RAG | `app/rag/` | Ingestion, chunking, embeddings, retrieval, reranking |
| Agents | `app/agents/`, `app/providers/` | Prompts, agent runners, model adapter |
| Product | `app/api/`, `app/ui/` | API, run controls, timeline and evidence UI |
| Quality | `app/evaluation/`, `tests/`, `.github/` | Critic loop, tests, CI, release/demo readiness |

See [TEAM_ACCESS.md](TEAM_ACCESS.md) for writable boundaries and coordination rules.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
pytest
```

Run the API and point the existing Vite dashboard at it:

```bash
uvicorn app.api.main:app --reload --port 8000
VITE_API_URL=http://localhost:8000 npm run dev
```

`MODEL_PROVIDER=mock` runs offline with the local RAG corpus. Set `GEMINI_API_KEY` and `MODEL_PROVIDER=gemini` to enable Gemini generation. Set `TAVILY_API_KEY` to enable live web research; without credentials the search tool safely falls back to the seeded corpus. The workflow preserves structured state, citations, and the critic loop.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the system design and RAG pipeline.

## Implementation status

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for completed steps and remaining work.

## Existing frontend

The current demo frontend lives in `src/` and is built with Vite. The backend and RAG lanes are scaffolded under `app/`; see [TEAM_ACCESS.md](TEAM_ACCESS.md) before changing shared contracts.
