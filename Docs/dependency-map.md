# Intelliflow — System Dependency Map
> Phase 1S of repo_cleanup_prompt.md  
> Last Updated: 2026-08-09

---

## Service Layer Map

```
Browser (React + TypeScript — Vercel)
        │
        │  HTTPS  Authorization: Bearer <JWT>
        ▼
Express REST API (Node.js — Render)
        │
        ├── MongoDB Atlas (mongoose)
        │       Collections: employees, clients, requests, projects, tasks
        │
        └── POST /run-agent  X-Internal-Key  35s timeout
                │
                ▼
        Python FastAPI (LangGraph — Render Free Tier + UptimeRobot)
                │
                └── Groq API (LLM: llama-3.3-70b-versatile)
```

---

## Frontend → Backend API Dependencies

| Frontend File | API Endpoint | Method | Auth |
|---------------|-------------|--------|------|
| `Login.tsx` | `/employees/login`, `/clients/login` | POST | No |
| `Signup.tsx` | `/employees/signup`, `/clients/signup` | POST | No |
| `ForgotPassword.tsx` | `/employees/forgotPassword`, `/clients/forgotPassword` | POST | No |
| `ResetPassword.tsx` | `/employees/resetPassword/:token` etc. | PATCH | No |
| `ChangePassword.tsx` | `/employees/updatePassword`, `/clients/updatePassword` | PATCH | Yes |
| `client/Profile.tsx` | `/clients/me`, `/clients/updateMe`, `/clients/verifyPhone`, `/clients/verifyEmail` | GET/PATCH | Yes |
| `client/MyRequests.tsx` | `/requests/my-requests` | GET | Yes |
| `client/SubmitRequest.tsx` | `/requests` | POST | Yes |
| `client/RequestDetails.tsx` | `/requests/:id` | GET | Yes |
| `client/Projects.tsx`, `ProjectDetails.tsx` | `/projects`, `/projects/:id` | GET | Yes |
| `employee/Profile.tsx` | `/employees/me`, `/employees/updateMe`, `/employees/verifyPhone` | GET/PATCH | Yes |
| `employee/Tasks.tsx` | `/tasks/my-tasks`, `/tasks/:id` | GET/PATCH | Yes |
| `employee/MyProjects.tsx` | `/projects/my-projects` | GET | Yes |
| `employee/Team.tsx` | `/employees` | GET | Yes |
| `manager/RequestDetails.tsx` | `/requests/:id`, `generate-workflow`, `assign-employees`, `approve`, `reject`, `department-approve`, `department-reject`, `convert-to-project`, `refresh-suggestions` | GET/POST/PATCH | Yes |
| `manager/ManageEmployees.tsx` | `/employees`, `/employees/:id` | GET/PATCH | Yes |
| `manager/AddClient.tsx` | `/clients/signup`, `/clients` | POST/GET | Yes |
| `manager/ProjectDetails.tsx` | `/projects/:id`, `/tasks` | GET/PATCH | Yes |
| `utils/dataParser.ts` | `/employees`, `/clients`, `/projects`, `/tasks` | GET | Yes |

---

## Backend → MongoDB Collection Map

| Controller | Reads | Writes |
|------------|-------|--------|
| `authController.js` | `employees`, `clients` | `employees`, `clients` |
| `employeeController.js` | `employees`, `tasks` | `employees` |
| `clientController.js` | `clients` | `clients` |
| `requestController.js` | `requests`, `employees`, `projects`, `tasks` | `requests`, `projects`, `tasks` |
| `projectController.js` | `projects`, `tasks` | `projects`, `tasks` |
| `taskController.js` | `tasks`, `projects` | `tasks`, `projects` |

---

## Backend → Python AI Service

| Caller | Endpoint | Contract |
|--------|---------|----------|
| `Utilities/aiWorkflowAgent.js` | `POST ${AI_AGENT_URL}/run-agent` | Header: `X-Internal-Key`. Body: `{title, description, requirements[]}`. Response: `{requestType, isOutOfScope, outOfScopeReason, aiConfidence, workflow, usedFallback, error}` |

**Fallback chain if Python service fails:**
1. `aiWorkflowAgent.js` catches → returns `LAST_RESORT_FALLBACK` (bare-minimum safety net)
2. `workflowGenerator.js` → rich per-type templates (`web_dev`, `app_dev`, `prototype`, `research`)

---

## Authentication Flow

| Layer | Mechanism |
|-------|----------|
| Frontend → Backend | JWT Bearer stored in `localStorage`; injected via `api.ts` request interceptor |
| Backend token verify | `authController.protect` — verifies signature, expiry, `passwordChangedAt`; attaches `req.user` |
| Backend → Python | `X-Internal-Key` header — `AI_AGENT_INTERNAL_KEY` (Node) must equal `INTERNAL_API_KEY` (Python) |
| Role enforcement | `authController.restrictTo('manager')` etc. applied per route |

---

## Files That MUST NOT Change Without Full Impact Analysis

| File | Why |
|------|-----|
| `Utilities/aiWorkflowAgent.js` | API contract with Python service — breaking change affects entire AI path |
| `Controllers/requestController.js` | 16 exports covering full request lifecycle — approval chain, project conversion |
| `models/*.js` | Schema changes require data migration on Atlas |
| `Front End/src/contexts/UserContext.tsx` | Auth state used across all 3 portals |
| `Front End/src/lib/api.ts` | All 39+ API calls route through this Axios instance |
| `AI Service/schemas.py` | Pydantic models must match LLM output structure |
| `AI Service/main.py` | `/run-agent` and `/health` paths are hardcoded in backend |
