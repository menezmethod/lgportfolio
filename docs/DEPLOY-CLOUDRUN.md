# Cloud Run deployment checklist (lgportfolio)

**Free-first:** Default setup uses free-tier features; the only significant fixed cost is the ALB (~$18/mo). See [AGENTS.md](../AGENTS.md) § Free-first & cost control. **Budget kill switch:** `./scripts/disable-project-spend.sh` if spend hits $10.

You’re authenticated and the project is set. Follow these in order. Full details are in [AGENTS.md](../AGENTS.md).

## 1. Environment tag (done)

Project `lgportfolio` is tagged `environment: Production`. The warning is resolved.

## 2. Enable APIs

If not already enabled, run:

```bash
export PROJECT_ID=lgportfolio
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
echo -n "YOUR_INFERENCIA_API_KEY" | gcloud secrets create inferencia-api-key --data-file=- --project=lgportfolio
echo -n "YOUR_INFERENCIA_BASE_URL" | gcloud secrets create inferencia-base-url --data-file=- --project=lgportfolio
```

Or leave them empty in Terraform and add later.

## 4. Artifact Registry + first image

Terraform expects an image to exist before creating the Cloud Run service. The Dockerfile uses `--platform=linux/amd64` so images work on Cloud Run (required when building on ARM, e.g. Mac).

```bash
export PROJECT_ID=lgportfolio
gcloud artifacts repositories create portfolio --repository-format=docker --location=us-east1 --project=$PROJECT_ID 2>/dev/null || true
gcloud auth configure-docker us-east1-docker.pkg.dev --quiet
docker build -t us-east1-docker.pkg.dev/$PROJECT_ID/portfolio/app:latest .
docker push us-east1-docker.pkg.dev/$PROJECT_ID/portfolio/app:latest
```

## 5. Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars: set project_id = "lgportfolio", region = "us-east1", domain = "gimenez.dev"
# Set inferencia_api_key / inferencia_base_url or "" to skip
terraform init
terraform plan
terraform apply
```

## 6. DNS

After `terraform apply`, get the LB IP and point your domain to it:

```bash
terraform output load_balancer_ip
```

In Namecheap (or your registrar): A record for `@` → that IP; CNAME `www` → `gimenez.dev`.

## 7. Continuous deployment (auto-deploy on)

Auto-deploy is enabled: **push to `main`** triggers Cloud Build, which builds the image (amd64), pushes to Artifact Registry, and deploys to Cloud Run. **You do not need to run `docker build` / `docker push` / `gcloud run services update` yourself**—just push. The deploy step uses `--set-secrets` so each new revision gets `INFERENCIA_API_KEY` and `INFERENCIA_BASE_URL` from Secret Manager (chat works only if those secrets exist and are correct). See AGENTS.md **Step 8** to (re)connect or verify the trigger. For "exec format error" or chat 503, see AGENTS.md **Troubleshooting**. Use the manual docker/gcloud flow only if the trigger isn't set up or you need a one-off deploy without pushing.

---

**Quick reference:** [AGENTS.md](../AGENTS.md) — full architecture, endpoints, troubleshooting, cost (~$18–20/mo).
