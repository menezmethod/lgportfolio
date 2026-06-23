# ── Cloud Build CI/CD (production + PR preview) ─────────────────────────────
#
# Triggers are opt-in via terraform.tfvars because Coolify hosts production.
# Enable when rolling back to GCP or running preview deploys on Cloud Run.
#
# Prerequisite: connect the GitHub repo in Cloud Build (Console or gcloud).
# See docs/DEPLOY-CLOUDRUN.md § Continuous deployment.

locals {
  cloudbuild_sa = "${data.google_project.project.number}@cloudbuild.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_run_admin" {
  count = var.enable_cloud_build_triggers ? 1 : 0

  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${local.cloudbuild_sa}"
}

resource "google_project_iam_member" "cloudbuild_artifact_writer" {
  count = var.enable_cloud_build_triggers ? 1 : 0

  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${local.cloudbuild_sa}"
}

resource "google_project_iam_member" "cloudbuild_secret_accessor" {
  count = var.enable_cloud_build_triggers ? 1 : 0

  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${local.cloudbuild_sa}"
}

resource "google_service_account_iam_member" "cloudbuild_act_as_portfolio" {
  count = var.enable_cloud_build_triggers ? 1 : 0

  service_account_id = google_service_account.portfolio.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${local.cloudbuild_sa}"
}

resource "google_cloudbuild_trigger" "production" {
  count = var.enable_cloud_build_triggers && var.enable_cloud_build_production_trigger ? 1 : 0

  name        = "deploy-portfolio-production"
  description = "Build and deploy lgportfolio to Cloud Run on push to main"
  location    = var.region

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = "^main$"
    }
  }

  filename = "cloudbuild.yaml"

  substitutions = {
    _REGION            = var.region
    _SERVICE_NAME      = google_cloud_run_v2_service.portfolio.name
    _AR_REPO           = google_artifact_registry_repository.portfolio.repository_id
    _GA_MEASUREMENT_ID = var.ga_measurement_id
    _CLOUD_RUN_INGRESS = var.enable_load_balancer ? "internal-and-cloud-load-balancing" : "all"
  }

  depends_on = [google_project_service.apis]
}

resource "google_cloudbuild_trigger" "preview" {
  count = var.enable_cloud_build_triggers && var.enable_cloud_build_preview_trigger ? 1 : 0

  name        = "deploy-portfolio-preview"
  description = "Build and deploy PR branches to lgportfolio-preview on Cloud Run"
  location    = var.region

  github {
    owner = var.github_owner
    name  = var.github_repo
    pull_request {
      branch = ".*"
    }
  }

  filename = "cloudbuild-preview.yaml"

  substitutions = {
    _REGION       = var.region
    _SERVICE_NAME = google_cloud_run_v2_service.preview.name
    _AR_REPO      = google_artifact_registry_repository.portfolio.repository_id
  }

  depends_on = [google_project_service.apis]
}
