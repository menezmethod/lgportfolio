# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **Next.js 16 portfolio site** (`gimenez.dev`) with an AI chat feature and live War Room observability dashboard. Single Next.js process deployed on **GCP Cloud Run** behind a **Global External Application Load Balancer** with Cloud CDN and Cloud Armor.

### Running the app

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

### Environment variables

- Copy `.env.example` to `.env.local`. All portfolio pages work without API keys.
- `INFERENCIA_API_KEY` + `INFERENCIA_BASE_URL` are needed for the AI chat. Without them, chat returns 503 but all pages work.
- In production on Cloud Run, these are set via **GCP Secret Manager** (never in env vars directly).
- Optional: `GOOGLE_CLOUD_PROJECT` for Cloud Logging trace correlation.

### Security architecture

- **Prompt injection defense**: `src/lib/security.ts` — 30+ regex patterns (OWASP LLM01/LLM07).
- **Rate limiting**: `src/lib/rate-limit.ts` — 2 RPM per IP, 10 msgs/session, 150 LLM reqs/day.
- **Security headers**: CSP, HSTS, X-Frame-Options in `next.config.ts`.
- **Cloud Armor WAF**: Edge-level rate limiting, scanner blocking, path traversal blocking, adaptive DDoS.
- **Ingress restriction**: Cloud Run accepts traffic only from the ALB (`INGRESS_TRAFFIC_INTERNAL_AND_GCLB`).

### Telemetry

- `src/lib/telemetry.ts` — In-memory metrics engine (counters, histograms, gauges, rolling time series).
- Structured JSON logging via stdout → Cloud Logging auto-ingests.
- Trace IDs in logs → Cloud Logging correlates with Cloud Trace automatically.
- Chat route is fully instrumented: per-span timing for RAG retrieval and inference.
- Metrics reset on cold start (honest — the War Room dashboard shows this).

### Gotchas

- No automated test suite (no `test` script in `package.json`).
- Rate limits are **enabled** in production (`RATE_LIMITS_DISABLED = false`).
- War Room data API has a 10-second server-side cache to avoid excessive metric reads.
- The chat route does NOT use Edge runtime — it uses Node.js runtime for full API access.

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

Google-managed SSL certificates auto-provision once DNS points to the LB IP. This takes **5 minutes to 24 hours** (usually under 1 hour).

Check status:
```bash
gcloud compute ssl-certificates describe portfolio-ssl-cert --global
# Look for: status: ACTIVE
```

### Step 8: Connect Cloud Build to GitHub

**Option A: Cloud Run Console UI (recommended)**
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

# Check SSL cert status
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
  "version": "3.0.0",
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

**SSL certificate stuck in PROVISIONING**: DNS must point to the LB IP first. Check: `dig gimenez.dev` should return the static IP. Can take up to 24 hours but usually under 1 hour.

**502 Bad Gateway**: Cloud Run service not responding. Check: `gcloud run services describe lgportfolio --region=us-east1` for revision status. Check Cloud Logging for errors.

**Cloud Build trigger not firing**: Verify the trigger is connected to the right branch (`^main$`). Check Cloud Build history at https://console.cloud.google.com/cloud-build/builds.

**Rate limit hitting too fast**: Cloud Armor applies at edge (60/min global, 10/min for `/api/chat`). The app has additional limits (2/min per IP for chat). Both layers are intentional.

**Metrics reset to zero**: Expected. In-memory metrics reset on Cloud Run cold start (scale-to-zero). The War Room dashboard shows this honestly.

**Cloud Armor rules not working**: Verify the security policy is attached to the backend service: `gcloud compute backend-services describe portfolio-backend --global`.
