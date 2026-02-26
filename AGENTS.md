# AGENTS.md

**For AI agents (Cursor, Claude Code, OpenClaw, etc.):** Read this file first. It defines how to run, build, deploy, debug, view logs, use admin APIs, and what constraints to follow (free-tier, security, no tests). Use it as the single source of truth for agent tasks in this repo.

---

## Cursor Cloud specific instructions

### Overview

This is a **Next.js 16 portfolio site** (`gimenez.dev`) with an AI chat feature and live War Room observability dashboard. Single Next.js process deployed on **GCP Cloud Run** behind a **Global External Application Load Balancer** with Cloud CDN and Cloud Armor.

### Deployment (auto-deploy on)

**Push to `main` = deploy.** Cloud Build is connected to the repo; each push to `main` triggers a build that:

1. Builds the Docker image (Dockerfile uses `--platform=linux/amd64` for Cloud Run).
2. Pushes to Artifact Registry (`portfolio/app`).
3. Deploys to Cloud Run with `--set-secrets` for `INFERENCIA_API_KEY` and `INFERENCIA_BASE_URL` from Secret Manager.

So: **code, docs, and build fixes → commit and push to main**; the next build will deploy. **You do not need to run `docker build` / `docker push` / `gcloud run services update` manually** when auto-deploy is on. Use that manual flow only if the Cloud Build trigger isn't connected or you need a one-off deploy without pushing. No need to run Terraform for app-only changes. Use Terraform only when changing infrastructure (LB, WAF, DNS, monitoring). Analytics: **Google Analytics 4 only** (optional `NEXT_PUBLIC_GA_MEASUREMENT_ID`).

### Running the app

- **Node:** 20.9+ required (see `engines` in `package.json`).
- `npm run dev` — starts dev server on port 3000
- `npm run build` — production build (standalone output for Cloud Run)
- `npm run lint` — ESLint (currently 0 errors, 0 warnings)

### Key routes

| Route | Type | Description |
|---|---|---|
| `/` | Static | Homepage with hero + 3 pillar sections |
| `/war-room` | Static | Live observability dashboard (auto-refreshes 10s) |
| `/work` | Static | Selected work / projects |
| `/architecture` | Static | Cloud Run architecture case study |
| `/about` | Static | Professional profile |
| `/contact` | Static | Contact info + resume |
| `/chat` | Static | AI chat UI |
| `/api/chat` | Dynamic | LLM inference endpoint (rate limited) |
| `/api/health` | Dynamic | Health check (used by uptime checks) |
| `/api/war-room/data` | Dynamic | War Room metrics JSON (10s cache) |
| `/api/rag` | Dynamic | RAG retrieval endpoint |
| `/admin/conversations` | Static | Admin: list/view chat sessions (requires `ADMIN_SECRET`) |
| `/admin/logs` | Static | Admin: view Cloud Run logs (requires `ADMIN_SECRET`) |
| `/api/admin/sessions` | Dynamic | Admin API: list sessions (header `X-Admin-Secret`) |
| `/api/admin/sessions/[id]` | Dynamic | Admin API: session + messages (header `X-Admin-Secret`) |
| `/api/admin/logs` | Dynamic | Admin API: recent Cloud Run logs (header `X-Admin-Secret`) |

### Environment variables

- Copy `.env.example` to `.env.local`. All portfolio pages work without API keys.
- `INFERENCIA_API_KEY` + `INFERENCIA_BASE_URL` are needed for the AI chat. Without them, chat returns 503 but all pages work.
- In production on Cloud Run, these are set via **GCP Secret Manager** (never in env vars directly); `cloudbuild.yaml` passes them with `--set-secrets`.
- Optional: `NEXT_PUBLIC_GA_MEASUREMENT_ID` for Google Analytics 4.
- Optional: `GOOGLE_CLOUD_PROJECT` for Cloud Logging trace correlation.

### Security architecture

