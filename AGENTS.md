# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **Next.js 16 portfolio site** (`gimenez.dev`) with an AI chat feature. It is a single Next.js process with no local databases or external services required for basic operation. Deployed on **GCP Cloud Run** via Cloud Build CI/CD.

### Running the app

- `npm run dev` — starts dev server on port 3000
- `npm run build` — production build (standalone output for Cloud Run)
- `npm run lint` — ESLint (currently 0 errors, 0 warnings)

See `README.md` **Scripts** table for the full list.

### Environment variables

- Copy `.env.example` to `.env.local`. All portfolio pages work without API keys.
- `INFERENCIA_API_KEY` + `INFERENCIA_BASE_URL` are needed for the AI chat. Without them, chat returns 503 but all pages work.
- In production on Cloud Run, these must be set via **GCP Secret Manager** (never in env vars directly).
- Supabase and Gemini keys are optional (RAG falls back to local knowledge in `src/lib/knowledge.ts`).

### Security architecture

- **Prompt injection defense**: `src/lib/security.ts` has 30+ regex patterns detecting direct injection, fake system handoff, role manipulation, system prompt extraction, and code execution attempts (OWASP LLM01/LLM07).
- **Rate limiting**: `src/lib/rate-limit.ts` — 2 RPM per IP, 10 msgs/session, 150 LLM reqs/day. Designed for Cloud Run free tier.
- **Security headers**: CSP, HSTS, X-Frame-Options, etc. configured in `next.config.ts`.
- **System prompt hardening**: Chat route has `[SYSTEM BOUNDARY]` markers with explicit anti-extraction rules.
- When updating security patterns, check the OWASP Top 10 for LLM Applications (2026 edition) for the latest threat vectors.

### Deployment

- **Cloud Run** in `us-east1`, service name `lgportfolio`.
- **Cloud Build** triggers on push to `main`. Config in `cloudbuild.yaml`.
- **Dockerfile** uses multi-stage build, `dumb-init`, non-root user, health check.
- Max 1 instance, scale-to-zero, request-based billing to stay in free tier.

### Gotchas

- Nav labels: "Work" → `/work`, "Architecture" → `/architecture`, "AI Chat" → `/chat`.
- No automated test suite (no `test` script in `package.json`).
- Rate limits are **enabled** in production. Set `RATE_LIMITS_DISABLED` in `rate-limit.ts` only for local dev testing.
