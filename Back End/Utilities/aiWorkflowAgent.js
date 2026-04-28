// Utilities/aiWorkflowAgent.js
// LangGraph AI agent: classifies client requests + generates custom workflows
// Uses Groq LLM with JSON mode for structured output

const { ChatGroq } = require('@langchain/groq');
const { StateGraph, END } = require('@langchain/langgraph');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const { z } = require('zod');

// ---------------------------------------------------------------------------
// Zod schemas for runtime validation of LLM output
// ---------------------------------------------------------------------------

const ClassifySchema = z.object({
  requestType: z.enum(['web_dev', 'app_dev', 'prototype', 'research', 'out_of_scope']),
  confidence: z.enum(['high', 'medium', 'low']),
  outOfScopeReason: z.string().nullable().optional()
});

const TaskSchema = z.object({
  taskName: z.string().min(1),
  team: z.enum(['research', 'design', 'development', 'testing', 'devops']),
  estimatedHours: z.number().min(1).max(500),
  requiredSkills: z.array(z.string()).min(1)
});

const WorkflowSchema = z.object({
  estimatedDuration: z.number().min(1),
  taskBreakdown: z.array(TaskSchema).min(1).max(10)
});

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const CLASSIFY_SYSTEM = `You are an AI assistant for a software services company called Intelliflow.
The company ONLY handles:
- Web Development (web_dev): websites, web apps, portals, dashboards, e-commerce platforms
- Mobile App Development (app_dev): iOS/Android/cross-platform apps, PWAs
- Software Prototyping (prototype): clickable mockups, proof-of-concept apps, UI demos
- Technical Research (research): market research, feasibility studies, tech stack analysis, competitive analysis

Out of scope examples: physical manufacturing, legal/accounting services, hardware products, medical devices, content writing, graphic design only (no software), real estate, food services.

You must respond ONLY with a valid JSON object. No explanation, no markdown, no extra text.`;

const buildClassifyPrompt = (title, description, requirements) => `A client has submitted the following software project request:

Title: ${title}
Description: ${description || 'Not provided'}
Requirements: ${Array.isArray(requirements) && requirements.length > 0 ? requirements.join(', ') : 'Not provided'}

Classify this request and respond ONLY with this exact JSON structure:
{
  "requestType": "web_dev" | "app_dev" | "prototype" | "research" | "out_of_scope",
  "confidence": "high" | "medium" | "low",
  "outOfScopeReason": "brief explanation if out_of_scope, otherwise null"
}`;

const WORKFLOW_SYSTEM = `You are a senior project planning AI for a software company called Intelliflow.
Your job is to generate a detailed, realistic project workflow in JSON format.

CRITICAL RULES:
- You must respond ONLY with a valid JSON object. No explanation, no markdown, no extra text.
- Every task must have exactly one team from this list: research | design | development | testing | devops
- estimatedHours must be between 20 and 200 per task
- requiredSkills must be specific technology skills (not generic words like "coding")
- Tasks must be in logical execution order (planning → design → development → testing → deployment)
- Generate between 4 and 7 tasks total
- estimatedDuration = sum of all task estimatedHours (approximately)`;

const buildWorkflowPrompt = (requestType, title, description, requirements) => {
  const typeDescriptions = {
    web_dev: 'Web Development project (websites, web apps, portals, dashboards)',
    app_dev: 'Mobile App Development project (iOS/Android/cross-platform)',
    prototype: 'Software Prototyping project (clickable mockups, proof-of-concept)',
    research: 'Technical Research project (market research, feasibility, tech analysis)'
  };

  return `Generate a project workflow for this ${typeDescriptions[requestType] || requestType}.

Client Request Details:
Title: ${title}
Description: ${description || 'Not provided'}
Requirements: ${Array.isArray(requirements) && requirements.length > 0 ? requirements.join(', ') : 'Not provided'}

Respond ONLY with this exact JSON structure:
{
  "estimatedDuration": <total hours as a number>,
  "taskBreakdown": [
    {
      "taskName": "<specific descriptive task name>",
      "team": "research" | "design" | "development" | "testing" | "devops",
      "estimatedHours": <number between 20 and 200>,
      "requiredSkills": ["skill1", "skill2", "skill3"]
    }
  ]
}

Generate 4-7 tasks appropriate and specific to this project. Be specific with task names based on the client's actual requirements.`;
};