- **Prompt injection defense**: `src/lib/security.ts` — 30+ regex patterns (OWASP LLM01/LLM07).
- **Rate limiting**: `src/lib/rate-limit.ts` — 2 RPM per IP, 10 msgs/session, 150 LLM reqs/day.
- **Security headers**: CSP, HSTS, X-Frame-Options in `next.config.ts`.
- **Cloud Armor WAF**: Edge-level rate limiting, scanner blocking, path traversal blocking, adaptive DDoS.
- **Ingress restriction**: Cloud Run accepts traffic only from the ALB (`INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER`).

### Telemetry

- `src/lib/telemetry.ts` — In-memory metrics engine (counters, histograms, gauges, rolling time series).
- Structured JSON logging via stdout → Cloud Logging auto-ingests.
- Trace IDs in logs → Cloud Logging correlates with Cloud Trace automatically.
- Chat route is fully instrumented: per-span timing for RAG retrieval and inference.
- Metrics reset on cold start (honest — the War Room dashboard shows this).

### Analytics

- **Google Analytics 4 only.** Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local` (and in Cloud Run env if you want GA in production). Component: `src/components/GoogleAnalytics.tsx`. No third-party analytics or deploy-provider scripts.

### Repo layout

- **Root:** `README.md`, `AGENTS.md`, `package.json`, `next.config.ts`, `Dockerfile`, `cloudbuild.yaml`, `tsconfig.json`, `.env.example`, `.gitignore`. Entry docs and app config only.
- **docs/** — Secondary documentation: `DEPLOY-CLOUDRUN.md`, `SETUP.md`, `DEBUGGING_CHAT.md`, `DECISIONS.md`, `QUESTIONS.md`, `our_domain.md`. See `docs/README.md` for index.
- **scripts/** — `deploy-cloudrun.sh`, `check-ssl-cert.sh`, `disable-project-spend.sh`.
- **terraform/** — GCP IaC (Cloud Run, LB, WAF, monitoring). No legacy CRA files in `src/` (removed; see .gitignore).

### Admin & viewing logs

Admin pages and APIs are protected by **`ADMIN_SECRET`** (env or Secret Manager). Use the same secret for both UI and API.

**View logs (humans and agents):**

- **UI:** Open `/admin/logs`, enter the admin secret, then use the table (filter by time range and severity). Trace IDs link to GCP Logs Explorer. From `/admin/conversations` you can click “Logs” to get to the logs page.
- **CLI:** Use `gcloud logging read` to query Cloud Logging from the terminal or scripts:
  ```bash
  # Recent logs for the Cloud Run service (replace PROJECT_ID)
  gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="lgportfolio"' \
    --project=PROJECT_ID --limit=50 --format=json

  # Filter by severity
  gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="lgportfolio" AND severity>=ERROR' \
    --project=PROJECT_ID --limit=20 --format=json
  ```
- **API (for agents/automation):** `GET /api/admin/logs?limit=100&minutes=60&severity=ERROR` with header `X-Admin-Secret: <ADMIN_SECRET>`. Returns JSON `{ entries: [...], project_id }`. Each entry has `timestamp`, `severity`, `message`, `trace_id`, `endpoint`.

**View chat sessions:**

- **UI:** `/admin/conversations` — list sessions and open one to see the full thread.
- **CLI:** No direct gcloud command for Firestore chat data; use the admin API or Firebase console.
- **API:** `GET /api/admin/sessions?limit=50` and `GET /api/admin/sessions/<id>` with `X-Admin-Secret`.

Ensure **`GOOGLE_CLOUD_PROJECT`** is set in production so the logs API can call Cloud Logging. The Cloud Run service account must have **`roles/logging.viewer`** (Terraform: `google_project_iam_member.portfolio_logging_viewer` in `terraform/cloudrun.tf`).

### Gotchas

- No automated test suite (no `test` script in `package.json`).
- Rate limits are **enabled** in production (`RATE_LIMITS_DISABLED = false`).
- War Room data API has a 10-second server-side cache to avoid excessive metric reads.
- The chat route does NOT use Edge runtime — it uses Node.js runtime for full API access.

---

## Free-first & cost control

**Default: use free features only.** If you add anything that incurs cost (e.g. new GCP services, higher quotas), **consult before enabling**.

### What’s free vs paid

| Free (use by default) | Paid (only if you explicitly choose) |
|------------------------|--------------------------------------|
| Cloud Run (scale-to-zero, free tier) | **ALB forwarding rule (~$18/mo)** — main fixed cost |
| Cloud Logging (50 GB/mo), Trace (2.5M spans/mo), Monitoring, Uptime Checks, Error Reporting | Cloud CDN (cache egress; usually &lt;$1) |
| Cloud Armor (standard tier with ALB) | Secret Manager (2 secrets ~$0.06/mo) |
| Google-managed SSL | |

### Rate limits (aligned with free tier)

- **App** (`src/lib/rate-limit.ts`): 2 RPM per IP, 10 msgs/session, 150 LLM reqs/day. Keeps chat within free-tier usage.
- **Cloud Armor**: 60/min global, 10/min for `/api/chat`. Edge protection and abuse control.
- Do not relax these without a conscious decision; they cap usage and cost.

### Budget kill switch ($10)

If spend approaches or passes **$10**, run the kill switch to stop traffic and avoid further cost:

```bash
./scripts/disable-project-spend.sh
```

This sets Cloud Run **max instances to 0** (no more request-driven cost). The ALB and other resources remain; to stop **all** billing you must [unlink the project from the billing account](https://console.cloud.google.com/billing) (manual, Billing Admin only).

- **Recommended:** Create a **$10 billing budget** with email alerts at 50%, 90%, and 100%. When you get the alert, run the script (or unlink billing for full stop). Optional Terraform: set `billing_account_id` in `terraform.tfvars` (get ID: `gcloud billing accounts list`) and apply — see `terraform/budget.tf`. Otherwise create a budget in [Console → Billing → Budgets](https://console.cloud.google.com/billing/budgets).

---

## GCP Deployment Guide — Step by Step

This guide walks through deploying the full infrastructure from zero to production. It is written for both agents and humans.

### Prerequisites

```
gcloud CLI installed and authenticated
terraform >= 1.5 installed
A GCP project with billing enabled
Domain: gimenez.dev on Namecheap (or any registrar)
GitHub repo: menezmethod/lgportfolio
```

### Architecture

```
Internet
  → Namecheap DNS (A record → static IP)
    → Global External Application Load Balancer (L7)
      → Cloud CDN (caches static assets at Google edge)
      → Cloud Armor (WAF: rate limits, scanner blocking, DDoS)
        → Cloud Run (lgportfolio, scale-to-zero, max 1 instance)

