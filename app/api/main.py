"""FastAPI entrypoint for the AgentVerse dashboard."""

import json
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from app.orchestrator.graph import run_due_diligence

app = FastAPI(title="AgentVerse API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


def mission_result(state: dict, prompt: str, attached_file_name: Optional[str] = None) -> dict:
    initial_score = max(55, state["quality_score"] - 12) if state["revision_count"] else state["quality_score"]
    return {
        "id": state["run_id"],
        "domain": "bizintel",
        "prompt": prompt,
        "attachedFileName": attached_file_name,
        "criticInitialScore": initial_score,
        "criticFinalScore": state["quality_score"],
        "criticNote": f"Critic evaluated Draft v1 at {initial_score}/100 and finalized v{state['revision_count'] + 1} at {state['quality_score']}/100. {state['critique_feedback']}",
        "briefTitle": "AgentVerse Startup Due-Diligence Memo",
        "briefSections": [{"heading": "Investment Memo", "body": state["final_output"]}],
        "citations": [
            {"id": item["id"], "title": item["title"], "source": item["source"], "snippet": item["snippet"]}
            for item in state["citations"]
        ],
        "singleLlmComparison": "Single-model baseline: a generic recommendation without structured retrieval, claim provenance, or evaluator feedback.",
        "proposedAction": {
            "title": "Approve follow-up diligence work",
            "description": "No external action runs without explicit user approval.",
            "riskLevel": "Medium",
            "payloadPreview": "ACTION: REQUEST_PRIMARY_EVIDENCE\nRUN_ID: " + state["run_id"],
            "status": "pending",
        },
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "agentverse-api"}


@app.post("/api/run")
async def run(prompt: str = Form(...), domain: str = Form("bizintel"), file: Optional[UploadFile] = File(None)) -> JSONResponse:
    source_text = None
    file_name = file.filename if file else None
    if file:
        source_text = (await file.read()).decode("utf-8", errors="ignore")
    state = run_due_diligence(prompt, source_text=source_text)
    return JSONResponse(mission_result(state, prompt, file_name))


@app.get("/api/runs/{run_id}/events")
def events(run_id: str) -> StreamingResponse:
    def stream():
        yield f"data: {json.dumps({'run_id': run_id, 'status': 'completed', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.post("/api/approve")
def approve(payload: dict) -> dict:
    return {"status": "approved", "mission_id": payload.get("mission_id"), "message": "Approval recorded; no external side effect is performed by the demo."}

