// Utilities/aiWorkflowAgent.js
// Thin HTTP proxy to the Python FastAPI LangGraph agent microservice.
// The Python service handles all LangGraph / Groq LLM logic.
//
// Function signature and return shape are IDENTICAL to the old JS implementation
// so requestController.js needs zero changes.
//
// Environment variables:
//   AI_AGENT_URL          — base URL of the Python service (default: http://localhost:8000)
//   AI_AGENT_INTERNAL_KEY — shared secret sent as X-Internal-Key header
//   AI_WORKFLOW_TIMEOUT_MS — axios request timeout in ms (default: 35000)

const axios = require('axios');

const AGENT_URL = (process.env.AI_AGENT_URL || 'http://localhost:8000').replace(/\/$/, '');
const TIMEOUT_MS = parseInt(process.env.AI_WORKFLOW_TIMEOUT_MS || '35000', 10);
const INTERNAL_KEY = process.env.AI_AGENT_INTERNAL_KEY || '';

// ---------------------------------------------------------------------------
// Last-resort fallback used ONLY when the Python service is completely
// unreachable (network error, service down, etc.).
// This is intentionally NOT shared with workflowGenerator.js — that file
// holds rich per-type templates (web_dev, app_dev, prototype, research)
// used for the rule-based fallback path. This fallback is a bare-minimum
// safety net that runs when even the rule-based path cannot be reached.
// ---------------------------------------------------------------------------
const LAST_RESORT_FALLBACK = {
  requestType: 'research',
  isOutOfScope: false,
  outOfScopeReason: null,
  aiConfidence: 'low',
  workflow: {
    estimatedDuration: 80,
    taskBreakdown: [
      {
        taskName: 'Research & Analysis',
        team: 'research',
        estimatedHours: 80,
        requiredSkills: ['Research', 'Analysis', 'Documentation']
      }
    ]
  },
  usedFallback: true
};

// ---------------------------------------------------------------------------
// Public API — called by requestController.js
// ---------------------------------------------------------------------------

/**
 * Run the AI workflow agent for a client request.
 * Calls the Python FastAPI microservice and returns its response.
 * On any network/service error, returns LAST_RESORT_FALLBACK so the
 * request flow never crashes.
 *
 * @param {{ title: string, description: string, requirements: string[] }} input
 * @returns {Promise<{
 *   requestType: string,
 *   isOutOfScope: boolean,
 *   outOfScopeReason: string|null,
 *   aiConfidence: string,
 *   workflow: { estimatedDuration: number, taskBreakdown: Array } | null,
 *   usedFallback: boolean,
 *   error: string|null
 * }>}
 */
const runAIWorkflowAgent = async ({ title, description, requirements }) => {
  try {
    const { data } = await axios.post(
      `${AGENT_URL}/run-agent`,
      {
        title: title || '',
        description: description || '',
        requirements: Array.isArray(requirements) ? requirements : []
      },
      {
        timeout: TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': INTERNAL_KEY
        }
      }
    );

    return data;

  } catch (err) {
    // Log enough context to diagnose issues without leaking secrets
    const status = err.response?.status;
    const detail = err.response?.data?.detail || err.message;
    console.error(
      `[aiWorkflowAgent] Python service error — status=${status || 'N/A'} detail="${detail}" url="${AGENT_URL}"`
    );

    return { ...LAST_RESORT_FALLBACK, error: detail || err.message };
  }
};

module.exports = { runAIWorkflowAgent };