Monitoring:
  → Uptime Checks (homepage 5min, /api/health 1min, /war-room 5min)
  → Alert Policy (notify on 2 consecutive failures)
  → Cloud Logging (structured JSON from stdout, free 50GB/mo)
  → Cloud Trace (trace IDs in logs, free 2.5M spans/mo)
  → Error Reporting (structured error logs auto-detected)
```

### Step 1: Set up GCP project

```bash
# Set your project
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable billing (must be done in GCP Console if not already)
# https://console.cloud.google.com/billing

# Enable required APIs (Terraform does this too, but good to do upfront)
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  certificatemanager.googleapis.com \
  cloudbuild.googleapis.com \
  monitoring.googleapis.com
```

### Step 2: Create secrets in Secret Manager

```bash
# Create secrets (you'll be prompted to enter the values)
echo -n "YOUR_INFERENCIA_API_KEY" | \
  gcloud secrets create inferencia-api-key --data-file=-

echo -n "YOUR_INFERENCIA_BASE_URL" | \
  gcloud secrets create inferencia-base-url --data-file=-
```

Or let Terraform handle this (Step 4).

### Step 3: Build and push the initial container image

The Terraform needs a container image to exist before it can create the Cloud Run service. Build and push one first:

```bash
# Create Artifact Registry repository
gcloud artifacts repositories create portfolio \
  --repository-format=docker \
  --location=us-east1

