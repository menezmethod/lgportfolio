# ── Preview Cloud Run Service ────────────────────────────────────────────────
#
# Serves PR preview builds via direct Run URL (public ingress, no ALB).
# Scale-to-zero; max 1 instance keeps preview cost near $0 on free tier.

resource "google_cloud_run_v2_service" "preview" {
  name     = "lgportfolio-preview"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.portfolio.email

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/portfolio/app:latest"

      ports {
        container_port = 8080
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
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "DEPLOY_ENV"
        value = "preview"
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
      env {
        name = "ADMIN_SECRET"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.admin_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "FIREBASE_SERVICE_ACCOUNT_JSON"
        value_source {
          secret_key_ref {
            secret  = data.google_secret_manager_secret.firebase_service_account.secret_id
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
  ]

  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }
}

resource "google_cloud_run_v2_service_iam_member" "preview_public" {
  name     = google_cloud_run_v2_service.preview.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}
