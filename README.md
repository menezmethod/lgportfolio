# Luis Gimenez — Portfolio & Production System

**Live site:** [gimenez.dev](https://gimenez.dev) · **War Room:** [gimenez.dev/war-room](https://gimenez.dev/war-room)

A **production Next.js portfolio** deployed primarily on **Vercel** (`gimenez.dev`), with an AI-powered recruiter chat, live observability (War Room), session analytics, and optional **GCP** infra preserved in-repo for rollback (Cloud Run, ALB, Terraform, Cloud Build — not removed).


---

## What this repo is

- **Portfolio** — Professional site (about, work, architecture case study, contact). Responsive, dark theme.
- **AI chat** — RAG-backed assistant for recruiters; rate-limited and prompt-injection hardened; optional Firestore memory.
- **War Room** — Health tiles, latency charts, error feed, “Explain with AI”.
- **Hosting** — **Vercel** by default; full **GCP** stack (Cloud Run + ALB + Terraform + Cloud Build) remains in-repo if you switch back.

---

## What it demonstrates

| Area | What’s in this repo |
|------|----------------------|
| **Cloud & IaC** | **Vercel** production path; optional **GCP** Cloud Run, ALB, CDN, Armor, Secret Manager, Terraform (services, LB, WAF, monitoring, budget + Pub/Sub → function). |
| **Observability** | In-app War Room (metrics, errors, events), structured JSON logs, trace IDs, uptime checks, alert policy. |
| **Security** | CSP/HSTS/X-Frame-Options, rate limiting in the app, prompt-injection defense (OWASP LLM01/07), optional Cloud Armor on the GCP path. |
| **AI / LLM** | RAG over a local knowledge base, streaming chat (OpenAI-compatible API), response caching, token/message limits. |
| **Reliability & cost** | Health checks; optional **$20 budget kill switch** on GCP (Pub/Sub → function sets Cloud Run max-instances=0). |

**Target roles:** Senior / Staff / SRE / Cloud Architect — backend, distributed systems, observability, GCP. Open to remote and select markets.

---

## Live site

| Link | Description |
|------|--------------|
| [gimenez.dev](https://gimenez.dev) | Homepage |
| [gimenez.dev/war-room](https://gimenez.dev/war-room) | Live observability dashboard |
| [gimenez.dev/architecture](https://gimenez.dev/architecture) | Cloud Run architecture write-up |
| [gimenez.dev/docs](https://gimenez.dev/docs) | Technical documentation (deployment, CI, ADRs) |
| [gimenez.dev/chat](https://gimenez.dev/chat) | AI chat (rate-limited) |

---

## Features

- **Next.js 16** — App Router, React 19, TypeScript, Tailwind. `standalone` output for Docker/Cloud Run only; Vercel uses the default serverless build.
- **AI chat** — Inferencia (OpenAI-compatible). RAG from a file-based knowledge base or **GCP Cloud SQL (PostgreSQL + pgvector)** for vector search. Per-IP and session rate limits, daily budget, response cache. Prompt-injection checks; conversation memory and session analytics in Firestore when configured.
- **War Room** — Status tiles (inference, RAG, rate limiter, logging, trace), P50/P95 latency, request/error volume, recent events (errors, cold starts, rate limits). “Explain with AI” sends error context to the same LLM for plain-language explanation.
- **Admin** — **Administration Board** at `/admin` or `/admin/board`: single pane with System (War Room), Recruiters (sessions + emails + conversation drill-down), Logs (Cloud Run logs with trace links), and Metrics (Prometheus exposition). Also `/admin/conversations` and `/admin/logs` as deep links. Protected by admin secret; same secret for UI and API.
- **Infrastructure (optional GCP)** — Terraform: Cloud Run, Artifact Registry, Secret Manager, global static IP, serverless NEG, backend + CDN, Cloud Armor, URL map, managed SSL, uptime checks, budget + Pub/Sub → function. **Primary production:** Vercel — see [docs/VERCEL-DEPLOY.md](./docs/VERCEL-DEPLOY.md).
- **CI/CD** — GitHub Actions on every PR/push to `main`. **Production deploy:** Vercel on push to `main` when the GitHub integration is enabled. `cloudbuild.yaml` remains for optional GCP image builds.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| App | Next.js 16, React 19, TypeScript, Tailwind |
| AI | Vercel AI SDK, Inferencia (OpenAI-compatible), local RAG; optional **Cloud SQL + pgvector** + Gemini embeddings |
| Data | Firestore (chat sessions, memory, analytics when configured) |
| Hosting | **Vercel** (primary) · optional GCP Cloud Run (rollback in `terraform/`) |
| Edge | Vercel Edge Network · optional GCP ALB + Cloud CDN + Cloud Armor |
| IaC | Terraform (Run, LB, WAF, Pub/Sub, Cloud Function for budget kill) |
| CI/CD | GitHub Actions + **Vercel** Git integration; optional Cloud Build + Secret Manager |
| Observability | In-memory telemetry → War Room; **Prometheus** `/api/metrics` (text format, admin-only); stdout JSON → Cloud Logging; trace IDs → Cloud Trace; uptime checks + alert |

---

## Project structure

```
lgportfolio/
├── src/
│   ├── app/                    # Routes
│   │   ├── page.tsx            # Home
│   │   ├── about/, work/, contact/, architecture/
│   │   ├── chat/page.tsx       # AI chat UI
│   │   ├── war-room/page.tsx   # Observability dashboard
│   │   ├── admin/              # conversations, logs (admin secret)
│   │   └── api/                # chat, health, war-room/data, rag, admin/*
│   ├── components/
│   └── lib/                    # knowledge, rag, rate-limit, security, telemetry, firestore
├── functions/budget-kill/      # Cloud Function: budget alert → scale Run to 0
├── terraform/                  # GCP: Cloud Run, LB, WAF, budget, Pub/Sub, function
├── docs/                       # Deploy, setup, debugging, decisions
├── scripts/                    # deploy-cloudrun, check-ssl-cert, disable-project-spend
├── Dockerfile                  # Multi-stage, linux/amd64 for Cloud Run
├── cloudbuild.yaml             # Build + push + deploy on push to main
└── AGENTS.md                   # Run, deploy, debug, and constraints (for AI agents)
```

---

## Quick start

```bash
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio
npm install
cp .env.example .env.local   # Set INFERENCIA_* for chat (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Chat: [http://localhost:3000/chat](http://localhost:3000/chat).  
**Node:** 20.9+ (see `engines` in `package.json`).

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `INFERENCIA_BASE_URL` | For chat | OpenAI-compatible API base URL |
| `INFERENCIA_API_KEY` | For chat | API key; without it, chat returns 503 |
| `INFERENCIA_CHAT_MODEL` | No | Model override (optional) |
| `CHAT_MAX_RPM_PER_IP`, `CHAT_MAX_MESSAGES_PER_SESSION`, `CHAT_DAILY_BUDGET` | No | Rate limits (defaults in code) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 |
| Optional RAG | `GOOGLE_API_KEY`; on GCP, Terraform sets Cloud SQL (pgvector) env; locally use Cloud SQL Proxy + `RAG_DB_*` | File-based RAG by default; vector RAG when Cloud SQL is configured |

See `.env.example` for the full list. **Do not commit secrets.** On Vercel, set secrets in the project dashboard (or `vercel env`). On GCP, Secret Manager + Cloud Build still apply if you use that path — see [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md) and [docs/VERCEL-DEPLOY.md](./docs/VERCEL-DEPLOY.md).

---

## Deployment

- **Primary (Vercel):** Import the GitHub repo, configure env vars, add `gimenez.dev` in Vercel Domains, then point Namecheap DNS as shown in [docs/VERCEL-DEPLOY.md](./docs/VERCEL-DEPLOY.md). Push to `main` deploys production.
- **Optional GCP rollback:** `terraform/`, `cloudbuild.yaml`, and `Dockerfile` are unchanged. To redeploy on Cloud Run, re-enable your Cloud Build trigger and follow [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md).

Details: [docs/VERCEL-DEPLOY.md](./docs/VERCEL-DEPLOY.md), [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md), [AGENTS.md](./AGENTS.md).

**Scripts:** `npm run dev` · `npm run build` · `npm run start` · `npm run lint`  
**Docker:** `docker build -t lgportfolio .` then run with `-e INFERENCIA_API_KEY` and `-e INFERENCIA_BASE_URL`; see `Dockerfile` for platform (linux/amd64).

### Verify (build, lint, test, Terraform)

Run these before pushing or to confirm the repo is healthy:

```bash
npm run build          # Production build (must succeed on Vercel and locally)
npm run lint           # ESLint (0 errors, 0 warnings)
npm run test           # Vitest unit tests (security, rate-limit, version)
npm run test:e2e       # Cypress smoke tests (requires app running on :3000)
cd terraform && terraform init -input=false && terraform validate   # IaC valid
```

---

## Production readiness

- **Build** — `standalone` output only for Docker/Cloud Run; Vercel uses the default Next.js build. `npm run build` and `npm run lint` (0 errors).
- **Tests** — Vitest unit tests (security, rate-limit, version); Cypress e2e smoke tests; CI via GitHub Actions.
- **Version** — Single source of truth in `package.json`, read via `src/lib/version.ts`. Health API, War Room, and UI all read from this one place.
- **Security** — CSP, HSTS, X-Frame-Options; rate limiting in the app; prompt-injection defense; no secrets in client responses or logs. (Optional GCP Cloud Armor when using the ALB path.)
- **SLOs** — Tracked in War Room: availability (99.5%), P95 latency (<500ms), error rate (<5%), budget headroom (>10%). See [ADRs](./docs/adr/).
- **Health** — `/api/health` for uptime checks; 503 when degraded.
- **Telemetry** — Structured JSON logs, trace IDs, in-memory metrics for the War Room; metrics reset on cold start (documented).
- **Cost control** — Vercel billing + optional GCP **$20** budget kill switch when that stack is active; see [docs/CHECKLIST-FINAL-SWEEP.md](./docs/CHECKLIST-FINAL-SWEEP.md) for a full sweep checklist.

---

## For AI agents

**Cursor, Claude Code, OpenClaw, etc.:** Use **[AGENTS.md](./AGENTS.md)** as the single source of truth for run, deploy, debug, admin, logs, and repo constraints.

---

## Author

**Luis Gimenez**  
Software Engineer II (Enterprise Payments Platform, observability & reliability). GCP Professional Cloud Architect. Looking for Senior / Staff / SRE / Architect roles.

- **Email:** luisgimenezdev@gmail.com  
- **LinkedIn:** [linkedin.com/in/gimenezdev](https://www.linkedin.com/in/gimenezdev)  
- **GitHub:** [@menezmethod](https://github.com/menezmethod)

---

*This repo is public and maintained as both a portfolio and a reference implementation for cloud-native apps, observability, and safe AI integration.*