# Configure Docker auth
gcloud auth configure-docker us-east1-docker.pkg.dev --quiet

# Build and push
docker build -t us-east1-docker.pkg.dev/$PROJECT_ID/portfolio/app:latest .
docker push us-east1-docker.pkg.dev/$PROJECT_ID/portfolio/app:latest
```

### Step 4: Deploy Terraform

```bash
cd terraform

# Create your variables file (gitignored)
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values:
#   project_id          = "your-gcp-project-id"
#   region              = "us-east1"
#   domain              = "gimenez.dev"
#   inferencia_api_key  = "your-key"       (or "" to skip)
#   inferencia_base_url = "your-url"       (or "" to skip)

terraform init
terraform plan    # Review what will be created
terraform apply   # Type "yes" to confirm
```

This creates:
- Cloud Run service (`lgportfolio`) with ingress restricted to ALB
- Service account (`portfolio-sa`) with Secret Manager access
- Artifact Registry repository
- Secret Manager secrets (if values provided)
- Global static IP address
- Serverless NEG → Cloud Run
- Backend service with Cloud CDN enabled
- Cloud Armor WAF policy (6 rules + adaptive DDoS)
- URL map + HTTP→HTTPS redirect
- Google-managed SSL certificate
- HTTPS/HTTP forwarding rules
- 3 uptime checks + alert policy

### Step 5: Get the load balancer IP

```bash
terraform output load_balancer_ip
# Example output: 34.120.xxx.xxx
```

Save this IP — you need it for DNS.

### Step 6: Configure Namecheap DNS

1. Log into **Namecheap** → Domain List → `gimenez.dev` → Manage
2. Go to **Advanced DNS** tab
3. **Delete** any existing A or CNAME records for `@` and `www`
4. Add these records:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | `<load_balancer_ip>` | Automatic |
| CNAME | `www` | `gimenez.dev.` | Automatic |

5. Save changes

### Step 7: Wait for SSL certificate

Google-managed SSL certificates auto-provision once DNS points to the LB IP. This takes **5 minutes to 24 hours** (usually under 1 hour). **https://gimenez.dev will not work until status is ACTIVE.**

Check status:
```bash
./scripts/check-ssl-cert.sh
```
Or: `gcloud compute ssl-certificates describe portfolio-ssl-cert --global` — look for `status: ACTIVE`.

### Step 8: Connect Cloud Build to GitHub (auto-deploy)

**If auto-deploy is already set:** Pushing to `main` deploys the app. Cloud Build runs `cloudbuild.yaml`: builds the image (amd64), pushes to Artifact Registry, deploys to Cloud Run with Inferencia secrets. No Terraform needed for code-only changes.

**If not yet connected — Option A: Cloud Run Console UI (recommended)**
1. Go to https://console.cloud.google.com/run
2. Click on `lgportfolio` service
3. Click "Set up continuous deployment"
4. Select **Cloud Build** as provider
5. Connect your GitHub repo `menezmethod/lgportfolio`
6. Branch: `^main$`
7. Build configuration: **Cloud Build configuration file** → `cloudbuild.yaml`
8. Click "Save"

**Option B: gcloud CLI**
```bash
# Connect GitHub repo first (follow interactive prompts)
gcloud builds repositories create lgportfolio-repo \
  --remote-uri=https://github.com/menezmethod/lgportfolio \
  --connection=github-connection \
  --region=us-east1

