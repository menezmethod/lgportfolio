# ── Cloud SQL for PostgreSQL + pgvector (RAG knowledge base) ───────────────────
# Optional: set enable_rag_cloud_sql = false in tfvars to skip (use file-based RAG).
# When enabled: smallest instance (db-f1-micro), pgvector extension for vector search.
# Cost: ~$7–10/mo for db-f1-micro; use 30-day free trial for testing.
# ─────────────────────────────────────────────────────────────────────────────

variable "enable_rag_cloud_sql" {
  description = "Create Cloud SQL PostgreSQL + pgvector for RAG. Default false (free tier: file-based RAG). Set true for vector RAG (~$7–10/mo)."
  type        = bool
  default     = false
}

resource "random_password" "rag_db_password" {
  count   = var.enable_rag_cloud_sql ? 1 : 0
  length  = 24
  special = false
}

resource "google_secret_manager_secret" "rag_db_password" {
  count = var.enable_rag_cloud_sql ? 1 : 0

  secret_id = "rag-db-password"
  labels    = { env = "production" }
  replication {
    auto {}
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "rag_db_password" {
  count = var.enable_rag_cloud_sql ? 1 : 0

  secret      = google_secret_manager_secret.rag_db_password[0].id
  secret_data = random_password.rag_db_password[0].result
}

resource "google_secret_manager_secret_iam_member" "rag_db_password_accessor" {
  count = var.enable_rag_cloud_sql ? 1 : 0

  secret_id = google_secret_manager_secret.rag_db_password[0].id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.portfolio.email}"
}

resource "google_sql_database_instance" "rag" {
  count = var.enable_rag_cloud_sql ? 1 : 0

  name             = "portfolio-rag"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_size         = 10
    disk_type         = "PD_SSD"

    database_flags {
      name  = "cloudsql.enable_pgvector"
      value = "on"
    }

    ip_configuration {
      ipv4_enabled = false
    }
  }

  deletion_protection = false
  depends_on          = [google_project_service.apis]
}

resource "google_sql_database" "rag" {
  count = var.enable_rag_cloud_sql ? 1 : 0

  name     = "rag"
  instance = google_sql_database_instance.rag[0].name
}

resource "google_sql_user" "rag" {
  count = var.enable_rag_cloud_sql ? 1 : 0

  name     = "ragapp"
  instance = google_sql_database_instance.rag[0].name
  password = random_password.rag_db_password[0].result
}

# Cloud Run service account needs Cloud SQL Client to connect
resource "google_project_iam_member" "portfolio_cloudsql_client" {
  count = var.enable_rag_cloud_sql ? 1 : 0

  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.portfolio.email}"
}
