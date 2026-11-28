# Diablo · AgentVerse

**Hackathon submission for Question 10 — The Multi-Agent Challenge**

Diablo helps a small investment team turn a startup question or pitch deck into a due-diligence memo. The workflow gathers relevant evidence, identifies gaps, drafts a recommendation, and uses reviewer feedback to improve the memo. The result includes sources, revision history, and questions the team can verify before deciding.

## How Diablo solves Question 10

| Challenge requirement | Implementation |
| --- | --- |
| Specialized agents | The [Planner](app/agents/planner.py) assigns tasks. The [Researcher](app/agents/researcher.py) retrieves evidence, the [Analyst](app/agents/analyst.py) compares findings, the [Writer](app/agents/writer.py) produces the memo, and the [Evaluator](app/agents/evaluator.py) reviews it. |
| Communication and shared context | Agents read and update [shared LangGraph state](app/state.py) containing task status, evidence, the current draft, and review feedback. |
| Central orchestration | The [LangGraph workflow](app/orchestrator/graph.py) schedules the stages, sends feedback back through analysis and drafting, and stops after the configured revision logic has run. |
| End-to-end completion | FastAPI exposes progress, the reviewed memo, and Markdown/PDF export. The [API test](tests/test_api.py) exercises the run from submission through export. |
| Autonomy bonus | The workflow evaluates and revises within a bounded loop. With model access configured, an eligible draft scoring **90 or higher** can also receive a second critique. The task plan and stage order follow predefined rules. |

**Stack** · React/Vite frontend, FastAPI, LangGraph, local document retrieval with optional web search, SQLite for run records, and Supabase for authentication and saved chats.

## Reproduce a complete run

After installing the Python dependencies below, run this from the repo root. It uses the included research material and excludes live model credentials.

```sh
env -u GEMINI_API_KEY -u GOOGLE_API_KEY -u GROQ_API_KEY -u OPENROUTER_API_KEY \
  MODEL_PROVIDER=mock WEB_SEARCH_ENABLED=false DIABLO_LOAD_DOTENV=false \
  python - <<'PYTHON'
from app.orchestrator.graph import run_due_diligence

state = run_due_diligence(
    "Should we invest in an AI accounting startup?",
    persist_checkpoint=False,
)
print("Assigned agents:", ", ".join(task["owner"] for task in state["plan"]))
for number, draft in enumerate(state["drafts"], start=1):
    print(f"Draft {number}: {draft['score']}/100. {draft['feedback']}")
print(state["final_output"])
PYTHON
```

In the verified local run, **Draft 1 scored 60/100**. The evaluator requested a competitor comparison and financial assumptions. **Draft 2 added both sections and scored 100/100** on the local rubric. The memo cited one retrieved source and identified unverified company facts. The run reported **“Second review unavailable”** because live model access was disabled. The local score measures rubric coverage and citation consistency.

## Run locally

Use Python 3.12 and Node.js 22 for the same dependency setup as CI.

```sh
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-ci.txt
python -m pip install --no-deps -e '.[dev]'
cp .env.example .env
uvicorn app.api.main:app --env-file .env --host 127.0.0.1 --port 8000
```

In another terminal:

```sh
npm ci
VITE_API_URL=http://localhost:8000 npm run dev
```

Open the URL printed by Vite. Select **Settings → Prompt mode → Due diligence** and ask about a startup. The API records progress, earlier drafts, and follow-up decisions. Use **Chat** for quick questions when a model provider is configured.

## Data and deployment

### Host the backend separately

Deploy this repository's root `Dockerfile` as a single Docker web service on a host that supports persistent storage. The service listens on the host-provided `PORT` (default 8000). Keep the Vite frontend on Vercel; no folder moves are required.

