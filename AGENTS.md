# AGENTS.md

Read this file first. It says how to run, build, test, and deploy this repo, and which constraints apply (free tier, security, truthful content).

## Overview

A **Next.js 16 portfolio site** (`gimenez.dev`) with an AI chat and a live War Room observability dashboard.

- **Production:** Coolify on a free-tier cloud VM, behind Cloudflare DNS and proxy. Merge to `main` → CI passes → CI calls the Coolify API to deploy (see `docs/DEPLOY-COOLIFY.md`).
- **Chat:** retrieval on Cloudflare Vectorize, generation on Workers AI, through the `lgportfolio-rag` worker in `workers/rag/`.
- **GCP rollback path (not live):** `terraform/`, `cloudbuild.yaml`, and `Dockerfile` can still deploy to Cloud Run. See `docs/DEPLOY-CLOUDRUN.md`, which also has the GCP cost controls and troubleshooting.

## Running the app

- **Node:** see `engines` in `package.json`.
- `npm run dev` starts the dev server on port 3000.
- `npm run build` makes a production build (`standalone` output for Docker/Coolify, see `next.config.ts`).
- `npm run lint` runs ESLint.
- `npm run test` runs the Vitest unit tests. `npm run test:e2e` runs Cypress.

**Before every commit:** run `npm run build`, `npm run lint`, and `npm run test`. CI (`.github/workflows/ci.yml`) runs the same checks on every PR and push to `main`. See `docs/CI-AND-TESTS.md`.

## Routes

| Route | Description |
|---|---|
| `/` | Homepage: hero, live request trace, work, chat entry |
| `/work`, `/work/[slug]` | Case studies |
| `/about` | Professional profile |
| `/contact` | Contact info and resume |
| `/chat` | AI chat UI |
| `/war-room` | Live observability dashboard (refreshes every 60 s) |
| `/privacy` | Privacy disclosure |
| `/api/chat` | Chat inference (rate limited). Also `/api/chat/storage` (effective limits) and `/api/chat/save-email` |
| `/api/rag` | RAG retrieval |
| `/api/health`, `/api/health/live` | Health checks |
| `/api/war-room/data` | War Room metrics JSON (60 s server cache). Also `/api/war-room/explain-error` |
| `/api/analytics/page-view` | First-party page-view counter (in memory) |
| `/api/metrics` | Prometheus text format (header `X-Admin-Secret`) |
| `/admin` → `/admin/board` | Admin board: System, Recruiters, Logs, Metrics (needs `ADMIN_SECRET`) |
| `/admin/conversations`, `/admin/logs` | Admin: chat sessions, logs |
| `/api/admin/*` | Admin APIs: `sessions`, `sessions/[id]`, `logs`, `board/view`, `board/stats` (header `X-Admin-Secret`) |

## Environment variables

