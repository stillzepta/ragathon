# Team Access and Parallel Work Rules

This repository is split into five ownership lanes so five contributors can work simultaneously with minimal merge conflicts.

## Ownership matrix

| Person | Primary lane | Allowed to change directly | Coordinate before changing |
|---|---|---|---|
| Person 1 | Platform | `app/orchestrator/`, `app/storage/`, platform tests | `app/models.py`, database schema |
| Person 2 | RAG | `app/rag/`, RAG fixtures and tests | `app/models.py`, retrieval interfaces |
| Person 3 | Agents | `app/agents/`, `app/providers/` | `app/models.py`, tool contracts |
| Person 4 | Product | `app/api/`, `app/ui/` | API schemas, event payloads |
| Person 5 | Quality | `app/evaluation/`, `tests/`, `.github/`, docs | Any production module when fixing a failing contract |

Replace `Person 1`–`Person 5` with GitHub usernames in `.github/CODEOWNERS` before the first formal review.

## Shared files

These files are intentionally shared and require a short team decision before modification:

- `app/models.py` — Pydantic contracts and event schemas.
- `pyproject.toml` — dependencies and tooling.
- `ARCHITECTURE.md` — system-level decisions.
- `README.md` — user-facing setup and demo path.

When changing a shared contract, update its tests and notify the owners of all consuming lanes in the pull request.

## Branch and pull request policy

- Create one branch per lane/task: `feat/platform-state-machine`, `feat/rag-retrieval`, etc.
- Keep a pull request focused on one lane.
- Do not commit directly to `main`.
- Rebase or merge `main` before requesting review.
- Every pull request must include tests or explain why tests are not applicable.
- Prefer additive changes to shared contracts; avoid drive-by formatting.

## Integration points

The lanes communicate through stable interfaces:

1. `app/models.py`: typed task, message, retrieval, artifact, and evaluation contracts.
2. `app/tools/`: tool gateway and tool schemas.
3. `app/storage/`: repository interface, not database-specific calls from agents.
4. `tests/contracts/`: cross-lane contract tests.

If an interface is incomplete, add a typed stub and a contract test rather than importing another lane's internals.

