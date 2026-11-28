"""FastAPI endpoints for the due-diligence dashboard."""

import asyncio
import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import sqlite3
import time
import uuid
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
import jwt

from app.orchestrator.graph import run_due_diligence
from app.providers.gemini import provider
from app.rag.retriever import default_retriever
from app.rag.uploads import MAX_UPLOAD_BYTES, extract_text
from app.storage.runs import RunStore
from app.tools.report import render_markdown, render_pdf

logger = logging.getLogger(__name__)
MAX_BODY_BYTES = MAX_UPLOAD_BYTES + 64 * 1024
MAX_CONCURRENT_RUNS = 2
ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip()
]
for _vercel_host in (os.getenv("VERCEL_URL"), os.getenv("VERCEL_PROJECT_PRODUCTION_URL")):
    if _vercel_host:
        _origin = f"https://{_vercel_host.strip()}"
        if _origin not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(_origin)


class BodyLimit:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "POST":
            await self.app(scope, receive, send)
            return
        body = bytearray()
        try:
            async with asyncio.timeout(15):
                while True:
                    message = await receive()
                    if message["type"] == "http.disconnect":
                        return
                    chunk = message.get("body", b"")
                    if len(body) + len(chunk) > MAX_BODY_BYTES:
                        await JSONResponse({"detail": "Request is too large."}, status_code=413)(scope, receive, send)
                        return
                    body.extend(chunk)
                    if not message.get("more_body"):
                        break
        except TimeoutError:
            await JSONResponse({"detail": "Request body timed out."}, status_code=408)(scope, receive, send)
            return

        consumed = False

        async def replay():
            nonlocal consumed
            if consumed:
                return await receive()
            consumed = True
            return {"type": "http.request", "body": bytes(body), "more_body": False}

        await self.app(scope, replay, send)


@asynccontextmanager
async def lifespan(app: FastAPI):
    token = os.getenv("RAGATHON_API_TOKEN", "")
    if os.getenv("RAGATHON_PUBLIC", "false").lower() == "true" and len(token) < 32:
        raise RuntimeError("Public mode requires a private API token of at least 32 characters.")
    app.state.token = token
    default_db_path = "/tmp/runs.sqlite3" if os.getenv("VERCEL") else "runs.sqlite3"
    app.state.store = RunStore(os.getenv("RUN_DB_PATH", default_db_path))
    app.state.store.recover()
    app.state.retention = int(os.getenv("RUN_RETENTION_HOURS", "24")) * 3600
    if app.state.retention <= 0:
        raise RuntimeError("RUN_RETENTION_HOURS must be positive.")
    app.state.store.prune(app.state.retention)
    app.state.jobs = set()
    app.state.submissions = deque()
    cleanup = asyncio.create_task(prune_runs(app.state.store, app.state.retention))
    try:
        yield
    finally:
        cleanup.cancel()
        await asyncio.gather(cleanup, *app.state.jobs, return_exceptions=True)


async def prune_runs(store: RunStore, retention: int):
    while True:
        await asyncio.sleep(min(retention, 300))
        await run_in_threadpool(store.prune, retention)


async def authorize(request: Request, authorization: Annotated[str | None, Header()] = None):
    origin = request.headers.get("origin")
    if origin and origin not in ALLOWED_ORIGINS:
        raise HTTPException(403, "This dashboard origin is not allowed.")
    token = request.app.state.token
    provided = (authorization or "").removeprefix("Bearer ").strip()
    supabase_secret = os.getenv("SUPABASE_JWT_SECRET", "")
    valid_supabase_token = False
    if provided.count('.') == 2 and not supabase_secret:
        # Validate against Auth rather than trusting decoded JWT claims.
        import httpx

        try:
            async with httpx.AsyncClient(timeout=8) as client:
                response = await client.get(
                    os.getenv('SUPABASE_URL', 'https://qnoaezyqryizzblqxjmz.supabase.co').rstrip('/') + '/auth/v1/user',
                    headers={
                        'Authorization': f'Bearer {provided}',
                        'apikey': os.getenv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_UAGMGXkmbyE0WUA6vuO45w_SOIsD_c6'),
                    },
                )
                valid_supabase_token = response.status_code == 200 and bool(response.json().get('id'))
        except (httpx.HTTPError, ValueError):
            valid_supabase_token = False
    if provided and supabase_secret:
        try:
            jwt.decode(provided, supabase_secret, algorithms=["HS256"], audience="authenticated")
            valid_supabase_token = True
        except jwt.PyJWTError:
            valid_supabase_token = False
    if not token and not valid_supabase_token and (request.client is None or request.client.host not in {"127.0.0.1", "::1"}):
        raise HTTPException(403, "Sign in or configure an API access token for remote requests.")
    if token and not valid_supabase_token and not secrets.compare_digest(provided.encode(), token.encode()):
        raise HTTPException(401, "Sign in or enter the API access token.", headers={"WWW-Authenticate": "Bearer"})


