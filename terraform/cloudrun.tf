# ── Service Account ───────────────────────────────────────────────────────────

resource "google_service_account" "portfolio" {
  account_id   = "portfolio-sa"
  display_name = "Portfolio Cloud Run Service Account"
}

locals {
  cloud_build_sa = "${data.google_project.current.number}@cloudbuild.gserviceaccount.com"
}

# ── Artifact Registry ────────────────────────────────────────────────────────

resource "google_artifact_registry_repository" "portfolio" {
  location      = var.region
  repository_id = "portfolio"
  description   = "Container images for gimenez.dev"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

# ── Secret Manager ───────────────────────────────────────────────────────────

resource "google_secret_manager_secret" "inferencia_api_key" {
  secret_id = "inferencia-api-key"
  labels    = { env = "production" }
  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "inferencia_api_key" {
  count       = var.inferencia_api_key != "" ? 1 : 0
  secret      = google_secret_manager_secret.inferencia_api_key.id
  secret_data = var.inferencia_api_key
}

resource "google_secret_manager_secret" "inferencia_base_url" {
  secret_id = "inferencia-base-url"
  labels    = { env = "production" }
  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "inferencia_base_url" {
  count       = var.inferencia_base_url != "" ? 1 : 0
  secret      = google_secret_manager_secret.inferencia_base_url.id
  secret_data = var.inferencia_base_url
}

resource "google_secret_manager_secret_iam_member" "api_key_accessor" {
  secret_id = google_secret_manager_secret.inferencia_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.portfolio.email}"
}

resource "google_secret_manager_secret_iam_member" "base_url_accessor" {
  secret_id = google_secret_manager_secret.inferencia_base_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.portfolio.email}"
}

resource "google_secret_manager_secret_iam_member" "cloudbuild_api_key_accessor" {
  secret_id = google_secret_manager_secret.inferencia_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${local.cloud_build_sa}"
}

resource "google_secret_manager_secret_iam_member" "cloudbuild_base_url_accessor" {
  secret_id = google_secret_manager_secret.inferencia_base_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${local.cloud_build_sa}"
}

resource "google_project_iam_member" "cloudbuild_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${local.cloud_build_sa}"
}

resource "google_project_iam_member" "cloudbuild_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${local.cloud_build_sa}"
}

resource "google_service_account_iam_member" "cloudbuild_sa_user" {
  service_account_id = google_service_account.portfolio.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${local.cloud_build_sa}"
}

# ── Cloud Run Service ────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "portfolio" {
  name     = "lgportfolio"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    timeout                          = "30s"
    max_instance_request_concurrency = 80
    service_account = google_service_account.portfolio.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/portfolio/app:latest"

      ports {
        container_port = 8080
      }

      env {
        name  = "PORT"
        value = "8080"
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "NEXT_TELEMETRY_DISABLED"
        value = "1"
      }
      env {
        name  = "INFERENCIA_CHAT_MODEL"
        value = "mlx-community/gpt-oss-20b-MXFP4-Q8"
      }

      env {
        name = "INFERENCIA_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.inferencia_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "INFERENCIA_BASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.inferencia_base_url.secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      startup_probe {
        http_get {
          path = "/api/health"
          port = 8080
        }
        initial_delay_seconds = 20
        period_seconds        = 10
        failure_threshold     = 12
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = 1
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.inferencia_api_key,
    google_secret_manager_secret_version.inferencia_base_url,
    google_project_iam_member.cloudbuild_run_admin,
    google_project_iam_member.cloudbuild_artifact_writer,
    google_service_account_iam_member.cloudbuild_sa_user,
    google_secret_manager_secret_iam_member.cloudbuild_api_key_accessor,
    google_secret_manager_secret_iam_member.cloudbuild_base_url_accessor,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.portfolio.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