- Copy `.env.example` to `.env.local`. All pages work without API keys. With no chat provider, `/api/chat` returns 503.
- Copy `.env.example` to `.env.local`. All portfolio pages work without API keys.
- **Chat providers:** at least one of `CLOUDFLARE_RAG_KEY` (Workers AI), `OPENROUTER_API_KEY`, or `INFERENCIA_API_KEY` + `INFERENCIA_BASE_URL` is needed for the AI chat; with none, chat returns 503 but all pages work. `CHAT_PROVIDERS` (comma list of `inferencia`, `openrouter`, `cloudflare`) restricts chat to exactly those providers in that order and skips unconfigured ones; unset keeps the legacy order. Production sets `CHAT_PROVIDERS=cloudflare`. Workers AI uses an ordered model list, `CLOUDFLARE_CHAT_MODELS` (comma list, default `@cf/meta/llama-3.3-70b-instruct-fp8-fast,@cf/meta/llama-3.1-8b-instruct-fast`; legacy `CLOUDFLARE_CHAT_MODEL` becomes the first entry), with a first-token deadline `CLOUDFLARE_FAST_FAIL_MS` (default 3500) per model except the last (20 s); a stalled model is aborted and the next starts. Hedging: if the first Workers AI model has no first token after `CLOUDFLARE_HEDGE_MS` (default 1500, 0 = off) the second is started in parallel; the first first-token wins and the loser is aborted upstream; the daily budget is still counted once per message; the War Room shows how many answers were hedged (`chat_hedges_total`). The model that answered is in the chat log line and shown on the home trace and War Room. The chain, `/api/health`, the War Room inference tile, probes and explain-error all follow it.
- **RAG:** Cloudflare Vectorize + Workers AI embeddings (`@cf/baai/bge-m3`, 1024 dims) via the `lgportfolio-rag` worker in `workers/rag/` (deploy: `npx wrangler deploy`, secret `RAG_KEY`). App env: `CLOUDFLARE_RAG_KEY` (+ optional `CLOUDFLARE_RAG_WORKER_URL`). Index `lgportfolio-kb` (cosine). Seed/refresh: `npx tsx scripts/seed-rag-cloudflare.ts`. Without the key, file-based KB retrieval is used. Workers AI is also the last-resort chat fallback provider.
- In production on **Coolify**, set secrets in the Coolify app env. On **GCP Cloud Run**, Inferencia values come from **Secret Manager** via `cloudbuild.yaml` `--set-secrets`.
- `GOOGLE_CLOUD_PROJECT` is only for the GCP path (Cloud Logging trace links and the admin Logs tab).

## Security

- **Prompt injection defense:** `src/lib/security.ts` (OWASP LLM01/LLM07 patterns).
- **Rate limits:** `src/lib/rate-limit.ts`. Code defaults: 6 requests/min per IP, 30 messages/session, 150 LLM requests/day. Production can override them with `CHAT_MAX_RPM_PER_IP`, `CHAT_MAX_MESSAGES_PER_SESSION`, `CHAT_DAILY_BUDGET`. `GET /api/chat/storage` returns the values in effect.
- **Headers:** CSP, HSTS, X-Frame-Options and others in `next.config.ts`.
- **Webhooks:** visitor pings are HMAC-signed (`src/lib/notify.ts`).

## Telemetry and analytics

- `src/lib/telemetry.ts` is an in-memory metrics engine (counters, histograms, gauges, rolling series). It resets on restart; the War Room shows this.
- `/api/metrics` exposes it in Prometheus format. API routes call `recordRequest(endpoint, method, statusCode, durationMs)`.
- Logs are structured JSON on stdout. On Coolify, read them in the Coolify UI. On the GCP path they go to Cloud Logging (see `docs/GCP-OBSERVABILITY-MAP.md`).
- The chat route records span timings for retrieval and inference.
- Page views go to `/api/analytics/page-view` (first-party, in memory). `src/components/GoogleAnalytics.tsx` exists but is not mounted, so GA4 does not run.

## Admin

All admin pages and APIs need `ADMIN_SECRET` (header `X-Admin-Secret` for APIs).

- **Board:** `/admin/board`: War Room metrics, recruiter chat sessions with drill-down, logs, Prometheus text.
- **Sessions API:** `GET /api/admin/sessions?limit=50`, `GET /api/admin/sessions/<id>`.
- **Logs API:** `GET /api/admin/logs?limit=100&minutes=60&severity=ERROR`. It reads Google Cloud Logging, so it works only on the GCP path.

## Repo layout

- **Root:** entry docs and app config.
- **src/:** the Next.js app. **workers/rag/:** the Cloudflare RAG worker (`npx wrangler deploy`).
- **docs/:** setup, deploy, CI, ADRs (`docs/adr/`), decisions. Index in `docs/README.md`.
- **scripts/:** deploy and maintenance scripts. **terraform/:** GCP rollback infrastructure.

## Rules

- **Free first.** Ask before you add anything that costs money.
- **Truthful content.** Every claim on the site, in the chat knowledge base (`src/lib/knowledge.ts`), and in the resume must be true at the sentence level. Do not invent numbers, tools, or outcomes. Do not publish employer-internal details.
- **Commit and PR text** says what changed and why, in an engineer's voice.
- The chat route uses the Node.js runtime, not Edge.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