app = FastAPI(title="AgentVerse API", version="0.2.0", lifespan=lifespan)
app.add_middleware(BodyLimit)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type", "Last-Event-ID"],
)
Auth = Depends(authorize)


def mission_result(state: dict, prompt: str, filename: str | None) -> dict:
    drafts = state["drafts"]
    return {
        "id": state["run_id"],
        "domain": "bizintel",
        "prompt": prompt,
        "attachedFileName": filename,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "mode": state["generation_mode"],
        "criticInitialScore": drafts[0]["score"],
        "criticFinalScore": drafts[-1]["score"],
        "criticNote": f"First review: {drafts[0]['feedback']} Final review: {drafts[-1]['feedback']}",
        "drafts": drafts,
        "plan": state.get("plan", []),
        "taskStatuses": state.get("task_statuses", {}),
        "briefTitle": "AgentVerse Startup Due-Diligence Memo",
        "briefSections": [{"heading": "Investment Memo", "body": state["final_output"]}],
        "citations": state["citations"],
        "singleLlmComparison": "",
        "proposedAction": {
            "title": "Approve follow-up diligence",
            "description": "Save a decision about the proposed follow-up. The workspace records the decision only.",
            "riskLevel": "Medium",
            "payloadPreview": "Request primary evidence.",
            "status": "pending",
        },
    }


class AttachmentError(ValueError):
    """An attachment validation message safe to show in the dashboard."""


def execute(store: RunStore, run_id: str, prompt: str, data: bytes | None, filename: str | None):
    try:
        text = extract_text(filename, data) if filename and data is not None else None
    except UnicodeDecodeError as exc:
        raise AttachmentError("The attachment must use UTF-8 encoding.") from exc
    except ValueError as exc:
        raise AttachmentError(str(exc)) from exc
    state = run_due_diligence(
        prompt,
        source_text=text,
        source_name=filename,
        run_id=run_id,
        persist_checkpoint=False,
        on_step=lambda stage, log: store.event(run_id, {"status": "running", "stage": stage, **log}),
    )
    return mission_result(state, prompt, filename)


async def perform(store, run_id, prompt, data, filename):
    try:
        result = await run_in_threadpool(execute, store, run_id, prompt, data, filename)
    except AttachmentError as exc:
        await run_in_threadpool(store.finish, run_id, "failed", {"error": str(exc)[:300]})
    except Exception as exc:
        logger.error("Run %s failed (%s).", run_id, type(exc).__name__)
        await run_in_threadpool(store.finish, run_id, "failed", {"error": "Could not finish the run. Check the attachment and try again."})
    else:
        await run_in_threadpool(store.finish, run_id, "completed", result)


@app.get("/health")
def health():
    return {"status": "ok", "service": "agentverse-api"}


@app.post("/api/retrieve")
def retrieve(payload: dict) -> dict:
    """Expose retrieval as a tool for agents and external callers."""
    query = str(payload.get("query", "")).strip()
    if not query:
        return {"query": "", "chunks": [], "error": "query is required"}
    top_k = max(1, min(int(payload.get("top_k", 6)), 20))
    chunks = default_retriever().search(query, top_k=top_k)
    return {"query": query, "chunks": chunks}


def reserve_submission(state):
    now = time.monotonic()
    while state.submissions and now - state.submissions[0] >= 60:
        state.submissions.popleft()
    if len(state.jobs) >= MAX_CONCURRENT_RUNS or len(state.submissions) >= 10:
        raise HTTPException(429, "The workspace is busy. Try again shortly.", headers={"Retry-After": "60"})
    state.submissions.append(now)


async def queue_run(request, prompt, domain, file):
    data = await file.read(MAX_UPLOAD_BYTES + 1) if file else None
    if data is not None and len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Attachments must be at most 2 MB.")
    filename = (file.filename or "upload")[:255] if file else None
    state = request.app.state
    prompt = prompt.strip()
    if not prompt:
        raise HTTPException(422, "Enter a due-diligence question.")
    if domain not in {"auto", "bizintel"}:
        raise HTTPException(422, "The connected workspace supports startup due diligence.")
    reserve_submission(state)
    run_id = f"run-{uuid.uuid4().hex}"
    ready = asyncio.get_running_loop().create_future()
    job = asyncio.create_task(run_job(state, run_id, prompt, data, filename, ready))
    state.jobs.add(job)
    job.add_done_callback(state.jobs.discard)
    await asyncio.shield(ready)
    return run_id, job