# Create trigger
gcloud builds triggers create github \
  --name="deploy-portfolio" \
  --repo-name="lgportfolio" \
  --repo-owner="menezmethod" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region=us-east1 \
  --substitutions="_REGION=us-east1,_SERVICE_NAME=lgportfolio,_AR_REPO=portfolio"
```

**Cloud Build service account permissions:**
```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud Run Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/run.admin"

# Grant Service Account User (to act as the Cloud Run SA)
gcloud iam service-accounts add-iam-policy-binding \
  portfolio-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/iam.serviceAccountUser"

# Grant Artifact Registry Writer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CB_SA}" \
  --role="roles/artifactregistry.writer"
```

### Step 9: Verify deployment

```bash
# Check Cloud Run service
gcloud run services describe lgportfolio --region=us-east1

# Test health endpoint (via ALB)
curl -s https://gimenez.dev/api/health | python3 -m json.tool

# Test War Room data
curl -s https://gimenez.dev/api/war-room/data | python3 -m json.tool

# Check uptime checks
gcloud monitoring uptime list-configs

# Check Cloud Armor policy
gcloud compute security-policies describe portfolio-waf-policy

# Check SSL cert status (or: ./scripts/check-ssl-cert.sh)
gcloud compute ssl-certificates describe portfolio-ssl-cert --global
```

### Step 10: Verify monitoring is working

1. **Cloud Logging**: Go to https://console.cloud.google.com/logs → filter by `resource.type="cloud_run_revision"` → you should see structured JSON logs with severity, trace_id, endpoint, latency_ms fields.

2. **Uptime Checks**: Go to https://console.cloud.google.com/monitoring/uptime → you should see 3 checks (Homepage, Health API, War Room) all green.

3. **Cloud Armor**: Go to https://console.cloud.google.com/net-security/securitypolicies → `portfolio-waf-policy` → Logs tab → you should see request logs with rule evaluations.

4. **War Room Dashboard**: Visit https://gimenez.dev/war-room → all status tiles should be green, metrics should populate as traffic flows.

---

## Endpoints Reference

| Endpoint | Method | Auth | Rate Limit | Cache | Purpose |
|---|---|---|---|---|---|
| `https://gimenez.dev/` | GET | Public | 60/min (Cloud Armor) | CDN 1hr | Homepage |
| `https://gimenez.dev/war-room` | GET | Public | 60/min | CDN 1hr | Live dashboard |
| `https://gimenez.dev/api/health` | GET | Public | 60/min | None | Health check for uptime monitoring |
| `https://gimenez.dev/api/war-room/data` | GET | Public | 60/min | 10s server | Dashboard metrics JSON |
| `https://gimenez.dev/api/chat` | POST | Public | 10/min (Cloud Armor) + 2/min (app) | None | LLM chat inference |
| `https://gimenez.dev/api/rag` | POST | Public | 60/min | None | RAG context retrieval |

### Health endpoint response

```json
{
  "status": "healthy",
  "timestamp": "2026-02-26T01:31:29.696Z",
  "uptime_seconds": 607,
  "checks": {
    "inference_api": { "status": "up", "latency_ms": 45 },
    "rag_system": { "status": "up", "latency_ms": 12 },
    "rate_limiter": { "status": "up", "budget_remaining": 899 },
    "cloud_logging": { "status": "up" },
    "cloud_trace": { "status": "up" }
  },
  "version": "1.0.0",
  "region": "us-east1"
}
```

---

## Observability Products Active

