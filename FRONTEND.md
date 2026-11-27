# AgentVerse OS — Frontend

Dia-inspired, calm editorial multi-agent command center built with **React + TypeScript + Vite + Tailwind CSS**.

## Features
- **Domain Pack Switcher:** Auto Route, Security, Incident Ops, Career, Campus, Finance, BizIntel.
- **Live Multi-Agent Pipeline:** Visualizes Orchestrator → parallel RAG + Tool Analyst (`asyncio`) → Synthesizer → Critic Evaluator (`Evaluate & Improve` loop).
- **Time-Travel Shared Memory Inspector:** Click any completed agent card to inspect its Shared Memory JSON, tool calls, and RAG chunks.
- **Compare vs. Single LLM:** Side-by-side baseline comparison proving the shift from Generative AI to Agentic AI.
- **Human-in-the-Loop Approval Gate (Rule #6):** Pauses before any consequential action with **Approve & Execute**, **Edit**, and **Reject** controls.

## Run Locally
```bash
npm install
npm run dev
```

## Connect to FastAPI Backend (Optional)
Create a `.env` file:
```env
VITE_API_URL=http://localhost:8000
```
Without `VITE_API_URL`, the UI runs in **Studio Demo Mode** with realistic multi-agent simulations for instant testing and presentations.
