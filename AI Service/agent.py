# agent.py
# Python LangGraph state graph — direct translation of aiWorkflowAgent.js.
# 2-node stateless graph:
#   Node 1: classify_request  → Groq LLM (json_mode)
#   Node 2: generate_workflow → Groq LLM (json_mode)
# Conditional edge: isOutOfScope → END (skip Node 2)
# Timeout: asyncio.wait_for() wrapping the full graph invocation.
# Fallback: static templates from fallbacks.py used on error or timeout.

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import List, Optional

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from pydantic import ValidationError
from typing_extensions import TypedDict

from fallbacks import FALLBACK_WORKFLOWS
from prompts import (
    CLASSIFY_SYSTEM,
    WORKFLOW_SYSTEM,
    build_classify_prompt,
    build_workflow_prompt,
)
from schemas import ClassifyLLMOutput, WorkflowLLMOutput

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Agent state — mirrors graphChannels in the JS StateGraph
# ---------------------------------------------------------------------------

class AgentState(TypedDict):
    # Inputs
    title: str
    description: str
    requirements: List[str]
    # Outputs from Node 1 (classify_request)
    requestType: Optional[str]
    isOutOfScope: bool
    outOfScopeReason: Optional[str]
    aiConfidence: Optional[str]
    # Outputs from Node 2 (generate_workflow)
    workflow: Optional[dict]
    usedFallback: bool
    error: Optional[str]


# ---------------------------------------------------------------------------
# LLM client factory
# ---------------------------------------------------------------------------

