# prompts.py
# All LLM prompt strings for the Intelliflow AI workflow agent.
# These are direct Python translations of the prompts in aiWorkflowAgent.js.
# If you update prompts here, mirror the change in the JS fallback file too.

from typing import List

# ---------------------------------------------------------------------------
# Classification prompts
# ---------------------------------------------------------------------------

CLASSIFY_SYSTEM: str = """You are an AI assistant for a software services company called Intelliflow.
The company ONLY handles:
- Web Development (web_dev): websites, web apps, portals, dashboards, e-commerce platforms
- Mobile App Development (app_dev): iOS/Android/cross-platform apps, PWAs
- Software Prototyping (prototype): clickable mockups, proof-of-concept apps, UI demos
- Technical Research (research): market research, feasibility studies, tech stack analysis, competitive analysis

Out of scope examples: physical manufacturing, legal/accounting services, hardware products, medical devices, content writing, graphic design only (no software), real estate, food services.

You must respond ONLY with a valid JSON object. No explanation, no markdown, no extra text."""


def build_classify_prompt(title: str, description: str, requirements: List[str]) -> str:
    reqs_str = ", ".join(requirements) if requirements else "Not provided"
    desc_str = description if description else "Not provided"
    return f"""A client has submitted the following software project request:

Title: {title}
Description: {desc_str}
Requirements: {reqs_str}

Classify this request and respond ONLY with this exact JSON structure:
{{
  "requestType": "web_dev" | "app_dev" | "prototype" | "research" | "out_of_scope",
  "confidence": "high" | "medium" | "low",
  "outOfScopeReason": "brief explanation if out_of_scope, otherwise null"
}}"""


# ---------------------------------------------------------------------------
# Workflow generation prompts
# ---------------------------------------------------------------------------

WORKFLOW_SYSTEM: str = """You are a senior project planning AI for a software company called Intelliflow.
Your job is to generate a detailed, realistic project workflow in JSON format.

CRITICAL RULES:
- You must respond ONLY with a valid JSON object. No explanation, no markdown, no extra text.
- Every task must have exactly one team from this list: research | design | development | testing | devops
- estimatedHours must be between 20 and 200 per task
- requiredSkills must be specific technology skills (not generic words like "coding")
- Tasks must be in logical execution order (planning → design → development → testing → deployment)
- Generate between 4 and 7 tasks total
- estimatedDuration = sum of all task estimatedHours (approximately)"""

_TYPE_DESCRIPTIONS: dict = {
    "web_dev": "Web Development project (websites, web apps, portals, dashboards)",
    "app_dev": "Mobile App Development project (iOS/Android/cross-platform)",
    "prototype": "Software Prototyping project (clickable mockups, proof-of-concept)",
    "research": "Technical Research project (market research, feasibility, tech analysis)",
}


def build_workflow_prompt(
    request_type: str, title: str, description: str, requirements: List[str]
) -> str:
    type_desc = _TYPE_DESCRIPTIONS.get(request_type, request_type)
    reqs_str = ", ".join(requirements) if requirements else "Not provided"
    desc_str = description if description else "Not provided"
    return f"""Generate a project workflow for this {type_desc}.

Client Request Details:
Title: {title}
Description: {desc_str}
Requirements: {reqs_str}

Respond ONLY with this exact JSON structure:
{{
  "estimatedDuration": <total hours as a number>,
  "taskBreakdown": [
    {{
      "taskName": "<specific descriptive task name>",
      "team": "research" | "design" | "development" | "testing" | "devops",
      "estimatedHours": <number between 20 and 200>,
      "requiredSkills": ["skill1", "skill2", "skill3"]
    }}
  ]
}}

Generate 4-7 tasks appropriate and specific to this project. Be specific with task names based on the client's actual requirements."""
