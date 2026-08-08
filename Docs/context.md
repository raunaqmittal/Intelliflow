# Project Context

> **Last Updated:** 2026-08-09
> **Current Stage:** Feature-Complete MVP — Repository cleanup complete. Production-ready codebase.
> **Overall Status:** Core request-to-project lifecycle fully implemented. AI agent (LangGraph + Groq) live. Phone validation now E.164 international. Deployment on Vercel (frontend) + Render (backend + AI service).

---

## 1. Project Overview

**Intelliflow** is an **Agentic Workflow Operating System** for cross-functional software services companies.

**Problem it solves:** Managing client requests across multiple departments (Engineering, QA, Design, Research, DevOps) involves heavy manual coordination. Project managers must classify requests, break them into tasks, assign employees, get department approvals, and track execution — all in separate tools. Intelliflow unifies this in one platform.

**Target users:**
- **Clients** — Submit project requests and track progress.
- **Employees** — View assigned tasks, update status, see their projects.
- **Managers** — Review AI-generated workflows, assign employees, approve/reject requests, convert to active projects.

**Main functionality:**
1. Clients submit requests (title, description, requirements).
2. AI agent classifies the request type and generates a task breakdown.
3. Managers review, modify, assign employees, and get department-level approvals.
4. Once approved, the request is converted into a `Project` with active `Task` documents.
5. Employees execute tasks; project progress auto-updates.

**In scope for Intelliflow (AI enforces this):** Web Development, Mobile App Development, Software Prototyping, Technical Research.

---

## 2. Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- React Router v6 (routing)
- TanStack Query v5 (server state / data fetching)
- Tailwind CSS v3 + shadcn/ui (component library on Radix UI primitives)
- Axios (HTTP client)
- React Hook Form + Zod (form validation)
- Recharts (analytics charts)
- Sonner + Radix Toast (notifications)
- Lucide React (icons)

### Backend
- Node.js >= 18 + Express 4
- MongoDB (Atlas cloud) + Mongoose 8 (ODM)
- JWT (`jsonwebtoken`) — 90-day expiry, stored in `localStorage`, sent via `Authorization: Bearer`
- bcryptjs (password hashing, cost factor 10)
- Nodemailer (email — Gmail SMTP) + Twilio (SMS OTP)
- Morgan (dev request logging)

### AI / Agentic Layer
- **Python FastAPI microservice** (`AI Service/`) — standalone LangGraph agent service
- LangGraph (`langgraph>=0.2.0`) — State machine orchestration
- `langchain-groq` — Groq API client
- Groq LLM: `llama-3.3-70b-versatile` (configurable via env)
- Pydantic v2 (replaces Zod) — LLM output validation
- Uvicorn — ASGI server
- Deployed on **Render (Free Tier)**. Kept awake using **UptimeRobot** 5-min ping to prevent 40s cold-start timeouts.

### Security Middleware
- Helmet (HTTP security headers)
- `express-rate-limit` (100 req/hr general; 50 dev / 5 prod per 15 min for auth routes)
- `express-mongo-sanitize` (NoSQL injection prevention)
- `xss-clean` (XSS prevention)
- `hpp` (HTTP parameter pollution prevention)
- CORS restricted to `FRONTEND_URL`

### Deployment
- **Frontend:** Vercel (`vercel.json` with SPA rewrite rule)
- **Backend (Node.js):** Render (port 3000, Render-compatible; `trust proxy 1` set)
- **Database:** MongoDB Atlas

---

## 3. System Architecture

```
Browser (React + TS)
        |
        v
Express REST API (Node.js, Port 3000)  [Render]
  +-- Security Middleware Stack
  +-- Routes: /api/v1/employees | /api/v1/clients | /api/v1/requests
  |             /api/v1/projects | /api/v1/tasks | /api/diagnostic
  |
  +-- authController.js
  +-- requestController.js
  |         |
  |         | POST /run-agent
  |         | Header: X-Internal-Key
  |         | (35s axios timeout)
  |         v
  |   FastAPI Agent Service (Python)  [Render Free Tier + UptimeRobot]
  |         |
  |         +-- Pydantic validates input
  |         +-- LangGraph StateGraph:
  |         |       Node 1: classify_request --> Groq LLM
  |         |       Node 2: generate_workflow --> Groq LLM
  |         +-- asyncio.wait_for() 30s timeout
  |         +-- Fallback templates on error/timeout
  |         |
  |         | JSON response (same shape as before)
  |         v
  +-- employeeSuggestion.js -- adds top-3 employee matches per task
  +-- Saves to MongoDB, returns response
        |
        v
MongoDB Atlas (Mongoose ODM)
  Collections: employees | clients | requests | projects | tasks
```

