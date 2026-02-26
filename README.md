# Luis Gimenez — Portfolio & Production System

**Live site:** [gimenez.dev](https://gimenez.dev) · **War Room:** [gimenez.dev/war-room](https://gimenez.dev/war-room)

A **production Next.js portfolio** on GCP Cloud Run with an AI-powered recruiter chat, live observability (War Room), session analytics, and infra-as-code. Built to demonstrate the same engineering practices used in high-availability systems: observability, security, rate limiting, and cost control.

---

## What this repo is

- **Portfolio** — Professional site (about, work, architecture case study, contact). Responsive, dark theme.
- **AI chat** — RAG-backed assistant for recruiters; answers from a structured knowledge base. Rate-limited, prompt-injection hardened, with optional conversation memory and session analytics (Firestore).
- **War Room** — Real-time dashboard: health tiles, latency charts, error feed, “Explain with AI” for errors. Same mindset as production NOC dashboards.
- **Infrastructure** — Single Next.js app on Cloud Run behind a Global External ALB, Cloud CDN, and Cloud Armor (WAF). Terraform for all GCP resources. Push to `main` → Cloud Build → deploy. Optional **automatic budget kill switch**: when a $10 budget threshold is exceeded, a Cloud Function scales Cloud Run to zero so cost stops even if you’re not online.

No placeholder content. The site is live; the chat, health checks, and War Room are wired to real endpoints and (in prod) to GCP.

---

## What it demonstrates

| Area | What’s in this repo |
|------|----------------------|
| **Cloud & IaC** | GCP Cloud Run, ALB, CDN, Armor, Secret Manager, Terraform (services, LB, WAF, monitoring, budget + Pub/Sub → function). |
| **Observability** | In-app War Room (metrics, errors, events), structured JSON logs, trace IDs, uptime checks, alert policy. |
| **Security** | CSP/HSTS/X-Frame-Options, rate limiting (app + Cloud Armor), prompt-injection defense (OWASP LLM01/07), secrets in Secret Manager, ingress only from ALB. |
| **AI / LLM** | RAG over a local knowledge base, streaming chat (OpenAI-compatible API), response caching, token/message limits. |
| **Reliability & cost** | Health checks, scale-to-zero, optional $10 budget with **automatic** kill switch (Pub/Sub → function sets Cloud Run max-instances=0). |

**Target roles:** Senior / Staff / SRE / Cloud Architect — backend, distributed systems, observability, GCP. Open to remote and select markets.

---

## Live site

| Link | Description |
|------|--------------|
| [gimenez.dev](https://gimenez.dev) | Homepage |
| [gimenez.dev/war-room](https://gimenez.dev/war-room) | Live observability dashboard |
| [gimenez.dev/architecture](https://gimenez.dev/architecture) | Cloud Run architecture write-up |
| [gimenez.dev/chat](https://gimenez.dev/chat) | AI chat (rate-limited) |

---

## Features

- **Next.js 16** — App Router, React 19, TypeScript, Tailwind. Standalone output for Cloud Run.
- **AI chat** — Inferencia (OpenAI-compatible). RAG from a file-based knowledge base; optional Supabase pgvector. Per-IP and session rate limits, daily budget, response cache. Prompt-injection checks; conversation memory and session analytics in Firestore when configured.
- **War Room** — Status tiles (inference, RAG, rate limiter, logging, trace), P50/P95 latency, request/error volume, recent events (errors, cold starts, rate limits). “Explain with AI” sends error context to the same LLM for plain-language explanation.
- **Admin** — `/admin/conversations` (chat sessions) and `/admin/logs` (Cloud Run logs with trace links). Protected by admin secret; same secret for UI and API.
- **Infrastructure** — Terraform: Cloud Run, Artifact Registry, Secret Manager, global static IP, serverless NEG, backend + CDN, Cloud Armor (rate limits, scanner block, path traversal, adaptive DDoS), URL map, HTTPS redirect, managed SSL, uptime checks, alert policy. Optional: $10 billing budget with email + Pub/Sub; Cloud Function subscribes and sets Cloud Run `max-instances=0` when threshold is exceeded.
- **CI/CD** — Cloud Build on push to `main`: build image (linux/amd64), push to Artifact Registry, deploy to Cloud Run with secrets.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| App | Next.js 16, React 19, TypeScript, Tailwind |
| AI | Vercel AI SDK, Inferencia (OpenAI-compatible), local RAG; optional Supabase + Gemini embeddings |
| Data | Firestore (chat sessions, memory, analytics when configured) |
| Hosting | GCP Cloud Run (scale-to-zero, 1 max instance) |
| Edge | Global External ALB, Cloud CDN, Cloud Armor |
| IaC | Terraform (Run, LB, WAF, Pub/Sub, Cloud Function for budget kill) |
| CI/CD | Cloud Build; secrets from Secret Manager |
| Observability | In-memory telemetry → War Room; stdout JSON → Cloud Logging; trace IDs → Cloud Trace; uptime checks + alert |

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
| Optional RAG | `GOOGLE_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase + Gemini for vector RAG |

See `.env.example` for the full list. **Do not commit secrets.** Production uses GCP Secret Manager (see [AGENTS.md](./AGENTS.md) and [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md)).

---

## Deployment

- **App:** Push to `main` → Cloud Build builds the image, pushes to Artifact Registry, deploys to Cloud Run with secrets. No manual deploy needed when the trigger is connected.
- **Infrastructure:** `cd terraform && terraform init && terraform plan && terraform apply`. Use `terraform.tfvars` for `project_id`, `region`, optional `billing_account_id` / `budget_alert_email` for budget and automatic kill switch.

Details: [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md), [AGENTS.md](./AGENTS.md).

**Scripts:** `npm run dev` · `npm run build` · `npm run start` · `npm run lint`  
**Docker:** `docker build -t lgportfolio .` then run with `-e INFERENCIA_API_KEY` and `-e INFERENCIA_BASE_URL`; see `Dockerfile` for platform (linux/amd64).

### Verify (build, lint, Terraform)

Run these before pushing or to confirm the repo is healthy:

```bash
npm run build          # Production build (must succeed for Cloud Run)
npm run lint           # ESLint (0 errors, 0 warnings)
cd terraform && terraform init -input=false && terraform validate   # IaC valid
```

---

## Production readiness

- **Build** — `output: "standalone"`; `npm run build` and `npm run lint` (0 errors).
- **Security** — CSP, HSTS, X-Frame-Options; rate limiting (app + Cloud Armor); prompt-injection defense; secrets in Secret Manager; Cloud Run ingress only from ALB.
- **Health** — `/api/health` for uptime checks; 503 when degraded.
- **Telemetry** — Structured JSON logs, trace IDs, in-memory metrics for the War Room; metrics reset on cold start (documented).
- **Cost control** — Optional $10 budget; when configured in Terraform, a Cloud Function automatically scales Cloud Run to 0 on threshold breach. Manual fallback: `./scripts/disable-project-spend.sh`.

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
