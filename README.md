# Intelliflow — Agentic Workflow OS for Cross-Functional Teams

Unified, end-to-end workflow management that turns client requests into structured projects, sprint plans, and actionable tasks across departments — with minimal manual coordination.

## What It Does

- **Single source of truth:** Centralize requests, approvals, projects, sprints, and tasks in one place.
- **Reduce coordination overhead:** Automate setup, assignment, and status rollups so teams can focus on execution.
- **Operate across functions:** Natively support software, hardware, UX, and operations workflows.

## How It Works

- **Intake → AI Classification:** Requests are analyzed by an AI agent (LangGraph + Groq) to detect project type and flag out-of-scope submissions.
- **Dynamic Workflow Generation:** The AI generates a tailored task breakdown with hour estimates and required skills based on the project description.
- **Rule-Based Fallbacks:** If the AI is unavailable or confidence is low, the system falls back to reliable rule-based templates with zero downtime.
- **Execution Loop:** Employees use "My Tasks" to update status; projects auto-update when tasks complete.
- **Smart Assignment:** AI-suggested employee matching based on skills and availability.
- **Guardrails:** Rate limiting, input sanitization, CORS, JWT auth, and security headers out of the box.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js / Express, MongoDB / Mongoose, JWT |
| **AI Service** | Python FastAPI, LangGraph, Groq (Llama 3.3), Pydantic |
| **Frontend** | React 18, TypeScript, Vite, shadcn/ui, React Router |
| **Deployment** | Render (Node.js + Python), Vercel (Frontend) |

---

## Repository Structure

```
Intelliflow/
├── Back End/               # Node.js Express API
│   ├── Controllers/        # Request handlers
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── Utilities/          # Shared helpers (auth, AI proxy, workflow, phone, dept utils)
│   ├── scripts/            # Admin & maintenance scripts (see scripts/README.md)
│   ├── tests/              # Backend test suite
│   ├── app.js              # Express app setup
│   └── server.js           # Entry point
│
├── AI Service/             # Python FastAPI microservice
│   ├── main.py             # FastAPI app + routes
│   ├── agent.py            # LangGraph workflow agent
│   ├── prompts.py          # LLM prompt templates
│   ├── schemas.py          # Pydantic input/output models
│   ├── fallbacks.py        # Static fallback workflows
│   └── requirements.txt
│
├── Front End/              # React + TypeScript SPA
│   └── src/
│       ├── pages/          # client/, employee/, manager/ portals
│       ├── components/     # common/ and ui/ shared components
│       ├── contexts/       # Auth context (UserContext)
│       ├── utils/          # dataParser, phoneUtils, errorHandler
│       └── lib/            # API client (axios)
│
├── Data/                   # Seed data (JSON)
├── Docs/                   # Project documentation
├── .gitignore
└── README.md
```

---

## Local Setup

### 1. Backend (Node.js)

```powershell
cd "Back End"
npm install

# Create config.env from the required variables (see Security section below)
# Then start:
npm run dev         # development (nodemon)
npm start           # production
```

### 2. AI Service (Python FastAPI)

```powershell
cd "AI Service"

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # macOS/Linux

pip install -r requirements.txt

# Copy and fill in environment variables
copy .env.example .env

# Start the service
uvicorn main:app --reload --port 8000
```

### 3. Frontend (React)

```powershell
cd "Front End"
npm install
npm run dev         # development server
npm run build       # production build
```

---

## AI Service API

### `GET /health`
Health check. Returns `{ "status": "ok" }`.

### `POST /run-agent`
Runs the LangGraph AI workflow agent.

**Headers:**
```
X-Internal-Key: <shared secret>
Content-Type: application/json
```

**Request body:**
```json
{
  "title": "E-commerce website for a clothing brand",
  "description": "Build a full-stack online store with product catalog and Stripe payments",
  "requirements": ["product catalog", "shopping cart", "Stripe integration"]
}
```

**Response:**
```json
{
  "requestType": "web_dev",
  "isOutOfScope": false,
  "outOfScopeReason": null,
  "aiConfidence": "high",
  "workflow": {
    "estimatedDuration": 320,
    "taskBreakdown": [{ "taskName": "...", "team": "...", "estimatedHours": 40 }]
  },
  "usedFallback": false,
  "error": null
}
```

---

## Frontend Structure

