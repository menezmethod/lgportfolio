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

**Default:** triggers are **off** in `terraform.tfvars.example` because Vercel hosts production. Enable when rolling back to GCP:

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