def _get_llm() -> ChatGroq:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key or api_key == "your_groq_api_key_here":
        raise ValueError("GROQ_API_KEY is not configured. Set it in AI Service/.env")
    return ChatGroq(
        api_key=api_key,
        model=os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
        temperature=0.2,
        max_tokens=2048,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_parse_json(raw: str) -> Optional[dict]:
    """Strip markdown fences if present and parse JSON. Returns None on failure."""
    try:
        cleaned = raw.strip()
        # Strip ```json ... ``` fences that some LLMs add despite instructions
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            if cleaned.endswith("```"):
                cleaned = cleaned[: cleaned.rfind("```")]
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        # Last-ditch: try to find the first {...} block in the text
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except json.JSONDecodeError:
                pass
        return None


# ---------------------------------------------------------------------------
# Node 1: classify_request
# ---------------------------------------------------------------------------

async def classify_request(state: AgentState) -> AgentState:
    """
    Calls the Groq LLM to classify the request type and detect out-of-scope submissions.
    Mirrors classifyRequest() in aiWorkflowAgent.js.
    """
    llm = _get_llm()
    try:
        response = await llm.ainvoke(
            [
                SystemMessage(content=CLASSIFY_SYSTEM),
                HumanMessage(
                    content=build_classify_prompt(
                        state["title"], state["description"], state["requirements"]
                    )
                ),
            ],
            response_format={"type": "json_object"},
        )

        raw = (
            response.content
            if isinstance(response.content, str)
            else json.dumps(response.content)
        )

        parsed = _safe_parse_json(raw)
        if parsed is None:
            logger.warning("[agent] classify_request: could not parse LLM JSON — defaulting to research")
            return {
                **state,
                "requestType": "research",
                "isOutOfScope": False,
                "aiConfidence": "low",
            }

        # Validate with Pydantic (replaces Zod ClassifySchema)
        try:
            validated = ClassifyLLMOutput.model_validate(parsed)
            return {
                **state,
                "requestType": validated.requestType,
                "isOutOfScope": validated.requestType == "out_of_scope",
                "outOfScopeReason": validated.outOfScopeReason,
                "aiConfidence": validated.confidence,
            }
        except ValidationError as ve:
            logger.warning(f"[agent] classify_request: Pydantic validation failed: {ve}")
            # Best-effort: use raw value if recognisable
            raw_type = parsed.get("requestType", "research")
            valid_types = {"web_dev", "app_dev", "prototype", "research", "out_of_scope"}
            normalized = raw_type if raw_type in valid_types else "research"
            return {
                **state,
                "requestType": normalized,
                "isOutOfScope": normalized == "out_of_scope",
                "outOfScopeReason": parsed.get("outOfScopeReason"),
                "aiConfidence": "low",
            }

    except Exception as exc:
        logger.error(f"[agent] classify_request error: {exc}")
        return {
            **state,
            "requestType": "research",
            "isOutOfScope": False,
            "aiConfidence": "low",
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# Node 2: generate_workflow
# ---------------------------------------------------------------------------

async def generate_workflow(state: AgentState) -> AgentState:
    """
    Calls the Groq LLM to generate a tailored task breakdown for the request.
    Mirrors generateWorkflow() in aiWorkflowAgent.js.
    """
    llm = _get_llm()
    request_type = state["requestType"] or "research"

    try:
        response = await llm.ainvoke(
            [
                SystemMessage(content=WORKFLOW_SYSTEM),
                HumanMessage(
                    content=build_workflow_prompt(
                        request_type,
                        state["title"],
                        state["description"],
                        state["requirements"],
                    )
                ),
            ],
            response_format={"type": "json_object"},
        )

        raw = (
            response.content
            if isinstance(response.content, str)
            else json.dumps(response.content)
        )

        parsed = _safe_parse_json(raw)
        if parsed is None:
            logger.warning("[agent] generate_workflow: could not parse LLM JSON — using fallback")
            return {
                **state,
                "workflow": FALLBACK_WORKFLOWS.get(request_type, FALLBACK_WORKFLOWS["research"]),
                "usedFallback": True,
            }

        # Validate with Pydantic (replaces Zod WorkflowSchema)
        try:
            validated = WorkflowLLMOutput.model_validate(parsed)
            return {
                **state,
                "workflow": validated.model_dump(),
                "usedFallback": False,
            }
        except ValidationError as ve:
            logger.warning(f"[agent] generate_workflow: Pydantic validation failed: {ve} — using fallback")
            return {
                **state,
                "workflow": FALLBACK_WORKFLOWS.get(request_type, FALLBACK_WORKFLOWS["research"]),
                "usedFallback": True,
            }

    except Exception as exc:
        logger.error(f"[agent] generate_workflow error: {exc}")
        return {
            **state,
            "workflow": FALLBACK_WORKFLOWS.get(request_type, FALLBACK_WORKFLOWS["research"]),
            "usedFallback": True,
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# Conditional edge — mirrors routeAfterClassify() in aiWorkflowAgent.js
# ---------------------------------------------------------------------------

def route_after_classify(state: AgentState) -> str:
    return END if state.get("isOutOfScope") else "generate_workflow"


# ---------------------------------------------------------------------------
# Build and compile the LangGraph state graph (compiled once at module load)
# ---------------------------------------------------------------------------

def _build_graph() -> object:
    graph = StateGraph(AgentState)
    graph.add_node("classify_request", classify_request)
    graph.add_node("generate_workflow", generate_workflow)
    graph.set_entry_point("classify_request")
    graph.add_conditional_edges(
        "classify_request",
        route_after_classify,
        {
            "generate_workflow": "generate_workflow",
            END: END,
        },
    )
    graph.add_edge("generate_workflow", END)
    return graph.compile()


_compiled_graph = None


def _get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = _build_graph()
    return _compiled_graph


# ---------------------------------------------------------------------------
# Public API — called by main.py
# ---------------------------------------------------------------------------

async def run_agent(title: str, description: str, requirements: List[str]) -> dict:
    """
    Run the LangGraph AI workflow agent.
    Returns a dict matching the AgentOutput schema.
    On timeout, returns a research fallback with usedFallback=True.
    Mirrors runAIWorkflowAgent() in aiWorkflowAgent.js.
    """
    timeout_secs = int(os.environ.get("AI_WORKFLOW_TIMEOUT_SECS", "60"))

    initial_state: AgentState = {
        "title": title or "",
        "description": description or "",
        "requirements": requirements if isinstance(requirements, list) else [],
        "requestType": None,
        "isOutOfScope": False,
        "outOfScopeReason": None,
        "aiConfidence": None,
        "workflow": None,
        "usedFallback": False,
        "error": None,
    }

    try:
        result = await asyncio.wait_for(
            _get_graph().ainvoke(initial_state),
            timeout=timeout_secs,
        )
        return dict(result)

    except asyncio.TimeoutError:
        logger.warning(f"[agent] Timed out after {timeout_secs}s — using fallback")
        return {
            **initial_state,
            "requestType": "research",
            "isOutOfScope": False,
            "aiConfidence": "low",
            "workflow": FALLBACK_WORKFLOWS["research"],
            "usedFallback": True,
            "error": "Agent timed out",
        }
    except Exception as exc:
        logger.error(f"[agent] Unexpected error: {exc}")
        return {
            **initial_state,
            "requestType": "research",
            "isOutOfScope": False,
            "aiConfidence": "low",
            "workflow": FALLBACK_WORKFLOWS["research"],
            "usedFallback": True,
            "error": str(exc),
        }
