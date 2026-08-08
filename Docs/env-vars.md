# Intelliflow — Environment Variables Reference

## Backend (`Back End/config.env`)

| Variable | Required | Used In | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `app.js`, `otp.js`, `email.js`, `projectStatusUpdater.js`, `diagnosticRoutes.js` | `development` or `production` — controls logging, error verbosity, diagnostic route access |
| `PORT` | No | `server.js` | Server port (default: `3000`) |
| `DATABASE` | Yes | `server.js` | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | `authController.js` | Secret for signing JWTs (min 32 chars recommended) |
| `JWT_EXPIRES_IN` | Yes | `authController.js` | JWT token expiry, e.g. `90d` |
| `FRONTEND_URL` | Yes | `app.js` | Frontend origin allowed by CORS, e.g. `https://intelliflow.vercel.app` |
| `AI_AGENT_URL` | Yes | `aiWorkflowAgent.js` | Python AI service base URL, e.g. `https://intelliflow-ai.onrender.com` |
| `AI_AGENT_INTERNAL_KEY` | Yes | `aiWorkflowAgent.js` | Shared secret sent as `X-Internal-Key` header to Python service |
| `AI_WORKFLOW_TIMEOUT_MS` | No | `aiWorkflowAgent.js` | Axios timeout in ms (default: `35000`) |
| `EMAIL_HOST` | Yes | `email.js` | SMTP host, e.g. `smtp.gmail.com` |
| `EMAIL_PORT` | Yes | `email.js` | SMTP port, e.g. `587` or `465` |
| `EMAIL_USERNAME` | Yes | `email.js` | SMTP username / email address |
| `EMAIL_PASSWORD` | Yes | `email.js` | SMTP password or app password |
| `TWILIO_ACCOUNT_SID` | Yes* | `otp.js` | Twilio Account SID (required for SMS OTP) |
| `TWILIO_AUTH_TOKEN` | Yes* | `otp.js` | Twilio Auth Token (required for SMS OTP) |
| `TWILIO_PHONE_NUMBER` | Yes* | `otp.js` | Twilio number to send SMS from |
| `OTP_EXPIRY_MINUTES` | No | `otp.js` | OTP validity window in minutes (default: `5`) |
| `OTP_RATE_LIMIT_MINUTES` | No | `otp.js` | Rate limit window for OTP requests in minutes (default: `2`) |
| `INTERNAL_API_KEY` | Yes | `diagnosticRoutes.js` | Key to access `/api/diagnostic` endpoints (should match `AI_AGENT_INTERNAL_KEY`) |

> *Twilio vars are required for SMS 2FA. If not set, the system logs a warning and gracefully skips SMS sending.

### Safe to Remove?

None of the above are safe to remove — all are actively referenced in code.

---

## AI Service (`AI Service/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | — | Groq API key from [console.groq.com](https://console.groq.com) |
| `INTERNAL_API_KEY` | Yes | — | Shared secret — **must match** `AI_AGENT_INTERNAL_KEY` in backend |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | LLM model name |
| `AI_WORKFLOW_TIMEOUT_SECS` | No | `30` | Agent graph timeout in seconds |
| `PORT` | No | `8000` | Uvicorn server port (set automatically by Render) |
| `PYTHON_VERSION` | No | — | Set to `3.11.0` in Render dashboard for stability |

---

## Frontend (`Front End/.env` / Vercel env vars)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | No | Backend API base URL (default: `/api/v1` via Vite proxy in dev) |

---

## Deployment Notes

- **Never commit** `config.env`, `.env`, or any file containing secrets.
- All secret files are covered by the root `.gitignore`.
- `OTP_RATE_LIMIT_MINUTES` is used in code but may not appear in your `config.env` — ensure it is set or the default of 2 minutes applies.