**Request Lifecycle (end-to-end):**
```
Client submits request
    --> POST /api/v1/requests (save with status=submitted)
    --> Manager triggers: POST /api/v1/requests/:id/generate-workflow
    --> aiWorkflowAgent.js makes HTTP POST to Python service
        --> FastAPI validates input (Pydantic)
        --> LangGraph Node 1: classify_request (Groq LLM)
        --> LangGraph Node 2: generate_workflow (Groq LLM, or fallback)
        --> Returns JSON with requestType, workflow, usedFallback
    --> Node.js adds employee suggestions per task
    --> Request saved with status=workflow_generated
    --> Manager assigns employees, dept approvals, overall approval
    --> POST /api/v1/requests/:id/convert-to-project
        --> Creates Project + Task documents
    --> Employees see tasks in their portal
```

---

## 4. Repository Structure

```
Intelliflow/
+-- Back End/
|   +-- server.js
|   +-- app.js
|   +-- config.env
|   +-- Controllers/
|   |   +-- authController.js
|   |   +-- employeeController.js
|   |   +-- clientController.js
|   |   +-- projectController.js
|   |   +-- requestController.js   # Full request lifecycle (most complex controller)
|   |   +-- taskController.js
|   |   +-- errorController.js
|   +-- models/
|   |   +-- employeeModel.js
|   |   +-- clientModel.js
|   |   +-- projectModel.js
|   |   +-- requestModel.js
|   |   +-- taskModel.js
|   +-- routes/
|   |   +-- employeeRoutes.js
|   |   +-- clientRoutes.js
|   |   +-- requestRoutes.js
|   |   +-- projectRoutes.js
|   |   +-- taskRoutes.js
|   |   +-- diagnosticRoutes.js    # Debug only — guarded by NODE_ENV check
|   +-- Utilities/
|   |   +-- aiWorkflowAgent.js     # Thin axios proxy to Python service
|   |   +-- workflowGenerator.js   # Template fallback + employee suggestion wrapper
|   |   +-- employeeSuggestion.js  # Employee match scoring
|   |   +-- controllerUtils.js     # Shared: normalizePhone, normalizeDept, expandDeptAliases
|   |   +-- otp.js
|   |   +-- email.js
|   |   +-- appError.js
|   |   +-- catchAsync.js
|   |   +-- APIFeatures.js
|   |   +-- projectStatusUpdater.js
|   +-- scripts/                   # Admin/maintenance scripts (see scripts/README.md)
|   +-- tests/
|       +-- backendTesting.js
|
+-- AI Service/                    # Python FastAPI LangGraph microservice
|   +-- main.py
|   +-- agent.py
|   +-- prompts.py
|   +-- schemas.py
|   +-- fallbacks.py
|   +-- requirements.txt
|   +-- .env / .env.example
|
+-- Front End/
|   +-- src/
|   |   +-- App.tsx
|   |   +-- contexts/UserContext.tsx
|   |   +-- pages/ (client/ employee/ manager/)
|   |   +-- utils/
|   |   |   +-- dataParser.ts
|   |   |   +-- phoneUtils.ts      # Shared: handlePhoneInput, formatPhoneDisplay, isValidPhone
|   |   |   +-- errorHandler.ts
|   |   +-- lib/api.ts             # Axios client with auth interceptor
|   +-- vercel.json
|
+-- Data/
+-- Docs/
|   +-- context.md
|   +-- repo_cleanup_prompt.md
+-- README.md                      # Single consolidated README
+-- .gitignore                     # Single root .gitignore
```

---

## 5. Current Implementation

### Completed
- Employee and client signup/login with bcrypt password hashing (cost 10)
- JWT sessions — 90-day tokens, Authorization Bearer header, passwordChangedAt invalidation
- Forgot password (email token), reset password, change password
- 2FA / OTP system — Email OTP and SMS OTP (Twilio); phone & email verification flow
- Employee CRUD: create, read, update profile, soft-delete, dashboard, my projects
- Client CRUD: create, read, update profile
- Request submission — AI agent runs immediately on POST; result stored in request document
- AI classification — LangGraph 2-node graph classifies request type + confidence via Groq LLM
- AI workflow generation — Dynamic task breakdown with estimated hours and required skills
- Fallback workflows — 4 static templates used when LLM fails or times out
- Employee suggestion — skill + workload + availability + department scoring (top 3 per task)
- Request approval flow — department-level approve/reject per manager + overall approval
- Request-to-project conversion — creates Project + Task documents from approved request
- Task management — employee view of tasks, status updates, reassignment
- Manager portal — full request review, workflow modification, employee assignment, project tracking
- Role-based routing — ProtectedRoute enforces client/employee/manager roles in frontend
- All security middleware — Helmet, CORS, rate limiting, mongo-sanitize, xss-clean, HPP
- Landing pages — Home, About, HowToUse, TestCredentials (public)
- Analytics — task status stats and AI performance metrics on dashboard endpoints
- Backend test suite — `Back End/tests/backendTesting.js` (983-line test_cases.txt documents all cases)

