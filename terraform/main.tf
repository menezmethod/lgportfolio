terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "supabase_url" {
  description = "Supabase URL for RAG"
  type        = string
  default     = ""
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Gemini API Key"
  type        = string
  sensitive   = true
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "cloudrun" {
  service = "run.googleapis.com"
}

resource "google_project_service" "artifact_registry" {
  service = "artifactregistry.googleapis.com"
}

resource "google_project_service" "secret_manager" {
  service = "secretmanager.googleapis.com"
}

# Secret Manager for API keys
resource "google_secret_manager_secret" "gemini_key" {
  secret_id = "gemini-api-key"
  labels = {
    env = "production"
  }
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "gemini_key_version" {
  secret = google_secret_manager_secret.gemini_key.id
  secret_data = var.gemini_api_key
}

resource "google_secret_manager_secret_iam_member" "cloudrun_secret_accessor" {
  secret_id = google_secret_manager_secret.gemini_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.portfolio.email}"
}

# Artifact Registry repository
resource "google_artifact_registry_repository" "portfolio" {
  location      = var.region
  repository_id = "portfolio"
  description   = "Container registry for portfolio"
  format        = "DOCKER"
}

# Service Account
resource "google_service_account" "portfolio" {
  account_id   = "portfolio-sa"
  display_name = "Portfolio Cloud Run Service Account"
}

# Cloud Run service
resource "google_cloud_run_v2_service" "portfolio" {
  name     = "gimenez-portfolio"
  location = var.region

  template {
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
        name = "GOOGLE_API_KEY"
        value_source {
          secret_key_ref {
            secret = google_secret_manager_secret.gemini_key.secret_id
            version = "latest"
          }
        }
      }
      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }
    }
    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }
  }

  traffic {
    type = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Public access
resource "google_cloud_run_v2_service_iam_member" "public" {
  name  = google_cloud_run_v2_service.portfolio.name
  location = var.region
  role   = "roles/run.invoker"
  member = "allUsers"
}

# Domain mapping (optional - requires DNS setup)
resource "google_cloud_run_domain_mapping" "domain" {
  count    = var.gemini_api_key != "" ? 1 : 0
  name     = "gimenez.dev"
  location = var.region
  metadata {
    namespace = var.project_id
  }
  spec {
    route_name = google_cloud_run_v2_service.portfolio.name
  }
}

# Outputs
output "url" {
  value = google_cloud_run_v2_service.portfolio.status[0].url
}

output "service_account_email" {
  value = google_service_account.portfolio.email
}
