# Intelliflow AI Agent Service

A standalone Python FastAPI microservice that hosts the LangGraph AI workflow agent.
Called by the Node.js backend via HTTP. Classifies client requests and generates
tailored project workflow breakdowns using Groq LLM.

---

## Tech Stack

- **FastAPI** — HTTP framework
- **LangGraph** — State machine orchestration
- **langchain-groq** — Groq LLM client
- **Pydantic v2** — Input/output validation
- **Uvicorn** — ASGI server

---

## Local Setup

### 1. Create and activate a virtual environment

```bash
cd "AI Service"

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
# Copy the example file
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux

# Edit .env and fill in:
# GROQ_API_KEY — from https://console.groq.com
# INTERNAL_API_KEY — shared secret (must match AI_AGENT_INTERNAL_KEY in Back End/config.env)
```

### 4. Run the service

```bash
uvicorn main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`.

---

## API Endpoints

### `GET /health`
Health check. Returns `{ "status": "ok" }`.

### `POST /run-agent`
Runs the LangGraph AI workflow agent.

**Headers:**
```
X-Internal-Key: <your shared secret>
Content-Type: application/json
```

**Request body:**
```json
{
  "title": "E-commerce website for a clothing brand",
  "description": "Build a full-stack online store with product catalog, cart, and Stripe payments",
  "requirements": ["product catalog", "shopping cart", "Stripe integration", "admin dashboard"]
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
    "taskBreakdown": [
      {
        "taskName": "Requirements Analysis & Planning",
        "team": "research",
        "estimatedHours": 40,
        "requiredSkills": ["Business Analysis", "User Research", "Documentation"]
      }
    ]
  },
  "usedFallback": false,
  "error": null
}
```

**Out-of-scope example response:**
```json
{
  "requestType": "out_of_scope",
  "isOutOfScope": true,
  "outOfScopeReason": "Physical restaurant construction is outside the company's software service scope",
  "aiConfidence": "high",
  "workflow": null,
  "usedFallback": false,
  "error": null
}
```

---

## Deployment — Render (Free Tier)

You can easily deploy this FastAPI service to Render for free as a Web Service.

**Important Note on Free Tier:**
Render's free tier spins down your service after 15 minutes of inactivity. When a new request comes in, it causes a "cold start" which can take 30–60 seconds. Since your Node.js backend has a 35-second timeout, the very first request of the day might time out and use the fallback workflow. Subsequent requests will be fast.

### Steps

1. Push your repository to GitHub (the `AI Service/` folder is part of the monorepo).
2. Go to [Render Dashboard](https://dashboard.render.com/) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Fill in the deployment details:
   - **Name:** `intelliflow-ai-agent` (or anything you like)
   - **Root Directory:** `AI Service`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Click **Advanced** and add your Environment Variables:
   - `GROQ_API_KEY` → your Groq key
   - `GROQ_MODEL` → `llama-3.3-70b-versatile`
   - `AI_WORKFLOW_TIMEOUT_SECS` → `30`
   - `INTERNAL_API_KEY` → your shared secret (make up a strong password)
   - `PYTHON_VERSION` → `3.11.0` (Recommended by Render)
6. Click **Create Web Service**.
7. Once deployed, copy your Render URL (e.g., `https://intelliflow-ai-agent.onrender.com`).
8. Update `AI_AGENT_URL` in your Node.js backend's `config.env` (and Render dashboard) to match this URL.

### Crucial Final Step: Prevent Sleep (Free Tier only)
Because Render free tier sleeps after 15 mins, and the cold start takes ~42 seconds (longer than your Node.js 35s timeout), you **must** use UptimeRobot to keep it awake:
1. Go to [UptimeRobot](https://uptimerobot.com) (free)
2. Add a new **HTTP(s)** monitor
3. URL: `https://<your-render-app>.onrender.com/health` (The `/health` endpoint supports both GET and HEAD requests specifically for this)
4. Interval: **5 minutes**

Without this step, your first AI request of the day will always fail and use the fallback template.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key from console.groq.com |
| `GROQ_MODEL` | No | LLM model name (default: `llama-3.3-70b-versatile`) |
| `AI_WORKFLOW_TIMEOUT_SECS` | No | Agent timeout in seconds (default: `30`) |
| `INTERNAL_API_KEY` | Yes | Shared secret for `X-Internal-Key` header auth |
| `PORT` | No | Port to run on (default: `8000`) |

---

## Agent Behaviour

The agent is a **stateless** 2-node LangGraph graph:

```
Input
  └── Node 1: classify_request (Groq LLM)
        ├── isOutOfScope=true → END (workflow=null)
        └── isOutOfScope=false → Node 2: generate_workflow (Groq LLM)
                                    └── END
```

- **Timeout:** If the full graph takes longer than `AI_WORKFLOW_TIMEOUT_SECS`, a static fallback template is returned with `usedFallback: true`.
- **Fallback templates:** Defined in `fallbacks.py` for `web_dev`, `app_dev`, `prototype`, and `research`.
- **LLM output validation:** Pydantic models validate the JSON returned by the LLM. On validation failure, the fallback is used.