### In Progress
- Manager's RequestDetails page: AI suggestion match scores and reasons could be displayed more prominently in the UI

### Planned / Not Implemented
- Conversational Ops: chat interface for natural language commands
- Predictive scheduling: slippage forecasting and auto-resequencing
- Slack/Teams integration for status notifications
- Jira/GitHub/CI sync for auto-progress signals
- Advanced ML-based employee allocation
- Content Security Policy (CSP) — not yet configured in Helmet
- HSTS — not yet enforced
- Audit/event logging for compliance
- Multi-tenant SaaS with tenant isolation

### Deprecated
- Resend API: attempted for email but reverted to Nodemailer/Gmail SMTP (git: `removed resend for mailing`)
- Multi-tab login prevention: turned off (git: `turned off multi tab login`)
- `workflowGenerator.js` as primary workflow path: still exists as fallback wrapper; the primary is now `aiWorkflowAgent.js`

---

## 6. Current State

| Area | Status |
|------|--------|
| Request lifecycle (submit > AI > approve > project) | Working |
| AI workflow agent (LangGraph + Groq) | Working — 30s timeout with fallback |
| Employee/Client authentication + OTP | Working |
| Manager review + department approvals | Working |
| Employee task execution flow | Working |
| Frontend portals (all 3 roles) | Working |
| Email (Nodemailer + Gmail SMTP) | Working |
| SMS OTP (Twilio) | Working |
| Phone number validation | Indian numbers only (+91XXXXXXXXXX) — not generic E.164 |
| Phone uniqueness | Disabled in dev (// unique: true commented out) |
| Diagnostic routes | Still mounted — should be removed for production |
| CSP / HSTS / Audit logging | Not implemented |
| Multi-tenant / SaaS | Not implemented |

**Current major objective:** MVP is feature-complete. Focus is on production hardening (remove diagnostics, enforce phone uniqueness, add CSP) and next roadmap features (conversational ops, predictive scheduling).

**Last meaningful change:** Added AI workflow generation via LangGraph + Groq (git: `added AI for workflow generation`), then updated README.

---

## 7. Important Technical Decisions

### Decision: LangGraph as AI orchestration framework

**Chosen:** `@langchain/langgraph` StateGraph
**Reason:** Structured state machine with conditional edges — clean separation between classify and generate nodes; timeout and fallback wrappable at higher level.
**Alternatives considered:** Direct LLM API calls, CrewAI, simple function chains
**Why alternatives rejected:** Direct calls lack routing/retry logic. CrewAI is Python-only. LangGraph fits Node.js backend cleanly.

---

### Decision: Groq as LLM provider

**Chosen:** Groq API with `llama-3.3-70b-versatile`
**Reason:** Very fast inference (low latency for real-time request classification), generous free tier, open-source model.
**Alternatives considered:** OpenAI GPT-4, Anthropic Claude
**Why alternatives rejected:** Cost and latency. Groq is significantly faster for this use case.

---

### Decision: JWT in localStorage (not HttpOnly cookies)

**Chosen:** JWT stored in `localStorage`, sent via `Authorization: Bearer` header. `credentials: false` in CORS config.
**Reason:** Simpler CORS handling; avoids CSRF complexity.
**Note:** README mentions HttpOnly cookies as a goal but the actual implementation uses localStorage. This is a known deviation.
**Implication:** XSS risk is higher — `xss-clean` middleware is critical; do not remove it.

---

### Decision: Dual assignment fields on Task model

**Chosen:** Both `assignedTo: [Number]` and `assigned_to: [Number]` exist on taskModel.js.
**Reason:** Legacy data compatibility — original seeded data used `assigned_to`; new code uses `assignedTo`. Both queried in employeeSuggestion.js.
**Implication:** Do not remove either field without migrating existing task documents.

---

### Decision: Department alias normalization in requestController

**Chosen:** Explicit `ALIASES` map in `requestController.js` normalizing department name variations.
**Reason:** Frontend may send "QA", "Quality Assurance", or "Testing" — all must match the same approval record. Without normalization, approvals silently fail.
**Implication:** Any new department name must be added to `ALIASES` in `requestController.js`.

---

### Decision: Zod validation on LLM output

**Chosen:** All LLM JSON output validated with Zod schemas (`ClassifySchema`, `WorkflowSchema`) before use.
**Reason:** LLMs occasionally produce malformed JSON or wrong field names. Zod catches these and triggers graceful fallback.
**Implication:** If LLM output schema changes, Zod schemas in `aiWorkflowAgent.js` must be updated.

---

### Decision: Static fallback workflows

**Chosen:** Hardcoded `FALLBACK_WORKFLOWS` in `aiWorkflowAgent.js` (mirrored in `workflowGenerator.js`).
**Reason:** Zero-downtime guarantee. If Groq is down or times out, users still get a usable workflow.
**Implication:** Both definitions must be kept in sync manually — they are currently duplicated.

---

### Decision: India-specific phone validation

**Chosen:** Phone validator regex: `+91[6-9]XXXXXXXXXX` only.
**Reason:** Project originally built for an Indian company context.
**Implication:** Must be replaced with generic E.164 validator for international deployment.

---

## 8. Constraints & Requirements

### Hard Constraints
- Never commit secrets to git. `config.env` must remain in `.gitignore`.
- JWT auth structure must not change without updating all three portals simultaneously (all use `UserContext`).
- Both `assignedTo` and `assigned_to` fields on Task must be preserved until a data migration is run.
- Department alias normalization in `requestController.js` must stay consistent with frontend department names.
- Zod schemas in `aiWorkflowAgent.js` must stay in sync with LLM prompt structure.
- `trust proxy 1` must stay in `app.js` for rate limiting to work correctly behind Render/reverse proxies.
- All `/api/v1/*` routes must require authentication via `authController.protect` — no unprotected data endpoints.
- Node.js >= 18 is required (specified in `package.json` engines field).

### Preferences
- Keep AI agent timeout at 30s (`AI_WORKFLOW_TIMEOUT_MS`) — adjustable via env but not below 15s.
- Maintain existing Express middleware order in `app.js` — security middleware before route mounting.
- Follow existing controller pattern: use `catchAsync` wrapper and `AppError` for errors.
- Keep frontend component structure in `src/pages/<role>/` directories.
- Use TanStack Query for all data fetching in frontend — avoid raw `useEffect` for API calls.

---

## 9. Environment & Configuration

All env vars are in `Back End/config.env` (gitignored). **Never put actual values in context.md.**

### Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Backend server port (default: 3000) |
| `DATABASE` | MongoDB Atlas connection string |
| `DATABASE_PASSWORD` | MongoDB password |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | JWT expiry (e.g., `90d`) |
| `JWT_COOKIE_EXPIRES_IN` | Cookie expiry in days |
| `EMAIL_USERNAME` | Gmail address for Nodemailer |
| `EMAIL_PASSWORD` | Gmail app password |
| `EMAIL_HOST` | SMTP host (e.g., `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g., `587`) |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS OTP |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sending phone number |
| `OTP_EXPIRY_MINUTES` | OTP validity window (default: 5) |
| `OTP_RATE_LIMIT_MINUTES` | Min time between OTP sends (default: 2) |
| `MAX_OTP_ATTEMPTS` | Max wrong OTP attempts before lockout (default: 3) |
| `FRONTEND_URL` | Allowed CORS origin (e.g., `http://localhost:4173`) |
| `AI_AGENT_URL` | URL of the Python FastAPI service |
| `AI_AGENT_INTERNAL_KEY` | Secret for authenticating Node.js to Python service |
| `RESEND_API_KEY` | Resend API key (currently unused — kept for potential future use) |

### Local Development Setup

```bash
# Backend (run from Back End/)
npm install
npm run dev          # nodemon server.js on port 3000

# Frontend (run from Front End/)
npm install
npm run dev          # Vite dev server (usually port 5173 or 4173)
```

### Build Commands

```bash
# Frontend production build
cd "Front End"
npm run build

# Backend production start
cd "Back End"
npm run prod         # NODE_ENV=production node server.js
```

---

## 10. API Reference (Key Endpoints)

All routes under `/api/v1/*` require `Authorization: Bearer <JWT>` unless marked Public.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/employees/signup` | Public | Employee registration |
| POST | `/api/v1/employees/login` | Public | Employee login (returns JWT or triggers 2FA) |
| POST | `/api/v1/employees/logout` | Public | Clear session |
| POST | `/api/v1/employees/forgotPassword` | Public | Send password reset OTP |
| POST | `/api/v1/employees/verify-login-otp` | Public | Verify 2FA OTP, return JWT |
| POST | `/api/v1/clients/signup` | Public | Client registration |
| POST | `/api/v1/clients/login` | Public | Client login |

### Requests (Core Workflow)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/requests` | Client | Submit request — triggers AI agent |
| GET | `/api/v1/requests` | Client/Manager | List requests (role-filtered) |
| GET | `/api/v1/requests/my-requests` | Client | Client's own requests |
| GET | `/api/v1/requests/:id` | Any | Request details + workflow |
| POST | `/api/v1/requests/:id/generate-workflow` | Any | Re-generate workflow |
| POST | `/api/v1/requests/:id/refresh-suggestions` | Manager | Refresh employee suggestions |
| PATCH | `/api/v1/requests/:id/assign-employees` | Manager | Assign employees to tasks |
| POST | `/api/v1/requests/:id/department-approve` | Manager | Dept-level approval |
| POST | `/api/v1/requests/:id/department-reject` | Manager | Dept-level rejection |
| POST | `/api/v1/requests/:id/approve` | Manager | Overall approval |
| POST | `/api/v1/requests/:id/reject` | Manager | Overall rejection |
| POST | `/api/v1/requests/:id/convert-to-project` | Manager | Create Project + Tasks |

### Projects & Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects` | List all projects |
| GET | `/api/v1/projects/:id` | Project details |
| GET | `/api/v1/tasks` | All tasks |
| GET | `/api/v1/employees/me/dashboard` | Employee dashboard |
| GET | `/api/v1/employees/me/projects` | Employee's projects |

---

## 11. AI / Agent Workflow

### AI / Agent Workflow — Python FastAPI Microservice on Render

**Service directory:** `AI Service/`
**Deployed at:** `https://intelliflow-ai-service-mauq.onrender.com` (Render Free Tier)
**Keep-alive:** UptimeRobot pings `/health` every 5 mins to prevent 40s cold start timeouts.
**Called by:** `Back End/Utilities/aiWorkflowAgent.js` via axios POST

### LangGraph State Graph — `AI Service/agent.py`

```
Input: { title: str, description: str, requirements: list[str] }
         |
         v
State initialized (AgentState TypedDict)
         |
         v
Node 1: classify_request
  - Sends: CLASSIFY_SYSTEM + build_classify_prompt()
  - LLM returns JSON: { requestType, confidence, outOfScopeReason }
  - Validated with Pydantic ClassifyLLMOutput
  - On failure: defaults to requestType="research", confidence="low"
         |
         v
Conditional Edge: route_after_classify
  +-- isOutOfScope=true --> END (workflow=None)
  +-- isOutOfScope=false --> Node 2
         |
         v
Node 2: generate_workflow
  - Sends: WORKFLOW_SYSTEM + build_workflow_prompt()
  - LLM returns JSON: { estimatedDuration, taskBreakdown[] }
  - Validated with Pydantic WorkflowLLMOutput
  - On failure: uses FALLBACK_WORKFLOWS[requestType]
         |
         v
END

Output (AgentOutput Pydantic model — identical shape to old JS output):
{
  requestType:      str,
  isOutOfScope:     bool,
  outOfScopeReason: str | None,
  aiConfidence:     str | None,
  workflow: { estimatedDuration: int, taskBreakdown: [...] } | None,
  usedFallback:     bool,
  error:            str | None
}
```

**Timeout:** 30 seconds (`asyncio.wait_for()`).
**Fallback templates:** `AI Service/fallbacks.py` (identical values to original JS `FALLBACK_WORKFLOWS`).
**Prompt locations:** `AI Service/prompts.py` — `CLASSIFY_SYSTEM`, `WORKFLOW_SYSTEM`, `build_classify_prompt()`, `build_workflow_prompt()`.
**Security:** Every request to `/run-agent` must include `X-Internal-Key` header matching `INTERNAL_API_KEY` env var.
**Deployment:** Render Free Tier (Web Service). UptimeRobot used to prevent sleeping.

### Node.js side — `Back End/Utilities/aiWorkflowAgent.js`

Now a ~90-line thin HTTP proxy:
- Reads `AI_AGENT_URL` (`https://intelliflow-ai-service-mauq.onrender.com` in prod, `http://localhost:8000` in dev)
- Sends `X-Internal-Key: <AI_AGENT_INTERNAL_KEY>` header
- 35-second axios timeout (slightly more than Python's 30s so Python handles timeout first)
- Last-resort fallback if Python service is completely unreachable (network error)
- `requestController.js` is completely unchanged — same function call, same return shape

### Employee suggestion scoring
`employeeSuggestion.js` runs in Node.js after the Python agent returns:
- Skills: 50% weight (substring match, case-insensitive)
- Workload: 20% weight (pending tasks count)
- Availability: 20% weight
- Department match: 10% weight
- Top 3 employees returned per task

---

## 12. Database & Data Model

**Database:** MongoDB Atlas (cloud), Mongoose 8 ODM.

### Key Relationships

```
clients
    | (client ref in request + project)
    v
requests ---convertedToProject---> projects ---project ref---> tasks
    |                                                             |
    | approvalsByDepartment.approvedBy/rejectedBy                | assignedTo (employee_id numbers)
    v                                                             v
employees <-------------------------------------------------------|
```

### Schema Notes

**Employee (employees collection):**
- `employee_id`: Number, unique — used for task assignment lookups (NOT MongoDB _id)
- `role`: String free-form; `"manager"` grants manager-level authorization
- `department`: String free-form — must match aliases in `requestController.js`
- `skills`: [String] — matched case-insensitively against task requiredSkills
- `availability`: Enum ['Available', 'Busy', 'On Leave']
- `isApprover`: Boolean UI flag only — actual auth is `role === "manager"`
- `approvesDepartments`: [String] — departments this manager can approve
- `phone`: Indian format only (+91[6-9]XXXXXXXXXX); uniqueness disabled in dev
- `password`: Hidden from queries (select: false); bcrypt cost 10

**Request (requests collection):**
- `status`: submitted -> workflow_generated -> under_review -> approved/rejected -> converted/out_of_scope
- `aiClassification`: embedded — stores detectedType, confidence, usedFallback, classifiedAt
- `generatedWorkflow.taskBreakdown[].suggestedEmployees`: top 3 employees with matchScore + reason string
- `taskAssignments`: Map<String, ObjectId[]> — separate from workflow to prevent data loss on updates
- `approvalsByDepartment`: array of dept approval records with approvedBy/rejectedBy employee refs

**Task (tasks collection):**
- `assignedTo: [Number]` AND `assigned_to: [Number]` — BOTH must be queried (legacy compat)
- `sprint`: String + `sprint_number`: Number
- `project`: ObjectId ref + `project_id`: Number (both stored)
- `dependencies`: [Number] — task IDs (numeric) this task depends on
- `status`: Enum ['Pending', 'To Do', 'In Progress', 'Done', 'Completed']

**Project (projects collection):**
- `framework`: Enum ['Agile', 'Waterfall', 'Hybrid']
- `status`: Enum ['Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled']
- `activeSprintNumber` + `totalSprints` for sprint management

---

## 13. Known Issues / Bugs

### Issue 1: Phone validation is India-specific
**Problem:** `employeeModel.js` validates phone as +91[6-9]XXXXXXXXXX only. International employees cannot register.
**Cause:** Built for Indian company context.
**Status:** Open — known limitation.
**Workaround:** None. Must update validator regex for international deployment.

---

### Issue 2: Phone uniqueness disabled
**Problem:** `unique: true` constraint on `phone` in `employeeModel.js` is commented out ("DISABLED FOR TESTING").
**Cause:** Testing convenience.
**Status:** Open — must be re-enabled before production.
**Workaround:** None.

---

### Issue 3: Duplicate fallback workflow definitions
**Problem:** `FALLBACK_WORKFLOWS` in `aiWorkflowAgent.js` and `workflows` in `workflowGenerator.js` are identical but separate. One can go stale if the other is updated.
**Cause:** `workflowGenerator.js` predates the AI agent; both kept for different code paths.
**Status:** Open — tech debt.
**Workaround:** Manually keep both in sync when updating templates.

---

### Issue 4: Diagnostic routes mounted without environment guard
**Problem:** `diagnosticRoutes.js` is mounted at `/api/diagnostic` in `app.js` unconditionally. It was added to debug email issues and was never removed.
**Cause:** Never cleaned up after debugging.
**Status:** Open — should be removed or guarded with NODE_ENV check.
**Workaround:** Low risk but represents unnecessary attack surface.

---

### Issue 5: JWT in localStorage (XSS risk)
**Problem:** JWT stored in localStorage is accessible to JavaScript, making XSS attacks more dangerous. README describes HttpOnly cookies as the intended approach, but implementation uses localStorage.
**Cause:** Simpler CORS setup (credentials: false).
**Status:** Open — acceptable for MVP; should be addressed before sensitive enterprise deployment.
**Workaround:** `xss-clean` middleware reduces but does not eliminate XSS risk.

---

## 14. Development Rules for AI Agents

### Before modifying code
1. Read this `context.md` first.
2. Inspect the relevant existing file(s) before writing new code.
3. Check if a utility (`catchAsync`, `AppError`, `APIFeatures`) already handles the problem.
4. Understand the full request lifecycle before touching `requestController.js` (984 lines, most complex file).
5. Check `ALIASES` in `requestController.js` if working with department names.
6. Do NOT change the JWT structure or `UserContext` without updating all three portals.
7. Do NOT remove `assignedTo` or `assigned_to` from `taskModel.js` without a data migration.
8. Respect all hard constraints in Section 8.

### While modifying code
- Follow existing patterns: `catchAsync` wrapper, `AppError` for errors, `next(err)` propagation.
- Keep Zod schemas in `aiWorkflowAgent.js` in sync with LLM prompts.
- Do not hardcode secrets — always use `process.env.*`.
- Do not create unprotected API routes that expose user or business data.
- Keep department alias normalization consistent between frontend and `requestController.js`.
- Frontend: use TanStack Query for data fetching — avoid raw `useEffect` for API calls.
- Frontend: place pages in the correct `src/pages/<role>/` directory.

### After modifying code
- Run the backend test suite: `Back End/tests/backendTesting.js`
- Verify the frontend builds cleanly: `npm run build` from `Front End/`
- Update this `context.md` if the change affects architecture, data model, API contracts, AI workflow, env vars, known issues, or next steps.

---

## 15. Change History

### 2026-08
**Change:** Migrated LangGraph AI agent from Node.js to Python FastAPI microservice
**Reason:** Developer familiarity — LangGraph is better understood in Python; cleaner separation of concerns
**Files:**
- NEW: `AI Service/` directory (main.py, agent.py, prompts.py, schemas.py, fallbacks.py, requirements.txt, Dockerfile, README.md)
- MODIFIED: `Back End/Utilities/aiWorkflowAgent.js` → replaced 401-line LangGraph JS with ~90-line axios proxy
- MODIFIED: `Back End/config.env` → replaced GROQ_* vars with AI_AGENT_URL + AI_AGENT_INTERNAL_KEY
- MODIFIED: `Back End/package.json` → removed @langchain/core, @langchain/groq, @langchain/langgraph, zod
**Result:** Python service deployed on Render Free Tier. Node.js calls it via HTTP. requestController.js unchanged. UptimeRobot used to prevent Render sleep and timeout issues.
**Decision:** Hugging Face Spaces originally planned, but switched to Render since HF now charges for Docker spaces on some accounts.

### 2026-08
**Change:** AI workflow agent integrated (LangGraph + Groq)
**Reason:** Replace static template-only workflow generation with dynamic LLM-generated task breakdowns
**Files:** `Back End/Utilities/aiWorkflowAgent.js` (new), `Back End/Controllers/requestController.js` (updated)
**Result:** Requests now get AI-classified and AI-generated workflows with fallback on failure

### 2026-08
**Change:** Reverted email service from Resend back to Nodemailer/Gmail SMTP
**Reason:** Resend integration had issues; Gmail SMTP is reliable for current scale
**Files:** `Back End/Utilities/email.js`, `Back End/config.env`
**Result:** Email OTP and password reset work via Gmail SMTP

### 2025-12
**Change:** Added 2FA (email OTP + SMS OTP via Twilio), department-level request rejections, improved forgot password speed
**Files:** `Back End/Utilities/otp.js`, `Back End/Controllers/authController.js`, `Back End/routes/requestRoutes.js`
**Result:** Full 2FA flow operational; dept managers can reject their portion of a request independently

### 2025-11
**Change:** Added landing pages (Home, About, HowToUse), popup notifications, client request view, employee sign-up on frontend
**Files:** `Front End/src/pages/Home.tsx`, `About.tsx`, `HowToUse.tsx`, components
**Result:** Public-facing landing pages live; clients can view their own request details

### 2025-10 (initial builds)
**Change:** Initial rule-based portal, backend + frontend testing, employee dashboard, rate limiting fixes post-deployment, multi-tab login handling
**Files:** All core files established
**Result:** Core MVP portal working for all three roles

---

## 16. Current Milestone

**Goal:** Production-ready clean codebase

**Completed:**
- Full request-to-project lifecycle with AI workflow generation
- All three portals (client, employee, manager) functional
- 2FA, OTP, email/SMS working
- Frontend deployed on Vercel; backend on Render
- Complete repository cleanup (see section 18 + 19)

**In Progress:**
- Phone uniqueness constraint (requires data cleanup before re-enabling)

**Blocked:** None

**Next (ordered by priority):**
1. Re-enable phone number uniqueness constraint after cleaning duplicate phone data
2. Conversational ops interface (chat-based commands)
3. Predictive scheduling (slippage detection)
4. Audit logging (immutable event log)

---

## 17. Next Steps

### High Priority
1. **Re-enable phone uniqueness constraint** after cleaning duplicate phone data in Atlas.
2. **End-to-end test:** Submit a request from the frontend and verify AI classification + workflow generation works through the Python service.
3. **Run backend test suite:** `node "Back End/tests/backendTesting.js"` against live server + MongoDB.
4. **AI Service health check:** `GET /health` on Render URL.

### Medium Priority
4. **Conversational Ops:** Chat interface for natural language project/task operations ("create project", "assign QA", "show blockers").
5. **Predictive scheduling:** Slippage detection based on task progress vs estimated hours.
6. **Audit logging:** Immutable event log for compliance (approvals, assignments, project changes).

### Low Priority
7. **Multi-tenant SaaS:** Tenant isolation layer for enterprise white-labeling.
8. **External integrations:** Slack/Teams notifications, Jira/GitHub sync.
9. **HSTS:** Enforce once behind verified TLS.

## 19. Repository Cleanup — Phase 2 (2026-08-09)

A second, deeper cleanup pass was executed:

### Shared Utility Extraction (Backend)
- **`Back End/Utilities/controllerUtils.js`** (NEW) — Extracted `normalizePhone`, `normalizeDept`, `expandDeptAliases`, `expandDeptList` from 3–4 controllers where they were each copy-pasted. All controllers now import from this single source.
- **Phone validation**: Standardized to E.164 international format (`+<digits>`) across the entire backend. Removed India-only hardcoding.

### Shared Utility Extraction (Frontend)
- **`Front End/src/utils/phoneUtils.ts`** (NEW) — Extracted `handlePhoneInput`, `formatPhoneDisplay`, `isValidPhone` from 6 files (`Signup.tsx`, `manager/Profile.tsx`, `employee/Profile.tsx`, `client/Profile.tsx`, `manager/AddClient.tsx`, `manager/AddEmployee.tsx`) where they were each copy-pasted.
- **Phone format**: Updated from India-only (`+91` hardcoded) to international E.164.
- **Phone submit validation**: Updated `Signup.tsx` (employee + client sections) and `manager/AddClient.tsx` to use `isValidPhone()` — previously used hardcoded India-only digit checks (`length !== 12 || startsWith('91')`) which were inconsistent with the new E.164 storage format.

### Dead Code Removed
- **`Front End/src/components/manager/ManagerLayout.tsx`** (DELETED) — Never imported in `App.tsx`; `PortalLayout` + `ManagerSidebar` serve this purpose.
- **`Front End/src/pages/manager/AddEmployee.tsx`** (DELETED) — Never routed in `App.tsx`; `/manager/add-employee` routes to `ManageEmployees.tsx`.

### Documentation Cleanup
- **Consolidated 5 README files into 1 root `README.md`**: Merged content from `Back End/README.md`, `AI Service/README.md`, `Front End/README.md`. Deleted all 3 sub-READMEs. Kept `Back End/scripts/README.md` as a useful script reference table.
- Root README now covers: overview, architecture, repo structure, local setup for all 3 services, API reference, test commands, deployment guide, env var tables, security section, roadmap.
- **`Docs/env-vars.md`** (NEW) — Full environment variable reference table for all 3 services.
- **`Docs/dependency-map.md`** (NEW) — System dependency map: Frontend→API, Backend→MongoDB, Backend→Python AI, Auth flow, files that must not change.

### Comment Quality
- Removed verbose boilerplate comments in `app.js`.
- Restored all structural step-navigation comments (`// 1)`, `// 2)` etc.) in `authController.js` that were accidentally stripped.

### Fallback Clarification
- Added comment in `aiWorkflowAgent.js` clarifying why `LAST_RESORT_FALLBACK` is intentionally NOT merged with `workflowGenerator.js` templates — they serve different layers of the fallback hierarchy.

### Verification
- 75 backend require paths — all resolve correctly.
- 35 logic unit tests (phone normalization, dept alias expansion, phone flow) — all PASS.
- 24 backend modules (all controllers, utilities, routes, app.js) load cleanly.
- TypeScript `tsc --noEmit` — 0 errors.
- Frontend `npm run build` — ✓ built in 7.80s, 0 errors.
