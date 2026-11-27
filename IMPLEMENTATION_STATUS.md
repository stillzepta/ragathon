# AgentVerse implementation status

## Working in the connected workspace

- One startup due-diligence workflow runs planning, evidence retrieval, memo drafting, and review.
- The review records each draft and actual score, explains missing sections, and passes feedback into revisions.
- Memos quote retrieved snippets with citation IDs and label missing company facts as unknown.
- The API accepts PDF, CSV, JSON, and text uploads within stated limits and offers Markdown and PDF reports.
- SQLite stores run results, reconnectable progress events, and approval or rejection decisions.
- The dashboard shows real stage events and request errors. Studio examples and model fallback results are labelled.
- The API defaults to offline research and generation. It supports a shared access token, explicit origins, run limits, and retention.
- The repository includes a frontend build and backend test workflow, including API smoke coverage.

## Remaining work

- Enable required checks in GitHub after the workflow runs on the remote repository. The repository owner is the default reviewer until additional maintainers are confirmed.
- Run a live evaluation using consented company evidence. Measure search relevance and claim support before selecting embeddings or reranking.
- For separate customer accounts, add per-user ownership and isolation, production-grade background workers, and an abuse policy for public uploads.
- The architecture document describes longer-term features such as parallel task scheduling, durable run resume, and independent entailment evaluation.
