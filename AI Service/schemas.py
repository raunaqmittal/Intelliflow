# schemas.py
# Pydantic v2 models for request validation and response serialization.
# These replace the Zod schemas (ClassifySchema, TaskSchema, WorkflowSchema)
# from the original aiWorkflowAgent.js.

from __future__ import annotations
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# FastAPI request body
# ---------------------------------------------------------------------------

class AgentInput(BaseModel):
    """Input to POST /run-agent — mirrors the JS runAIWorkflowAgent() arguments."""

    title: str = Field(..., min_length=1, description="Request title")
    description: str = Field(default="", description="Detailed description")
    requirements: List[str] = Field(
        default_factory=list, description="List of requirement strings"
    )


# ---------------------------------------------------------------------------
# LLM output validation models (internal — used in agent.py)
# ---------------------------------------------------------------------------

class ClassifyLLMOutput(BaseModel):
    """Validates the JSON returned by the classification LLM call."""

    requestType: Literal["web_dev", "app_dev", "prototype", "research", "out_of_scope"]
    confidence: Literal["high", "medium", "low"]
    outOfScopeReason: Optional[str] = None


class TaskItem(BaseModel):
    """A single task in the generated workflow — also used in the API response."""

    taskName: str = Field(..., min_length=1)
    team: Literal["research", "design", "development", "testing", "devops"]
    estimatedHours: int = Field(..., ge=1, le=500)
    requiredSkills: List[str] = Field(..., min_length=1)


class WorkflowLLMOutput(BaseModel):
    """Validates the JSON returned by the workflow generation LLM call."""

    estimatedDuration: int = Field(..., ge=1)
    taskBreakdown: List[TaskItem] = Field(..., min_length=1, max_length=10)


# ---------------------------------------------------------------------------
# FastAPI response body
# ---------------------------------------------------------------------------

class WorkflowOutput(BaseModel):
    """Workflow embedded in the agent response — identical shape to the JS output."""

    estimatedDuration: int
    taskBreakdown: List[TaskItem]


class AgentOutput(BaseModel):
    """
    POST /run-agent response.
    Shape is intentionally identical to the JS runAIWorkflowAgent() return value
    so requestController.js needs zero changes.
    """

    requestType: str
    isOutOfScope: bool
    outOfScopeReason: Optional[str] = None
    aiConfidence: Optional[str] = None
    workflow: Optional[WorkflowOutput] = None
    usedFallback: bool = False
    error: Optional[str] = None
