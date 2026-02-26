# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **Next.js 16 portfolio site** (`gimenez.dev`) with:
- A production AI chat endpoint (`/api/chat`)
- A CLI-driven chat evaluation endpoint (`/api/chat/eval`)
- A live observability dashboard (`/war-room`)

Deployment target is **GCP Cloud Run** behind a **Global External Application Load Balancer** with Cloud CDN + Cloud Armor.

### Deployment (auto-deploy)

**Push to `main` = deploy.** Cloud Build is connected to the repository and performs:
1. Docker build (`linux/amd64`)
2. Push to Artifact Registry (`portfolio/app`)
3. Cloud Run deploy with Secret Manager references:
   - `INFERENCIA_API_KEY`
   - `INFERENCIA_BASE_URL`

Use Terraform only for infrastructure changes (LB/WAF/monitoring/Cloud Run config), not normal app code changes.

### Source-of-truth chat infrastructure

For this website:
- Chat is powered by **gpt-oss** through an OpenAI-compatible endpoint.
- The production model host is a **local MacBook Pro M4 Max (128GB)**.

Luis may run OpenClaw/agent experiments on Raspberry Pi/Zero 2 W/Pico-class hardware as a hobby. Those devices are **not** the production chat host for `gimenez.dev`.

### Local development

- `npm run dev` — starts dev server on port 3000
- `npm run build` — production build
- `npm run lint` — ESLint

### Key routes

| Route | Type | Purpose |
|---|---|---|
| `/` | Static | Homepage |
| `/war-room` | Static | Observability dashboard |
| `/work` | Static | Projects/case studies |
| `/architecture` | Static | Cloud architecture page |
| `/about` | Static | Professional profile |
| `/contact` | Static | Contact + resume |
| `/chat` | Static | Chat UI |
| `/api/chat` | Dynamic | Main chat inference endpoint |
| `/api/chat/eval` | Dynamic | Recruiter/security eval harness for CLI |
| `/api/rag` | Dynamic | Context retrieval endpoint |
| `/api/health` | Dynamic | Health check |
| `/api/war-room/data` | Dynamic | War Room metrics JSON |

### Environment variables

Required for chat:
- `INFERENCIA_API_KEY`
- `INFERENCIA_BASE_URL`
- Optional `INFERENCIA_CHAT_MODEL` (defaults to `mlx-community/gpt-oss-20b-MXFP4-Q8`)

Rate limits:
- `CHAT_MAX_RPM_PER_IP` (default 2)
- `CHAT_MAX_MESSAGES_PER_SESSION` (default 10)
- `NEXT_PUBLIC_CHAT_MAX_MESSAGES` (default 10)
- `CHAT_DAILY_BUDGET` (default 150)

Eval endpoint hardening:
- Optional `CHAT_EVAL_TOKEN` to require authenticated eval requests (`x-chat-eval-token`).
- Without token, eval is still rate-limited and non-privileged (lower max case count).

Optional:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (GA4 only)
- `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_REGION` (trace correlation metadata)

### Security architecture

- Prompt injection and message validation: `src/lib/security.ts`
- Chat system prompt + provider validation: `src/lib/chat-config.ts`
- Rate limiting + budget controls: `src/lib/rate-limit.ts`
- Security headers and CSP: `next.config.ts`
- Cloud Armor WAF policy: `terraform/security.tf`
- Ingress restriction to LB path: Cloud Run ingress `internal-and-cloud-load-balancing`

### Observability

- `src/lib/telemetry.ts`:
  - JSON structured logs to stdout → Cloud Logging
  - In-memory counters/histograms/time-series for `/war-room`
  - Trace ID propagation via `logging.googleapis.com/trace`

Notes:
- Metrics are in-memory and reset on cold start by design.
- War Room should reflect that honestly.

### Terraform baseline

Terraform defines:
- Cloud Run service + service account
- Artifact Registry
- Secret Manager secrets + IAM bindings
- Global ALB + CDN + Cloud Armor
- Uptime checks + alert policy
- Optional billing budget

Use:
- `terraform fmt -check`
- `terraform init`
- `terraform validate`

before applying changes.

### Cost posture (free-first)

Primary monthly fixed cost is ALB forwarding rule (~$18). Cloud Run often stays in free tier for low traffic.

Recommended budget guardrail:
- Create budget alerts at 50/90/100%
- Use kill switch at threshold:

```bash
./scripts/disable-project-spend.sh
```

### Quick verification checklist

After app changes:
1. `npm run lint`
2. `npm run build`
3. Start dev server and run CLI eval:
   - `./scripts/run-chat-eval.sh --base-url http://localhost:3000`

After deployment:
1. Confirm Cloud Build completed
2. Check:
   - `curl -s https://gimenez.dev/api/health`
   - `curl -s https://gimenez.dev/api/war-room/data`
3. Validate one or two recruiter prompts via API:
   - `curl -s https://gimenez.dev/api/chat ...`

### Troubleshooting

**Chat returns 503**
- Verify `INFERENCIA_API_KEY` + `INFERENCIA_BASE_URL` secrets exist and are wired in deploy.
- Check Cloud Run logs for provider connection errors.

**Eval endpoint returns 403**
- Set `CHAT_EVAL_TOKEN` and pass `x-chat-eval-token`.
- If token is configured in Cloud Run, unauthenticated eval requests are rejected by design.

**Build works locally but not on Cloud Run**
- Ensure image architecture is `linux/amd64` and Cloud Build is used for production deploys.

**Cloud Armor behavior unexpected**
- Verify backend service attachment:
  `gcloud compute backend-services describe portfolio-backend --global`