Set these variables on the backend host (not in Vercel's browser variables):

```env
RAGATHON_PUBLIC=true
RAGATHON_API_TOKEN=<a-random-secret-at-least-32-characters>
ALLOWED_ORIGINS=https://<your-vercel-domain>
RUN_DB_PATH=/data/runs.sqlite3
RUN_RETENTION_HOURS=24
```

Mount a persistent volume at `/data`; without one, reports and events can disappear on restart or redeploy. Use one service instance and one worker: the queue and concurrency controls are process-local. Supply model/search keys and enable those features only if needed. In Vercel, set `VITE_API_URL` to the deployed backend's HTTPS origin, redeploy the frontend, and enter the backend access token in the dashboard. Add each actual Vercel origin to `ALLOWED_ORIGINS` as a comma-separated list.

Verify `https://<backend-host>/health`, then submit a question from the Vercel frontend and check progress and the report. The local `.env` is not uploaded to Vercel or the backend host. Supabase OAuth still requires its provider and redirect URLs to be configured separately.

- Local mode uses the included SBA guide summaries and any supported attachment. A source excerpt confirms what was retrieved. The checklist score is a measure of memo structure and citation consistency.
- Web search is independently opt-in through `WEB_SEARCH_ENABLED=true`. When `SERPAPI_API_KEY` is configured, Diablo queries Google through SerpAPI first, then falls back to Tavily and DuckDuckGo. Keep the SerpAPI key on the backend only; never put it in a `VITE_*` variable. Model generation is separately opt-in. Set `MODEL_PROVIDER=gemini` or `MODEL_PROVIDER=groq` and configure the corresponding API key. If both keys are configured, the other provider can be tried after a failure. Runs with attachments stay local for model generation unless `ALLOW_EXTERNAL_UPLOADS=true`.
- The API keeps results and events, including cited attachment excerpts, in `RUN_DB_PATH` for `RUN_RETENTION_HOURS` (24 by default). The API uses in-memory graph checkpoints. Direct Python calls can still use local SQLite checkpoints through `CHECKPOINT_DB_PATH`.
- The hosted configuration is for a single trusted group sharing one access token. Run one API worker with `RAGATHON_PUBLIC=true`, a private `RAGATHON_API_TOKEN` of at least 32 characters, and `ALLOWED_ORIGINS` set to the dashboard origin. Terminate TLS at the hosting proxy and apply request timeouts and resource limits there. Enter the token in the dashboard. The browser keeps it in memory for the open page. The API caps concurrent runs, minute submissions, and attachment size.
- A restart keeps completed results and decisions. In-flight runs are marked failed so they can be submitted again. The event endpoint supports reconnecting with `Last-Event-ID`.

## Checks

```sh
python -m pytest
npm run build
```

For more detail, see [implementation status](IMPLEMENTATION_STATUS.md) and [the target architecture](ARCHITECTURE.md).

## Vercel + Google OAuth

Apply both SQL files in `supabase/migrations` to your Supabase project before enabling saved chats.
The `chat_threads` and `chat_messages` tables use row-level security so signed-in users
can access only their own history. Chat mode sends recent messages to FastAPI
as conversation context. The backend still uses document RAG separately for diligence runs.
Guests without Supabase sign-in can chat during the open page session, but their chats
are not saved across reloads.

Set these Vercel Environment Variables for Preview and Production:

```env
VITE_API_URL=https://<deployed-api-host>
VITE_SUPABASE_URL=https://qnoaezyqryizzblqxjmz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<Supabase-publishable-key>
VITE_AUTH_REDIRECT_URL=https://<your-vercel-domain>
```

For a Vercel deployment, add `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` in Project Settings → Environment Variables
for Production (and Preview if needed), then redeploy. These values are the
Supabase project's browser-safe URL and publishable key; never use a
`service_role` or secret key in a `VITE_*` variable. A rebuild is required
because Vite embeds `VITE_*` variables at build time.

In Supabase Dashboard → Authentication → Providers, enable Google and add the Google OAuth client ID and secret. Set this callback URL in Google Cloud:

```text
https://qnoaezyqryizzblqxjmz.supabase.co/auth/v1/callback
```

Add the Vercel domain to Supabase Authentication → URL Configuration as the site URL and an allowed redirect URL. `vercel.json` keeps OAuth returns and other client-side routes inside the Vite SPA.