// ---------------------------------------------------------------------------
// Fallback: return a template workflow when LLM fails
// ---------------------------------------------------------------------------
const FALLBACK_WORKFLOWS = {
  web_dev: {
    estimatedDuration: 320,
    taskBreakdown: [
      { taskName: 'Requirements Analysis & Planning', team: 'research', estimatedHours: 40, requiredSkills: ['Business Analysis', 'User Research', 'Documentation'] },
      { taskName: 'UI/UX Design', team: 'design', estimatedHours: 60, requiredSkills: ['Figma', 'UI/UX', 'Web Design', 'Wireframing'] },
      { taskName: 'Frontend Development', team: 'development', estimatedHours: 120, requiredSkills: ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript'] },
      { taskName: 'Backend Development', team: 'development', estimatedHours: 80, requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST API'] },
      { taskName: 'Testing & QA', team: 'testing', estimatedHours: 20, requiredSkills: ['Testing', 'QA', 'Jest', 'Debugging'] }
    ]
  },
  app_dev: {
    estimatedDuration: 400,
    taskBreakdown: [
      { taskName: 'Requirements Analysis & Planning', team: 'research', estimatedHours: 50, requiredSkills: ['Business Analysis', 'User Research', 'Mobile Strategy'] },
      { taskName: 'UI/UX Design', team: 'design', estimatedHours: 80, requiredSkills: ['Figma', 'UI/UX', 'Mobile Design', 'Prototyping'] },
      { taskName: 'Mobile App Development', team: 'development', estimatedHours: 180, requiredSkills: ['React Native', 'Mobile Development', 'JavaScript', 'TypeScript'] },
      { taskName: 'Backend API Development', team: 'development', estimatedHours: 70, requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST API'] },
      { taskName: 'Testing & QA', team: 'testing', estimatedHours: 20, requiredSkills: ['Mobile Testing', 'QA', 'Debugging'] }
    ]
  },
  prototype: {
    estimatedDuration: 120,
    taskBreakdown: [
      { taskName: 'Requirement Gathering', team: 'research', estimatedHours: 20, requiredSkills: ['User Research', 'Requirements Analysis'] },
      { taskName: 'Prototype Design', team: 'design', estimatedHours: 60, requiredSkills: ['Figma', 'Prototyping', 'UI/UX', 'Wireframing'] },
      { taskName: 'Interactive Prototype Development', team: 'development', estimatedHours: 40, requiredSkills: ['JavaScript', 'Prototyping', 'Frontend'] }
    ]
  },
  research: {
    estimatedDuration: 80,
    taskBreakdown: [
      { taskName: 'Research & Analysis', team: 'research', estimatedHours: 80, requiredSkills: ['Research', 'Analysis', 'Documentation'] }
    ]
  }
};

// ---------------------------------------------------------------------------
// Helper: parse JSON safely from LLM response
// ---------------------------------------------------------------------------
const safeParseLLMJson = (text) => {
  try {
    // Strip markdown code fences if LLM adds them despite instructions
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    // Try extracting first JSON object from text
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return null;
  }
};

// ---------------------------------------------------------------------------
// Build the LLM client — validated once at module load
// ---------------------------------------------------------------------------
const getLLMClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'gsk_your_groq_api_key_here') {
    throw new Error('GROQ_API_KEY is not configured. Please set it in config.env');
  }
  return new ChatGroq({
    apiKey,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    temperature: 0.2,      // Low temp for more predictable structured output
    maxTokens: 2048,
  });
};

// ---------------------------------------------------------------------------
// Node 1: classifyRequest
// ---------------------------------------------------------------------------
const classifyRequest = async (state) => {
  const { title, description, requirements } = state;
  const llm = getLLMClient();

  try {
    const response = await llm.invoke(
      [
        new SystemMessage(CLASSIFY_SYSTEM),
        new HumanMessage(buildClassifyPrompt(title, description, requirements))
      ],
      { response_format: { type: 'json_object' } }
    );

    const raw = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const parsed = safeParseLLMJson(raw);
    if (!parsed) {
      console.warn('[aiWorkflowAgent] classifyRequest: could not parse LLM JSON, defaulting to research');
      return { ...state, requestType: 'research', isOutOfScope: false, aiConfidence: 'low' };
    }

    // Validate with zod
    const result = ClassifySchema.safeParse(parsed);
    if (!result.success) {
      console.warn('[aiWorkflowAgent] classifyRequest: zod validation failed:', result.error.message);
      // Normalize requestType if recognizable
      const rt = parsed.requestType;
      const validTypes = ['web_dev', 'app_dev', 'prototype', 'research', 'out_of_scope'];
      const normalizedType = validTypes.includes(rt) ? rt : 'research';
      return {
        ...state,
        requestType: normalizedType,
        isOutOfScope: normalizedType === 'out_of_scope',
        outOfScopeReason: parsed.outOfScopeReason || null,
        aiConfidence: 'low'
      };
    }

    const { requestType, confidence, outOfScopeReason } = result.data;
    return {
      ...state,
      requestType,
      isOutOfScope: requestType === 'out_of_scope',
      outOfScopeReason: outOfScopeReason || null,
      aiConfidence: confidence
    };
  } catch (err) {
    console.error('[aiWorkflowAgent] classifyRequest error:', err.message);
    return {
      ...state,
      requestType: 'research',
      isOutOfScope: false,
      aiConfidence: 'low',
      error: err.message
    };
  }
};

// ---------------------------------------------------------------------------
// Node 2: generateWorkflow
// ---------------------------------------------------------------------------
const generateWorkflow = async (state) => {
  const { title, description, requirements, requestType } = state;
  const llm = getLLMClient();

  try {
    const response = await llm.invoke(
      [
        new SystemMessage(WORKFLOW_SYSTEM),
        new HumanMessage(buildWorkflowPrompt(requestType, title, description, requirements))
      ],
      { response_format: { type: 'json_object' } }
    );

    const raw = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const parsed = safeParseLLMJson(raw);
    if (!parsed) {
      console.warn('[aiWorkflowAgent] generateWorkflow: could not parse LLM JSON, using fallback template');
      return {
        ...state,
        workflow: FALLBACK_WORKFLOWS[requestType] || FALLBACK_WORKFLOWS.research,
        usedFallback: true
      };
    }

    // Validate with zod
    const result = WorkflowSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('[aiWorkflowAgent] generateWorkflow: zod validation failed, using fallback template');
      console.warn('Validation errors:', result.error.message);
      return {
        ...state,
        workflow: FALLBACK_WORKFLOWS[requestType] || FALLBACK_WORKFLOWS.research,
        usedFallback: true
      };
    }

    return {
      ...state,
      workflow: result.data,
      usedFallback: false
    };
  } catch (err) {
    console.error('[aiWorkflowAgent] generateWorkflow error:', err.message);
    return {
      ...state,
      workflow: FALLBACK_WORKFLOWS[requestType] || FALLBACK_WORKFLOWS.research,
      usedFallback: true,
      error: err.message
    };
  }
};

