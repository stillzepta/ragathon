# Ragathon

AgentVerse turns a startup due-diligence question into a memo with source excerpts, reviewed drafts, and a recorded follow-up decision. The connected workflow runs planning, research, analysis, and review in sequence. The separate Studio simulation showcases additional example workflows.

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

Without `VITE_API_URL`, Vite runs Studio simulation. With the API connected, enter a startup question. The dashboard shows real stage updates, earlier drafts, and downloads. It records approval or rejection for the suggested follow-up.

## Data and deployment

- Local mode uses the included SBA guide summaries and any supported attachment. A source excerpt confirms what was retrieved. The checklist score is a measure of memo structure and citation consistency.
- Web search is independently opt-in through `WEB_SEARCH_ENABLED=true`. It sends the question to Tavily when configured, with DuckDuckGo as a fallback. Model generation is separately opt-in. Set `MODEL_PROVIDER=gemini` or `MODEL_PROVIDER=groq` and configure the corresponding API key. If both keys are configured, the other provider can be tried after a failure. Runs with attachments stay local for model generation unless `ALLOW_EXTERNAL_UPLOADS=true`.
- The API keeps results and events, including cited attachment excerpts, in `RUN_DB_PATH` for `RUN_RETENTION_HOURS` (24 by default). The API uses in-memory graph checkpoints. Direct Python calls can still use local SQLite checkpoints through `CHECKPOINT_DB_PATH`.
- The hosted configuration is for a single trusted group sharing one access token. Run one API worker with `RAGATHON_PUBLIC=true`, a private `RAGATHON_API_TOKEN` of at least 32 characters, and `ALLOWED_ORIGINS` set to the dashboard origin. Terminate TLS at the hosting proxy and apply request timeouts and resource limits there. Enter the token in the dashboard. The browser keeps it in memory for the open page. The API caps concurrent runs, minute submissions, and attachment size.
- A restart keeps completed results and decisions. In-flight runs are marked failed so they can be submitted again. The event endpoint supports reconnecting with `Last-Event-ID`.

## Checks

```sh
python -m pytest
npm run build
```

CI runs the same checks on pull requests and pushes to `main`. See [implementation status](IMPLEMENTATION_STATUS.md) and [the target architecture](ARCHITECTURE.md).

## Vercel + Google OAuth

Set these Vercel Environment Variables for Preview and Production:

```env
VITE_API_URL=https://<deployed-api-host>
VITE_SUPABASE_URL=https://qnoaezyqryizzblqxjmz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<Supabase-publishable-key>
VITE_AUTH_REDIRECT_URL=https://<your-vercel-domain>
```

In Supabase Dashboard → Authentication → Providers, enable Google and add the Google OAuth client ID and secret. Set this callback URL in Google Cloud:

```text
https://qnoaezyqryizzblqxjmz.supabase.co/auth/v1/callback
```

Add the Vercel domain to Supabase Authentication → URL Configuration as the site URL and an allowed redirect URL. `vercel.json` keeps OAuth returns and other client-side routes inside the Vite SPA.
