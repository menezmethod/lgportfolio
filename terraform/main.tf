# ═══════════════════════════════════════════════════════════════════════════════
# gimenez.dev — GCP Infrastructure
#
# Architecture:
#   Internet → Cloud DNS → Global External ALB → Cloud CDN → Cloud Armor → Cloud Run
#
# Products used:
#   - Cloud Run (serverless compute, scale-to-zero)
#   - Global External Application Load Balancer (L7, HTTPS)
#   - Cloud CDN (edge caching)
#   - Cloud Armor (WAF + DDoS protection)
#   - Google-managed SSL Certificate (free, auto-renewing)
#   - Secret Manager (API keys)
#   - Artifact Registry (container images)
#   - Cloud Build (CI/CD via cloudbuild.yaml)
#
# Cost estimate (low-traffic portfolio):
#   Load Balancer forwarding rule:  ~$18/month
#   Cloud CDN cache operations:     ~$0.01-0.10/month
#   Cloud Armor standard rules:     included with ALB
#   Cloud Run (free tier):          $0 (scale-to-zero, 1 max instance)
#   Google-managed SSL:             $0 (free)
#   Secret Manager:                 ~$0.06/month
#   Total:                          ~$18-20/month
#
# This is the reference architecture for a GCP Professional Cloud Architect.
# ═══════════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# ── Enable Required APIs ─────────────────────────────────────────────────────

locals {
  required_apis = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "compute.googleapis.com",
    "certificatemanager.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each = toset(local.required_apis)
  service  = each.value

  disable_dependent_services = false
  disable_on_destroy         = false
}