// ---------------------------------------------------------------------------
// Conditional edge: route after classification
// ---------------------------------------------------------------------------
const routeAfterClassify = (state) => {
  if (state.isOutOfScope) return END;
  return 'generateWorkflow';
};

// ---------------------------------------------------------------------------
// Build and compile the LangGraph state graph
// ---------------------------------------------------------------------------
const buildAgentGraph = () => {
  // Define state channels — each key can be updated by nodes
  const graphChannels = {
    // Inputs
    title: { value: (x, y) => y ?? x, default: () => '' },
    description: { value: (x, y) => y ?? x, default: () => '' },
    requirements: { value: (x, y) => y ?? x, default: () => [] },
    // Outputs from Node 1
    requestType: { value: (x, y) => y ?? x, default: () => null },
    isOutOfScope: { value: (x, y) => y ?? x, default: () => false },
    outOfScopeReason: { value: (x, y) => y ?? x, default: () => null },
    aiConfidence: { value: (x, y) => y ?? x, default: () => null },
    // Outputs from Node 2
    workflow: { value: (x, y) => y ?? x, default: () => null },
    usedFallback: { value: (x, y) => y ?? x, default: () => false },
    error: { value: (x, y) => y ?? x, default: () => null }
  };

  const graph = new StateGraph({ channels: graphChannels });

  graph.addNode('classifyRequest', classifyRequest);
  graph.addNode('generateWorkflow', generateWorkflow);

  graph.setEntryPoint('classifyRequest');

  graph.addConditionalEdges('classifyRequest', routeAfterClassify, {
    generateWorkflow: 'generateWorkflow',
    [END]: END
  });

  graph.addEdge('generateWorkflow', END);

  return graph.compile();
};

// Compile once at module load (lazy)
let _compiledGraph = null;
const getGraph = () => {
  if (!_compiledGraph) _compiledGraph = buildAgentGraph();
  return _compiledGraph;
};

// ---------------------------------------------------------------------------
// Public API: runAIWorkflowAgent
// ---------------------------------------------------------------------------
/**
 * Run the AI workflow agent for a client request.
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
  const timeoutMs = parseInt(process.env.AI_WORKFLOW_TIMEOUT_MS || '30000', 10);

  const agentRun = getGraph().invoke({
    title: title || '',
    description: description || '',
    requirements: Array.isArray(requirements) ? requirements : []
  });

  // Apply timeout — on timeout, fall back to template
  const timeoutRace = new Promise((resolve) => {
    setTimeout(() => {
      console.warn(`[aiWorkflowAgent] Timed out after ${timeoutMs}ms, using fallback`);
      resolve({
        title, description, requirements,
        requestType: 'research',
        isOutOfScope: false,
        outOfScopeReason: null,
        aiConfidence: 'low',
        workflow: FALLBACK_WORKFLOWS.research,
        usedFallback: true,
        error: 'Agent timed out'
      });
    }, timeoutMs);
  });

  const result = await Promise.race([agentRun, timeoutRace]);
  return result;
};

module.exports = { runAIWorkflowAgent };
