# Terraform configuration for GCP Cloud Run deployment
# See README.md for setup instructions

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "local" {
    path = "terraform.tfstate"
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

variable "container_image" {
  description = "Container image URL"
  type        = string
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "cloudrun" {
  service = "cloudrun.googleapis.com"
}

resource "google_project_service" "container_registry" {
  service = "containerregistry.googleapis.com"
}

resource "google_project_service" "artifact_registry" {
  service = "artifactregistry.googleapis.com"
}

# Create Artifact Registry repository
resource "google_artifact_registry_repository" "portfolio" {
  location      = var.region
  repository_id = "portfolio"
  description   = "Container registry for portfolio website"
  format        = "DOCKER"
}

# Cloud Run service
resource "google_cloud_run_service" "portfolio" {
  name     = "lgportfolio"
  location = var.region

  template {
    spec {
      containers {
        image = var.container_image
        ports {
          container_port = 3000
        }
        env {
          name  = "GEMINI_API_KEY"
          value = var.gemini_api_key
        }
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
      service_account_name = google_service_account.portfolio.email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  lifecycle {
    ignore_changes = [template]
  }
}

# Service Account for Cloud Run
resource "google_service_account" "portfolio" {
  account_id   = "portfolio-sa"
  display_name = "Portfolio Cloud Run Service Account"
}

# IAM - Allow public access to Cloud Run
data "google_iam_policy" "noauth" {
  binding {
    role    = "roles/run.invoker"
    members = ["allUsers"]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth" {
  location    = google_cloud_run_service.portfolio.location
  project     = google_cloud_run_service.portfolio.project
  repository  = google_cloud_run_service.portfolio.name
  policy_data = data.google_iam_policy.noauth.policy_data
}

# Outputs
output "url" {
  value = google_cloud_run_service.portfolio.status[0].url
}

output "service_account_email" {
  value = google_service_account.portfolio.email
}
