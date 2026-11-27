# AgentVerse dashboard

The React and Vite dashboard has two modes.

- **Connected due diligence** submits a startup question and optional attachment to FastAPI. The dashboard shows progress from saved backend events, displays the memo and its sources, lets you review earlier drafts, offers Markdown and PDF downloads, and saves approval or rejection.
- **Studio simulation** runs the preset examples locally. Agent progress, memory, and actions shown in these examples are simulated.

Set `VITE_API_URL=http://localhost:8000` when starting Vite to connect to the local API. See [README](README.md) for setup and token configuration.
