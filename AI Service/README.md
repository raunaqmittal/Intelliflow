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

## Deployment — Hugging Face Spaces (FREE, Always-On)

**Why Hugging Face Spaces?**
- Truly free forever (CPU Basic tier)
- Always-on — no sleep after inactivity (unlike Render/Koyeb free tiers)
- Built for AI workloads
- No credit card required

### Steps

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Fill in:
   - **Owner:** your HF username
   - **Space name:** `intelliflow-ai-agent` (or any name)
   - **SDK:** select **Docker**
   - **Hardware:** **CPU Basic** (free)
   - **Visibility:** **Private** (so the endpoint isn't public)
3. Click **Create Space** — HF creates a Git repo for the space
4. Clone the Space repo and copy **only** the `AI Service/` files into it:
   ```bash
   git clone https://huggingface.co/spaces/<your-username>/intelliflow-ai-agent
   cd intelliflow-ai-agent

   # Copy all AI Service files (NOT the whole Intelliflow repo)
   copy <path-to-intelliflow>\AI Service\* .    # Windows
   cp -r <path-to-intelliflow>/AI\ Service/* .  # macOS/Linux
   ```
5. Add secrets in the Space **Settings → Variables and secrets** tab:
   - `GROQ_API_KEY` → your Groq key
   - `GROQ_MODEL` → `llama-3.3-70b-versatile`
   - `AI_WORKFLOW_TIMEOUT_SECS` → `30`
   - `INTERNAL_API_KEY` → your shared secret (same value as `AI_AGENT_INTERNAL_KEY` in `Back End/config.env`)
   - **Do NOT add PORT** — HF sets it to 7860 automatically
6. Push the code:
   ```bash
   git add .
   git commit -m "initial deploy"
   git push
   ```
7. HF builds the Docker image automatically. Wait ~2–3 minutes.
8. Your API will be live at:
   ```
   https://<your-username>-intelliflow-ai-agent.hf.space
   ```
9. Update `AI_AGENT_URL` in `Back End/config.env` (and your Render dashboard env vars) to that URL.

### Important HF Spaces notes

- **Port:** The Dockerfile already sets port `7860` — HF requires this. Do not change it.
- **Secrets:** HF secrets are injected as environment variables. Never commit `.env` to the Space repo.
- **Logs:** View build and runtime logs in the Space's **Logs** tab.
- **Private Space:** Private spaces require a HF token to call the API. Since our service uses `X-Internal-Key` for auth, you can keep the space **Public** and rely on the shared secret alone — the endpoint will be accessible but unauthorized calls are rejected by FastAPI.

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
