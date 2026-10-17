# Cloud Run deployment checklist

**Free-first:** Default setup keeps the custom domain live via the ALB. Low-cost mode is optional and should only be used if you are okay serving the site from the Cloud Run URL or another front door. See [AGENTS.md](../AGENTS.md) § Free-first & cost control. **Budget kill switch:** $20 budget in Terraform; when exceeded, Pub/Sub → Cloud Function scales Cloud Run to 0. Manual: `./scripts/disable-project-spend.sh`.

You’re authenticated and the project is set. Follow these in order. Full details are in [AGENTS.md](../AGENTS.md).

## 1. Environment tag (done)

Tag the project with `environment: Production` in GCP Console if prompted.

## 2. Enable APIs

If not already enabled, run:

```bash
export PROJECT_ID=YOUR_PROJECT_ID
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  certificatemanager.googleapis.com \
  cloudbuild.googleapis.com \
  monitoring.googleapis.com \
  --project=$PROJECT_ID
```

## 3. Secrets (optional for chat)

Only needed if you want the AI chat to work in production:

```bash
echo -n "YOUR_INFERENCIA_API_KEY" | gcloud secrets create inferencia-api-key --data-file=- --project=YOUR_PROJECT_ID
echo -n "YOUR_INFERENCIA_BASE_URL" | gcloud secrets create inferencia-base-url --data-file=- --project=YOUR_PROJECT_ID
```

Or leave them empty in Terraform and add later.

## 4. Artifact Registry + first image

Terraform expects an image to exist before creating the Cloud Run service. The Dockerfile uses `--platform=linux/amd64` so images work on Cloud Run (required when building on ARM, e.g. Mac).

```bash
export PROJECT_ID=YOUR_PROJECT_ID
gcloud artifacts repositories create portfolio --repository-format=docker --location=us-east1 --project=$PROJECT_ID 2>/dev/null || true
gcloud auth configure-docker us-east1-docker.pkg.dev --quiet
docker build -t us-east1-docker.pkg.dev/$PROJECT_ID/portfolio/app:latest .
docker push us-east1-docker.pkg.dev/$PROJECT_ID/portfolio/app:latest
```

