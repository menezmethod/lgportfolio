# ── Service Account ───────────────────────────────────────────────────────────

resource "google_service_account" "portfolio" {
  account_id   = "portfolio-sa"
  display_name = "Portfolio Cloud Run Service Account"
}

# ── Artifact Registry ────────────────────────────────────────────────────────

resource "google_artifact_registry_repository" "portfolio" {
  location               = var.region
  repository_id          = "portfolio"
  description            = "Container images for gimenez.dev"
  format                 = "DOCKER"
  cleanup_policy_dry_run = false

  # Keep enough history for rollback, but automatically trim old deploy images.
  cleanup_policies {
    id     = "keep-most-recent"
    action = "KEEP"

    most_recent_versions {
      keep_count = 12
    }
  }

  cleanup_policies {
    id     = "delete-old-tagged"
    action = "DELETE"

    condition {
      tag_state  = "TAGGED"
      older_than = "1209600s"
    }
  }

  cleanup_policies {
    id     = "delete-old-untagged"
    action = "DELETE"

    condition {
      tag_state  = "UNTAGGED"
      older_than = "259200s"
    }
  }

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

# Admin and Firebase secrets (created manually; see docs/CHAT-SECRETS.md)
data "google_secret_manager_secret" "admin_secret" {
  secret_id = "admin-secret"
  project   = var.project_id
}

data "google_secret_manager_secret" "firebase_service_account" {
  secret_id = "firebase-service-account"
  project   = var.project_id
}

resource "google_secret_manager_secret_iam_member" "admin_secret_accessor" {
  secret_id = data.google_secret_manager_secret.admin_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.portfolio.email}"
}

resource "google_secret_manager_secret_iam_member" "firebase_sa_accessor" {
  secret_id = data.google_secret_manager_secret.firebase_service_account.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.portfolio.email}"
}

# ── Cloud Run Service ────────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "portfolio" {
  name     = "lgportfolio"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  template {
    service_account = google_service_account.portfolio.email

    # Cloud SQL socket for RAG (pgvector); only when enable_rag_cloud_sql = true
    dynamic "volumes" {
      for_each = var.enable_rag_cloud_sql ? [1] : []
      content {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.rag[0].connection_name]
        }
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/portfolio/app:latest"

      ports {
        container_port = 8080
      }

      dynamic "volume_mounts" {
        for_each = var.enable_rag_cloud_sql ? [1] : []
        content {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

      # PORT is reserved; Cloud Run sets it automatically (8080).
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

      # RAG: Cloud SQL (pgvector) connection; only when enable_rag_cloud_sql = true
      dynamic "env" {
        for_each = var.enable_rag_cloud_sql ? [1] : []
        content {
          name  = "CLOUD_SQL_CONNECTION_NAME"
          value = google_sql_database_instance.rag[0].connection_name
        }
      }
      dynamic "env" {
        for_each = var.enable_rag_cloud_sql ? [1] : []
        content {
          name  = "RAG_DB_NAME"
          value = google_sql_database.rag[0].name
        }
      }
      dynamic "env" {
        for_each = var.enable_rag_cloud_sql ? [1] : []
        content {
          name  = "RAG_DB_USER"
          value = google_sql_user.rag[0].name
        }
      }
      dynamic "env" {
        for_each = var.enable_rag_cloud_sql ? [1] : []
        content {
          name = "RAG_DB_PASSWORD"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.rag_db_password[0].secret_id
              version = "latest"
            }
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

  # Let Cloud Build be the sole deployer of the app image. Terraform manages
  # env, secrets, scaling; it must not overwrite the image and roll back to an
  # older revision when apply runs after a Cloud Build deploy.
  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.portfolio.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow Cloud Run service account to read logs (for admin /admin/logs UI)
resource "google_project_iam_member" "portfolio_logging_viewer" {
  project = var.project_id
  role    = "roles/logging.viewer"
  member  = "serviceAccount:${google_service_account.portfolio.email}"
}
