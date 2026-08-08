# main.py
# FastAPI entry point for the Intelliflow AI Agent microservice.
# Exposes:
#   POST /run-agent  — run the LangGraph workflow agent
#   GET  /health     — health check
#
# Security: X-Internal-Key header required on /run-agent.
# All LLM work is done asynchronously — FastAPI runs in async mode via uvicorn.

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load .env before anything else so os.environ is populated for agent/llm init
load_dotenv()

from agent import run_agent  # noqa: E402  (must be after load_dotenv)
from schemas import AgentInput, AgentOutput  # noqa: E402

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Intelliflow AI Agent Service",
    description=(
        "LangGraph-powered microservice that classifies client requests and "
        "generates project workflow breakdowns. Called by the Node.js backend."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — restrict to the Node.js backend origin in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten this to your Render/backend URL in production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Auth dependency — shared secret header
# ---------------------------------------------------------------------------

INTERNAL_API_KEY: str = os.environ.get("INTERNAL_API_KEY", "")


def verify_internal_key(x_internal_key: str = Header(..., alias="X-Internal-Key")) -> None:
    """
    Require the X-Internal-Key header to match the INTERNAL_API_KEY env var.
    If INTERNAL_API_KEY is empty (e.g., local dev without .env), skip the check.
    """
    if INTERNAL_API_KEY and x_internal_key != INTERNAL_API_KEY:
        logger.warning("[auth] Rejected request with invalid X-Internal-Key")
        raise HTTPException(status_code=401, detail="Unauthorized: invalid internal key")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Monitoring"])
async def health_check() -> dict:
    """Health check endpoint — no auth required."""
    return {"status": "ok", "service": "intelliflow-ai-agent"}


@app.post(
    "/run-agent",
    response_model=AgentOutput,
    tags=["Agent"],
    dependencies=[Depends(verify_internal_key)],
    summary="Run the LangGraph AI workflow agent",
    description=(
        "Classifies a client request (web_dev / app_dev / prototype / research / out_of_scope) "
        "and generates a tailored task breakdown. "
        "Returns a fallback template if the LLM is unavailable or times out."
    ),
)
async def run_agent_endpoint(body: AgentInput) -> AgentOutput:
    logger.info(f"[/run-agent] title={body.title!r} reqs={len(body.requirements)} items")

    result = await run_agent(
        title=body.title,
        description=body.description,
        requirements=body.requirements,
    )

    logger.info(
        f"[/run-agent] done — type={result.get('requestType')} "
        f"fallback={result.get('usedFallback')} "
        f"outOfScope={result.get('isOutOfScope')}"
    )

    return AgentOutput(**result)


# ---------------------------------------------------------------------------
# Entry point for local development
# uvicorn main:app --reload --port 8000
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
