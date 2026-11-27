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

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the system design and RAG pipeline.

