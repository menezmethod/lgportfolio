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

## 7. Continuous deployment (auto-deploy on)

Auto-deploy is enabled: **push to `main`** triggers Cloud Build, which builds the image (amd64), pushes to Artifact Registry, and deploys to Cloud Run. **You do not need to run `docker build` / `docker push` / `gcloud run services update` yourself**—just push. The deploy step uses `--set-secrets` so each new revision gets `INFERENCIA_API_KEY` and `INFERENCIA_BASE_URL` from Secret Manager (chat works only if those secrets exist and are correct). See AGENTS.md **Step 8** to (re)connect or verify the trigger. For "exec format error" or chat 503, see AGENTS.md **Troubleshooting**. Use the manual docker/gcloud flow only if the trigger isn't set up or you need a one-off deploy without pushing.

---

**Quick reference:** [AGENTS.md](../AGENTS.md) — full architecture, endpoints, troubleshooting, cost (~$18–20/mo).
