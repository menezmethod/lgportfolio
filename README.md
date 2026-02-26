# Luis Gimenez Portfolio

A Next.js portfolio with an AI-powered chat. Built with Next.js 16, TypeScript, and Tailwind. The chat is backed by an OpenAI-compatible API (Inferencia) with a RAG-style knowledge base. **Fully hosted on GCP Cloud Run.**

## Target roles

- **Senior**, **Staff**, and **Architect** (e.g. GCP Cloud Architect, AI/ML Architect, Cloud Solutions Architect)
- Accepting interviews; open to remote and select relocation markets.

## Features

- **Modern stack:** Next.js 16 App Router, TypeScript, Tailwind CSS
- **AI chat:** Interactive chat powered by the Inferencia API (OpenAI-compatible). Single provider, no client-side model config.
- **RAG-style context:** Local file-based knowledge base by default; optional Supabase pgvector for vector search (uses Gemini embeddings when configured).
- **Rate limiting:** Per-IP, session cap, and daily budget to protect free tiers.
- **Response caching:** Pre-seeded cache for common questions to reduce API usage.
- **War Room:** Live observability dashboard — see status, errors, latency, and recent events in real time. When something breaks, you see it here first.
- **Architecture showcase:** Dedicated architecture page.
- **Responsive design:** Mobile-first, dark theme.
- **Infrastructure:** 100% GCP — Terraform, Cloud Run (prod + preview), Cloud Build.

## Environments (Cloud Run)

| Environment | URL / purpose |
|-------------|----------------|
| **Production** | https://gimenez.dev — main branch, Cloud Build deploy to Cloud Run behind ALB + Cloud Armor |
| **Preview** | Optional Cloud Run preview revisions or branch deploys; configure in Cloud Build triggers if needed |

## Live site

**Production:** https://gimenez.dev  

**War Room (live telemetry):** https://gimenez.dev/war-room — status, errors, and metrics in one place.

## Tech stack

| Component      | Technology                          | Notes                                      |
|----------------|-------------------------------------|--------------------------------------------|
| Framework      | Next.js 16 (App Router)              | SSR/SSG, API routes, RSC                   |
| Language       | TypeScript                          | Type safety                                |
| Styling        | Tailwind CSS                        | Utility-first                              |
| AI chat        | AI SDK + Inferencia API             | OpenAI-compatible; single provider         |
| RAG / context  | Local knowledge + optional Supabase | File-based by default; pgvector optional  |
| Embeddings     | Gemini text-embedding-004           | Only when Supabase RAG is configured       |
| Hosting        | GCP Cloud Run                       | Production + preview; scale-to-zero        |
| IaC            | Terraform                           | Cloud Run, LB, WAF, secrets                 |
| CI/CD          | Cloud Build                         | Push to `main` → build → deploy to Cloud Run |

## Prerequisites

- Node.js 20.9+ (see `engines` in `package.json`; Next.js 16 requires 20.9+)
- **Chat:** Inferencia API key (contact admin or set up your own OpenAI-compatible endpoint). Required for `/api/chat`.
- **Optional:** Google Gemini API key for RAG embeddings when using Supabase. Get one at https://aistudio.google.com/apikey
- **Optional:** Supabase project for vector-backed RAG (otherwise the app uses the local knowledge file).

## Quick start