| Portal | Path | Access |
|--------|------|--------|
| Client | `/client/*` | Authenticated clients |
| Employee | `/employee/*` | Authenticated employees |
| Manager | `/manager/*` | Manager-role employees |

**Running frontend tests (39 tests across all portals):**
```powershell
node ".\Front End\tests\frontendTesting.cjs"

# Test specific portal:
$env:MODE = "client"; node ".\Front End\tests\frontendTesting.cjs"
$env:MODE = "employee"; node ".\Front End\tests\frontendTesting.cjs"
$env:MODE = "manager"; node ".\Front End\tests\frontendTesting.cjs"
```

---

## Backend Test Suite

A comprehensive test suite lives at `Back End/tests/backendTesting.js`.

**Smoke Test (default — generic endpoint coverage):**
```powershell
node "Back End/tests/backendTesting.js"
```

**Specific Scenario (real client data, full lifecycle):**
```powershell
$env:MODE = "specific"; node "Back End/tests/backendTesting.js"
```

**Environment variables for tests:**

| Variable | Default | Description |
|----------|---------|-------------|
| `MODE` | `smoke` | `smoke` or `specific` |
| `BASE_URL` | `http://localhost:3000/api/v1` | API base URL |
| `PROGRESSIVE` | `false` | Complete tasks per-sprint before advancing (specific mode) |
| `VERBOSE` | `false` | Detailed logging |

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | **Vercel** | Auto-deploys from `Front End/` |
| Node.js Backend | **Render** | Set `NODE_ENV=production`, add all env vars |
| Python AI Service | **Render (Free Tier)** | Set root directory to `AI Service` |

**Keeping the AI Service awake (Render Free Tier):**
Render's free tier sleeps after 15 minutes of inactivity. Use [UptimeRobot](https://uptimerobot.com) (free) to ping `https://<your-render-app>.onrender.com/health` every 5 minutes.

---

## Environment Variables

### Backend (`Back End/config.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | No | Server port (default: `3000`) |
| `DATABASE` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Yes | JWT expiry e.g. `7d` |
| `AI_AGENT_URL` | Yes | Python AI service base URL |
| `AI_AGENT_INTERNAL_KEY` | Yes | Shared secret for AI service auth |
| `AI_WORKFLOW_TIMEOUT_MS` | No | Timeout in ms (default: `35000`) |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |
| `EMAIL_HOST` | Yes | SMTP host |
| `EMAIL_PORT` | Yes | SMTP port |
| `EMAIL_USERNAME` | Yes | SMTP username |
| `EMAIL_PASSWORD` | Yes | SMTP password |
| `OTP_EXPIRY_MINUTES` | No | OTP validity window (default: `5`) |

### AI Service (`AI Service/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key from console.groq.com |
| `INTERNAL_API_KEY` | Yes | Shared secret — must match `AI_AGENT_INTERNAL_KEY` |
| `GROQ_MODEL` | No | LLM model (default: `llama-3.3-70b-versatile`) |
| `AI_WORKFLOW_TIMEOUT_SECS` | No | Agent timeout (default: `30`) |

---

## Security

- **Security headers (Helmet + CSP):** Guards against clickjacking, MIME sniffing, and XSS.
- **Rate limiting:** 100 requests/hour per IP on all `/api` endpoints.
- **NoSQL injection sanitization:** Removes `$` and `.` Mongo operators from user input.
- **XSS cleaning:** Scrubs malicious script/HTML from request bodies.
- **HPP protection:** Prevents duplicate query parameter abuse.
- **Restricted CORS:** Only `FRONTEND_URL` is permitted.
- **JWT sessions:** Signed tokens with expiry; invalidated on password change.
- **Hashed passwords:** bcrypt with cost factor 12.
- **Cryptographic reset tokens:** Hashed before storage, short expiry.
- **Internal API key:** `X-Internal-Key` header guards the Node↔Python service boundary.

---

## Roadmap

- **Advanced Allocation:** AI-based assignment optimized by skills, availability, and workload.
- **Conversational Ops:** Chat interface for natural language project/task commands.
- **Predictive Scheduling:** Slippage forecasting and auto-resequencing.
- **Integrations:** Slack/Teams notifications; Jira/GitHub sync.
- **Multi-tenant SaaS:** Tenant isolation with custom templates and policy packs.