## 5. Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: set project_id = "YOUR_PROJECT_ID", region = "us-east1", domain = "gimenez.dev"
# Leave enable_load_balancer = true for custom-domain production
# Set enable_load_balancer = false only if you intentionally want low-cost mode and accept losing the ALB-backed domain
# Set inferencia_api_key / inferencia_base_url or "" to skip
terraform init
terraform plan
terraform apply
```

## 6. DNS

By default, after `terraform apply`, get the LB IP and point your domain to it:

```bash
terraform output load_balancer_ip
```

If you intentionally switch to low-cost mode later, the direct Cloud Run URL is:

```bash
terraform output public_base_url
```

## 7. Continuous deployment (Terraform-managed triggers)

Production and PR preview pipelines are defined in Terraform (`terraform/cloudbuild.tf`) and build configs at the repo root:

| Trigger | Config | Target service | When |
|---------|--------|----------------|------|
| `deploy-portfolio-production` | `cloudbuild.yaml` | `lgportfolio` | Push to `main` |
| `deploy-portfolio-preview` | `cloudbuild-preview.yaml` | `lgportfolio-preview` | Pull request open/update |

**Default:** triggers are **off** in `terraform.tfvars.example` because Coolify hosts production. Enable when rolling back to GCP:

```hcl
enable_cloud_build_triggers           = true
enable_cloud_build_production_trigger = true
enable_cloud_build_preview_trigger    = false  # opt-in; PR previews use direct Run URL
```

After `terraform apply`, connect the GitHub repo in Cloud Build if not already linked (Console → Cloud Build → Repositories, or see AGENTS.md **Step 8**).

Preview URL (when enabled): `terraform output cloud_run_preview_url` — public ingress, scale-to-zero, no ALB cost.

Each deploy uses `--set-secrets` so revisions get Inferencia, Firebase, and admin secrets from Secret Manager. For "exec format error" or chat 503, see AGENTS.md **Troubleshooting**. Use the manual docker/gcloud flow only if triggers are disabled or you need a one-off deploy.

---

**Quick reference:** [AGENTS.md](../AGENTS.md) — full architecture, endpoints, troubleshooting, cost (~$18–20/mo).


## 8. Cloud Build service account

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

## 9. Cost control (GCP path)

**Default: use free features only.** If you add anything that incurs cost (e.g. new GCP services, higher quotas), **consult before enabling**.

#### What’s free vs paid

| Free (use by default) | Paid (only if you explicitly choose) |
|------------------------|--------------------------------------|
| Cloud Run (scale-to-zero, free tier) | **ALB forwarding rule (~$18/mo)** — optional edge-mode fixed cost |
| Cloud Logging (50 GB/mo), Trace (2.5M spans/mo), Monitoring, Uptime Checks, Error Reporting | Cloud CDN (cache egress; usually &lt;$1) |
| Cloud Armor (standard tier with ALB) | Secret Manager (2 secrets ~$0.06/mo) |
| Artifact Registry storage (trimmed via cleanup policies) | Extra image churn from unmanaged source-deploy repos |
| Google-managed SSL | |

#### Rate limits (aligned with free tier)

- **App** (`src/lib/rate-limit.ts`): defaults 6 RPM per IP, 30 msgs/session, 150 LLM reqs/day, configurable with `CHAT_MAX_RPM_PER_IP`, `CHAT_MAX_MESSAGES_PER_SESSION`, `CHAT_DAILY_BUDGET` (`getChatLimits()`; the chat page reads the effective values from `GET /api/chat/storage`). Keeps chat within free-tier usage.
- **Cloud Armor** (`terraform/security.tf`): active only in edge mode. Low-cost mode relies on app-level rate limits. **Admin** requests to `/api/admin/*` with header `X-Admin-Secret` are still protected by the app. See **`docs/TRAFFIC-AND-COST.md`** for full rate-limit and caching audit (traffic-spike readiness).

#### Budget kill switch ($20)

**Automatic (when budget is in Terraform):** If `billing_account_id` and `budget_alert_email` are set in `terraform.tfvars` and you apply, a **$20 budget** is created with email alerts at 50%, 90%, and 100%. Budget alerts are also published to Pub/Sub; a **Cloud Function** (`budget-kill`) subscribes and **automatically** sets Cloud Run **max-instances=0** when a threshold is exceeded. No manual step required — e.g. if you're away and traffic or abuse spikes, the function scales the service to zero and stops request-driven cost. See `terraform/budget.tf` and `terraform/budget-kill.tf`.

**Manual:** If the budget isn't configured in Terraform, or you want to run the same action by hand:

```bash
./scripts/disable-project-spend.sh
```

This sets Cloud Run **max instances to 0**. The ALB and other resources remain; to stop **all** billing you must [unlink the project from the billing account](https://console.cloud.google.com/billing) (manual, Billing Admin only).

## 10. Troubleshooting (GCP path)

**Site not loading / gimenez.dev not visible**: Usually the SSL certificate is still PROVISIONING. Run `./scripts/check-ssl-cert.sh`; when it shows ACTIVE, https://gimenez.dev will work. If DNS is wrong, fix the A record first (see Step 6).

**SSL certificate stuck in PROVISIONING**: DNS must point to the LB IP first. Check: `dig gimenez.dev` should return the static IP. Can take up to 24 hours but usually under 1 hour.

**Chat returns 503 (“LLM is not configured”)**: The running Cloud Run revision must have `INFERENCIA_API_KEY` and `INFERENCIA_BASE_URL` from Secret Manager. Ensure secrets exist and match your `.env.local` values, then redeploy so the new revision gets them: `cloudbuild.yaml` uses `--set-secrets=INFERENCIA_API_KEY=inferencia-api-key:latest,INFERENCIA_BASE_URL=inferencia-base-url:latest`. Verify secrets: `gcloud secrets versions access latest --secret=inferencia-api-key`. Check logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=lgportfolio" --limit=20 --format=json`.

**Startup probe / “exec format error”**: Image was built for wrong CPU arch (e.g. ARM on Mac). Cloud Run needs linux/amd64. The Dockerfile uses `--platform=linux/amd64`; deploy via Cloud Build (amd64) or build locally with that platform, then deploy so the new revision has both the correct image and secrets.

**Cloud Build trigger not firing**: Verify the trigger is connected to the right branch (`^main$`). Check Cloud Build history at https://console.cloud.google.com/cloud-build/builds.

**Rate limit hitting too fast**: Cloud Armor applies at edge (180/min global, 10/min for `/api/chat`). The app has additional limits (6/min per IP for chat). Both layers are intentional.

**Metrics reset to zero**: Expected. In-memory metrics reset on Cloud Run cold start (scale-to-zero). The War Room dashboard shows this honestly.

**Cloud Armor rules not working**: Verify the security policy is attached to the backend service: `gcloud compute backend-services describe portfolio-backend --global`.