```bash
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio

npm install

# Chat requires Inferencia
cp .env.example .env.local
# Set INFERENCIA_BASE_URL and INFERENCIA_API_KEY in .env.local (see .env.example for variable names; do not commit real values)

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Chat is at [http://localhost:3000/chat](http://localhost:3000/chat).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `INFERENCIA_BASE_URL` | **Yes for chat** | OpenAI-compatible API base URL (set in `.env.local` or Secret Manager; not documented here for security) |
| `INFERENCIA_API_KEY` | **Yes for chat** | API key for Inferencia. Chat returns 503 if missing. |
| `INFERENCIA_CHAT_MODEL` | No | Chat model ID (optional override; set via env if needed) |
| `GOOGLE_API_KEY` | Optional | For Gemini embeddings when Supabase RAG is used |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL for vector RAG |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role key |
| `CHAT_MAX_RPM_PER_IP` | No | Per-IP rate limit (default: 3) |
| `CHAT_MAX_MESSAGES_PER_SESSION` | No | Session message cap (default: 20) |
| `CHAT_DAILY_BUDGET` | No | Daily request budget (default: 900) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 |

See `.env.example` for the full list. In production (Cloud Run), Inferencia keys come from GCP Secret Manager via the deploy step; see [AGENTS.md](./AGENTS.md) and [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md).

**Security:** Do not commit `.env.local` or any file containing API keys or secrets. They are gitignored; use your host’s secret manager or environment variables for production. Default API base URLs and model names are not documented here to reduce abuse surface (set them in env or see your deployment docs).

## Project structure

```
lgportfolio/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home (hero, roles, CTAs)
│   │   ├── about/page.tsx        # About + skills
│   │   ├── work/page.tsx         # Projects
│   │   ├── architecture/page.tsx # Architecture case study
│   │   ├── contact/page.tsx      # Contact + resume
│   │   ├── chat/page.tsx         # AI chat UI
│   │   ├── war-room/page.tsx     # Live observability dashboard
│   │   └── api/
│   │       ├── chat/route.ts     # Chat API (Inferencia only)
│   │       ├── health/route.ts   # Health check (uptime checks)
│   │       ├── war-room/data/route.ts # War Room metrics JSON
│   │       └── rag/route.ts      # RAG/embeddings (optional)
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── knowledge.ts          # Local knowledge base (RAG source)
│   │   ├── rag.ts                # RAG retrieval (local or Supabase)
│   │   └── rate-limit.ts         # Rate limits + response cache
│   └── app/                      # Global layout, styles
├── terraform/                    # GCP Cloud Run IaC (LB, WAF, DNS)
├── cloudbuild.yaml              # Cloud Build: push to main → build & deploy (no GitHub Actions)
├── docs/                        # Additional documentation
├── Dockerfile
└── README.md
```

## War Room (live observability)

The **War Room** is a live dashboard that shows how this portfolio is running — the same kind of observability you’d use for production payment systems, applied here so you can see health and errors at a glance.

**Where:** [https://gimenez.dev/war-room](https://gimenez.dev/war-room) (also linked from the nav). It auto-refreshes every 10 seconds.

**Why it matters:** When something goes wrong — a chat error, rate limit, or API failure — you don’t have to open Cloud Logging first. The War Room shows:

- **Status tiles** — Overall health plus per-component checks (inference API, RAG, rate limiter, Cloud Logging, Cloud Trace). Green = up, amber = degraded, red = down.
- **Key metrics** — Uptime, request count, P95 latency, error rate (1h), chat cache hit rate, and daily chat budget remaining.
- **Charts** — Request latency (P50/P95) and request/error volume over the last hour, in 10-second buckets.
- **Recent events** — A live feed of what just happened: errors, cold starts, rate limits, cache hits, health checks. If you hit an error and open the War Room, you’ll see it here with a timestamp and type (e.g. error, rate_limit).
- **Infrastructure** — Runtime (Node version), uptime, cold start count, boot time.

Data comes from the same in-memory telemetry engine that feeds `/api/health`. Metrics reset on cold start (scale-to-zero); the dashboard is honest about that. For long-term retention and alerting, use GCP Cloud Logging, Cloud Monitoring, and the uptime checks configured in Terraform.

## AI chat behavior

- **Provider:** One backend only, Inferencia (OpenAI-compatible). No fallbacks or client-side model switching.
- **Rate limiting:** Per-IP token bucket, session message cap, and a daily budget. Cached responses for common questions don’t count against the budget.
- **Context:** System prompt includes RAG context from the local knowledge base (or Supabase when configured).
- **When limits are hit:** Cached answer if available, otherwise a clear message and contact info.

## Cost (indicative)

| Service        | Notes                    |
|----------------|--------------------------|
| Cloud Run      | Scale-to-zero, low traffic ≈ $0–5/mo |
| Inferencia     | Depends on your instance/plan       |
| Supabase       | Free tier available                  |
| Gemini (optional) | Free tier for embeddings         |
| Secret Manager | Typically &lt;$1/mo                  |

## Docker

Locally the app listens on 3000 (Next.js default when PORT is unset). On Cloud Run it uses 8080.

```bash
docker build -t lgportfolio .

docker run -p 3000:3000 \
  -e INFERENCIA_API_KEY=your-key \
  -e INFERENCIA_BASE_URL=https://your-llm-endpoint.example.com/v1 \
  lgportfolio
```

## Deployment (GCP Cloud Run only)

All deployment is **Cloud Build → Cloud Run**. Push to `main` triggers build and deploy to the production Cloud Run service (gimenez.dev). Ensure only Cloud Build is connected to this repo for deploys.

- **Docs:** [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md), [AGENTS.md](./AGENTS.md)
- **Terraform (infra only):** `cd terraform && terraform init && terraform plan -var="project_id=YOUR_PROJECT" && terraform apply`

## Scripts

| Command         | Description        |
|----------------|--------------------|
| `npm run dev`  | Dev server         |
| `npm run build`| Production build   |
| `npm run start`| Production server  |
| `npm run lint` | ESLint             |

## Production readiness

- **Build:** `output: "standalone"` for minimal Cloud Run image; `npm run build` must pass.
- **Security:** Security headers (CSP, HSTS, X-Frame-Options) in `next.config.ts`; rate limiting and prompt-injection defense in chat; secrets via GCP Secret Manager in prod.
- **Health:** `/api/health` used by uptime checks; returns 503 when degraded.
- **Telemetry:** Structured JSON logs to stdout (Cloud Logging); trace IDs for Cloud Trace; in-memory metrics for War Room.
- **Node:** `engines.node` set to `>=20.9.0`; use same major in Cloud Run/Docker for consistency.

## Author

**Luis Gimenez**
- Email: luisgimenezdev@gmail.com
- GitHub: [@menezmethod](https://github.com/menezmethod)
- LinkedIn: [linkedin.com/in/gimenezdev](https://www.linkedin.com/in/gimenezdev)
- Twitter: [@menezmethod](https://twitter.com/menezmethod)

---

Built with care; this repo is also a small case study in cloud and AI integration.
