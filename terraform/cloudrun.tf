# ── Service Account ───────────────────────────────────────────────────────────

resource "google_service_account" "portfolio" {
  account_id   = "portfolio-sa"
  display_name = "Portfolio Cloud Run Service Account"
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

# ── Cloud Run Service ────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "portfolio" {
  name     = "lgportfolio"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_AND_GCLB"

  template {
    service_account = google_service_account.portfolio.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/portfolio/app:latest"

      ports {
        container_port = 3000
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
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 3
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
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.portfolio.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