async def run_job(state, run_id, prompt, data, filename, ready):
    try:
        await run_in_threadpool(state.store.create, run_id)
    except sqlite3.Error as exc:
        ready.set_exception(exc)
        return
    ready.set_result(None)
    await perform(state.store, run_id, prompt, data, filename)


Prompt = Annotated[str, Form(min_length=1, max_length=4000)]
Attachment = Annotated[UploadFile | None, File()]


@app.post("/api/chat")
async def chat(
    request: Request,
    prompt: Prompt,
    history: Annotated[str, Form()] = "[]",
    file: Attachment = None,
) -> dict[str, str]:
    origin = request.headers.get("origin")
    if origin and origin not in ALLOWED_ORIGINS:
        raise HTTPException(403, "This dashboard origin is not allowed.")
    prompt = prompt.strip()
    if not prompt:
        raise HTTPException(422, "Enter a message.")
    image_data_url: str | None = None
    if file is not None:
        data = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "Images must be at most 2 MB.")
        mime = (file.content_type or "").lower()
        if not mime.startswith("image/"):
            raise HTTPException(422, "Only image attachments are supported in chat.")
        image_data_url = f"data:{mime};base64,{base64.b64encode(data).decode()}"
    try:
        previous = json.loads(history)
    except (TypeError, ValueError) as exc:
        raise HTTPException(422, "Invalid chat history.") from exc
    if not isinstance(previous, list) or len(previous) > 40:
        raise HTTPException(422, "Invalid chat history.")
    turns = []
    for item in previous[-12:]:
        if not isinstance(item, dict) or item.get("role") not in {"user", "assistant"}:
            raise HTTPException(422, "Invalid chat history.")
        content = item.get("content")
        if not isinstance(content, str) or len(content) > 4000:
            raise HTTPException(422, "Invalid chat history.")
        turns.append(f"{item['role'].title()}: {content}")
    conversation = "\n".join([*turns, f"User: {prompt}"])
    model = provider()
    if not model.live:
        raise HTTPException(503, "Chat model access is not configured.")

    state = request.app.state
    reserve_submission(state)
    job = asyncio.create_task(run_in_threadpool(
        model.generate,
        "You are AgentVerse, a helpful conversational assistant. Reply directly to the "
        "user's latest message using the conversation context. Be concise and never claim you ran tools or reviewed evidence.",
        conversation,
        accept=lambda answer: bool(answer.strip()),
        image_data_url=image_data_url,
    ))
    state.jobs.add(job)
    job.add_done_callback(state.jobs.discard)
    reply = await asyncio.shield(job)
    if not reply:
        raise HTTPException(503, "The chat model is unavailable. Try again shortly.")
    return {"reply": reply.strip()}


@app.post("/api/runs", dependencies=[Auth], status_code=202)
async def create_run(request: Request, prompt: Prompt, domain: Annotated[str, Form()] = "bizintel", file: Attachment = None):
    run_id, _ = await queue_run(request, prompt, domain, file)
    return {"id": run_id}


@app.post("/api/run", dependencies=[Auth])
async def run(request: Request, prompt: Prompt, domain: Annotated[str, Form()] = "bizintel", file: Attachment = None):
    run_id, job = await queue_run(request, prompt, domain, file)
    await asyncio.shield(job)
    run_record = await run_in_threadpool(request.app.state.store.get, run_id)
    if run_record["status"] == "failed":
        raise HTTPException(422, run_record["result"]["error"])
    return run_record["result"]


def require_run(store, run_id):
    record = store.get(run_id)
    if record is None:
        raise HTTPException(404, "Run not found.")
    return record


@app.get("/api/runs/{run_id}", dependencies=[Auth])
def get_run(request: Request, run_id: str):
    return require_run(request.app.state.store, run_id)


@app.get("/api/runs/{run_id}/events", dependencies=[Auth])
async def events(request: Request, run_id: str, last_event_id: Annotated[int, Header(ge=0)] = 0):
    store = request.app.state.store
    await run_in_threadpool(require_run, store, run_id)

    async def stream():
        cursor = last_event_id
        while not await request.is_disconnected():
            for sequence, body in await run_in_threadpool(store.events, run_id, cursor):
                cursor = sequence
                yield f"id: {cursor}\ndata: {json.dumps(body)}\n\n"
                if body["status"] in {"completed", "failed"}:
                    return
            record = await run_in_threadpool(store.get, run_id)
            if record is None or record["status"] in {"failed", "completed"}:
                # A terminal event may have been committed just after the previous read.
                for sequence, body in await run_in_threadpool(store.events, run_id, cursor):
                    yield f"id: {sequence}\ndata: {json.dumps(body)}\n\n"
                return
            await asyncio.sleep(0.2)

    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


