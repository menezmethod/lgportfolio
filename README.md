# Luis Gimenez Portfolio (`gimenez.dev`)

Next.js 16 portfolio with a production AI chat and a live observability dashboard.

## Reality-first architecture

- Chat endpoint (`/api/chat`) uses an OpenAI-compatible backend.
- Production model is **gpt-oss** hosted on a **local MacBook Pro M4 Max (128GB)**.
- This repo focuses on honest contribution framing, security guardrails, and low-cost GCP deployment.

## Core features

- Next.js 16 App Router + TypeScript
- Streaming chat API with strict scope guardrails
- Local knowledge-base retrieval (`src/lib/knowledge.ts` + `src/lib/rag.ts`)
- Prompt-injection filters and message validation
- Rate limiting + daily budget protection
- `/api/chat/eval` endpoint for recruiter/security evaluation runs
- War Room dashboard (`/war-room`) with in-memory telemetry
- Terraform infrastructure for Cloud Run + ALB + Cloud Armor + monitoring

## Quick start

```bash
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio
npm install
cp .env.example .env.local
npm run dev
```

Open:
- `http://localhost:3000`
- `http://localhost:3000/chat`

## Required environment variables

| Variable | Required | Purpose |
|---|---|---|
| `INFERENCIA_BASE_URL` | Yes (for chat) | OpenAI-compatible base URL |
| `INFERENCIA_API_KEY` | Yes (for chat) | API key for chat backend |
| `INFERENCIA_CHAT_MODEL` | No | Model ID (default `mlx-community/gpt-oss-20b-MXFP4-Q8`) |
| `CHAT_EVAL_TOKEN` | No | Protects remote access to `/api/chat/eval` |
| `CHAT_MAX_RPM_PER_IP` | No | Per-IP request cap (default 2) |
| `CHAT_MAX_MESSAGES_PER_SESSION` | No | Session cap (default 10) |
| `NEXT_PUBLIC_CHAT_MAX_MESSAGES` | No | Client-side session cap display |
| `CHAT_DAILY_BUDGET` | No | Daily LLM budget cap (default 150) |

Optional:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (GA4)
- `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION` (trace metadata)

## CLI evaluation workflow (no GUI needed)

Run recruiter/security checks through backend API:

```bash
./scripts/run-chat-eval.sh --base-url http://localhost:3000
```

Optional flags:
- `--token <CHAT_EVAL_TOKEN>`
- `--max-cases 7`
- `--case-ids team_scope_honesty,prompt_injection_refusal`
- `--include-responses`

## Quality checks

```bash
npm run lint
npm run build
```

## Deployment model

Push to `main` triggers Cloud Build:
1. Build amd64 image
2. Push Artifact Registry image
3. Deploy Cloud Run revision with Secret Manager references

Infra and security controls are in `terraform/`.

## Cost profile (approximate)

- ALB fixed cost: ~$18/month (main fixed spend)
- Cloud Run: often within free tier for low traffic
- Secret Manager + CDN ops: low additional cost
- Typical total: **~$18-20/month**

## Important docs

- `AGENTS.md` — Cloud agent and deployment guidance
- `DEPLOY-CLOUDRUN.md` — deployment checklist
- `SECURITY_REVIEW.md` — security/recruiter audit findings and mitigations