| GCP Product | What It Does Here | Free Tier |
|---|---|---|
| **Cloud Logging** | Ingests structured JSON from stdout. Searchable by severity, trace_id, endpoint. | 50 GB/month |
| **Cloud Trace** | Correlates via `logging.googleapis.com/trace` field in logs. | 2.5M spans/month |
| **Cloud Monitoring** | Uptime checks, Cloud Run built-in metrics (CPU, memory, request count, latency). | Free tier |
| **Error Reporting** | Auto-detects structured error logs with severity=ERROR. | Free |
| **Uptime Checks** | 3 checks: homepage (5min), /api/health (1min), /war-room (5min). | 100 free |
| **Cloud Armor** | WAF at edge: rate limiting, scanner blocking, path traversal, adaptive DDoS. | Standard tier (included with ALB) |
| **Cloud CDN** | Caches static pages at Google edge. Reduces Cloud Run invocations. | Pay per cache fill |
| **Cloud Run metrics** | Instance count, CPU, memory, request count, latency, cold starts. Built-in, free. | Free |

### How structured logging works (no SDK needed)

The app writes JSON to stdout. Cloud Run forwards stdout to Cloud Logging automatically. The `severity` field maps to Cloud Logging severity levels. The `logging.googleapis.com/trace` field (set in `src/lib/telemetry.ts`) links logs to Cloud Trace.

```
App (JSON to stdout) → Cloud Run → Cloud Logging → Cloud Trace (via trace_id)
                                                  → Error Reporting (via severity=ERROR)
```

No `@google-cloud/*` packages needed. This is the recommended approach for Cloud Run.

---

## Cost Summary

| Component | Monthly Cost |
|---|---|
| Cloud Run (free tier, scale-to-zero) | $0 |
| ALB forwarding rule | ~$18 |
| Cloud CDN cache operations | ~$0.01-0.10 |
| Cloud Armor (standard tier) | included with ALB |
| Google-managed SSL | $0 |
| Secret Manager (2 secrets) | ~$0.06 |
| Cloud Logging (under 50GB) | $0 |
| Cloud Trace (under 2.5M spans) | $0 |
| Uptime Checks (3 checks) | $0 |
| **Total** | **~$18-20/month** |

---

## Troubleshooting

**Site not loading / gimenez.dev not visible**: Usually the SSL certificate is still PROVISIONING. Run `./scripts/check-ssl-cert.sh`; when it shows ACTIVE, https://gimenez.dev will work. If DNS is wrong, fix the A record first (see Step 6).

**SSL certificate stuck in PROVISIONING**: DNS must point to the LB IP first. Check: `dig gimenez.dev` should return the static IP. Can take up to 24 hours but usually under 1 hour.

**Chat returns 503 (“LLM is not configured”)**: The running Cloud Run revision must have `INFERENCIA_API_KEY` and `INFERENCIA_BASE_URL` from Secret Manager. Ensure secrets exist and match your `.env.local` values, then redeploy so the new revision gets them: `cloudbuild.yaml` uses `--set-secrets=INFERENCIA_API_KEY=inferencia-api-key:latest,INFERENCIA_BASE_URL=inferencia-base-url:latest`. Verify secrets: `gcloud secrets versions access latest --secret=inferencia-api-key`. Check logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=lgportfolio" --limit=20 --format=json`.

**Startup probe / “exec format error”**: Image was built for wrong CPU arch (e.g. ARM on Mac). Cloud Run needs linux/amd64. The Dockerfile uses `--platform=linux/amd64`; deploy via Cloud Build (amd64) or build locally with that platform, then deploy so the new revision has both the correct image and secrets.
</think>
Checking Cloud Build SA permissions for Secret Manager (needed for --set-secrets):
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
WebSearch

**Cloud Build trigger not firing**: Verify the trigger is connected to the right branch (`^main$`). Check Cloud Build history at https://console.cloud.google.com/cloud-build/builds.

**Rate limit hitting too fast**: Cloud Armor applies at edge (60/min global, 10/min for `/api/chat`). The app has additional limits (2/min per IP for chat). Both layers are intentional.

**Metrics reset to zero**: Expected. In-memory metrics reset on Cloud Run cold start (scale-to-zero). The War Room dashboard shows this honestly.

**Cloud Armor rules not working**: Verify the security policy is attached to the backend service: `gcloud compute backend-services describe portfolio-backend --global`.