class Decision(BaseModel):
    mission_id: str = Field(max_length=80)
    payload: str | None = Field(default=None, max_length=2000)
    status: str = Field(default="approved", pattern="^(approved|rejected)$")


class BookingHandoff(BaseModel):
    run_id: str = Field(min_length=1, max_length=80)
    provider: str = Field(min_length=1, max_length=120)
    booking_url: str = Field(pattern=r"^https://")
    selection: dict[str, object] = Field(min_length=1)
    user_confirmed: bool = False


class FollowUpRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=4000)


@app.post("/api/approve", dependencies=[Auth])
def approve(request: Request, decision: Decision):
    action = request.app.state.store.decide(decision.mission_id, decision.status, decision.payload)
    if action is None:
        raise HTTPException(404, "Completed run not found.")
    if action is False:
        raise HTTPException(409, "A different decision was already saved.")
    return {"status": action["status"], "mission_id": decision.mission_id, "action": action}


@app.post("/api/booking/handoff", dependencies=[Auth])
async def booking_handoff(request: Request, handoff: BookingHandoff):
    """Send an explicitly approved travel selection to n8n and return its checkout URL."""
    if not handoff.user_confirmed:
        raise HTTPException(400, "Confirm the selected booking before continuing.")
    webhook = os.getenv("N8N_BOOKING_WEBHOOK_URL", "").strip()
    secret = os.getenv("N8N_BOOKING_WEBHOOK_SECRET", "").strip()
    if not webhook or not secret:
        raise HTTPException(503, "Booking handoff is not configured.")
    payload = {
        "run_id": handoff.run_id,
        "provider": handoff.provider,
        "booking_url": handoff.booking_url,
        "selection": handoff.selection,
        "user_confirmed": True,
        "requested_at": datetime.now(timezone.utc).isoformat(),
    }
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(webhook, content=body, headers={
                "Content-Type": "application/json",
                "X-Diablo-Signature": f"sha256={signature}",
                "X-Diablo-Idempotency-Key": handoff.run_id,
            })
    except httpx.HTTPError as exc:
        raise HTTPException(502, "Could not reach the booking workflow.") from exc
    if response.status_code >= 400:
        raise HTTPException(502, "The booking workflow rejected this handoff.")
    response_data = response.json() if response.content else {}
    redirect_url = response_data.get("redirect_url") or handoff.booking_url
    if not isinstance(redirect_url, str) or not redirect_url.startswith("https://"):
        raise HTTPException(502, "The booking workflow returned an invalid redirect.")
    return {"status": "handoff_created", "redirect_url": redirect_url}


@app.post("/api/runs/{run_id}/follow-up", dependencies=[Auth])
async def follow_up(request: Request, run_id: str, follow_up_request: FollowUpRequest):
    """Answer a follow-up using the completed run's report and cited evidence."""
    record = require_run(request.app.state.store, run_id)
    if record["status"] != "completed" or not record.get("result"):
        raise HTTPException(409, "Follow-ups are available after the research run completes.")
    result = record["result"]
    context = json.dumps({
        "original_request": result.get("prompt", ""),
        "report": result.get("briefSections", []),
        "citations": result.get("citations", []),
    })
    model = provider()
    if not model.live:
        raise HTTPException(503, "Follow-up model access is not configured.")
    answer = await run_in_threadpool(
        model.generate,
        "Answer the follow-up using only the supplied investigation context. Cite source IDs when making factual claims, distinguish unknowns, and do not claim new research was performed.",
        f"Context:\n{context}\n\nFollow-up:\n{follow_up_request.prompt}",
        accept=lambda value: bool(value.strip()),
    )
    if not answer:
        raise HTTPException(503, "The follow-up model is unavailable. Try again shortly.")
    return {"run_id": run_id, "reply": answer.strip(), "citations": result.get("citations", [])}


@app.get("/api/runs/{run_id}/report/{format}", dependencies=[Auth])
def report(request: Request, run_id: str, format: str):
    record = require_run(request.app.state.store, run_id)
    if record["status"] != "completed":
        raise HTTPException(409, "The report is available after the run completes.")
    result = record["result"]
    args = (result["briefTitle"], result["briefSections"][0]["body"], result["citations"])
    if format == "md":
        body, content_type = render_markdown(*args), "text/markdown"
    elif format == "pdf":
        body, content_type = render_pdf(*args), "application/pdf"
    else:
        raise HTTPException(404, "Report format not found.")
    return Response(body, media_type=content_type, headers={"Content-Disposition": f'attachment; filename="diligence.{format}"'})
