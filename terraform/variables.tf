variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "Cloud Run region"
  type        = string
  default     = "us-east1"
}

variable "domain" {
  description = "Custom domain (e.g. gimenez.dev)"
  type        = string
  default     = "gimenez.dev"
}

variable "enable_load_balancer" {
  description = "Enable the global external load balancer, Cloud CDN, and Cloud Armor. Keep true for custom-domain production."
  type        = bool
  default     = true
}

variable "inferencia_api_key" {
  description = "Inferencia LLM API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "inferencia_base_url" {
  description = "Inferencia LLM base URL"
  type        = string
  sensitive   = true
  default     = ""
}

# Optional: set to enable $20 budget kill switch (email + Pub/Sub → scale Cloud Run to 0). Get ID: gcloud billing accounts list
variable "billing_account_id" {
  description = "Billing account ID for budget alerts (e.g. 012345-6789AB-CDEF01). Leave empty to skip."
  type        = string
  default     = ""
}

variable "budget_alert_email" {
  description = "Email for budget alerts (required if billing_account_id is set)."
  type        = string
  default     = ""
}

# Optional: email for portfolio alerts (recruiter detected, spam/abuse, high errors). Leave empty to create policies without notifications.
variable "portfolio_alert_email" {
  description = "Email for portfolio alerts (recruiter, rate limit abuse, errors). Leave empty to skip notification channel."
  type        = string
  default     = ""
}

# ── Cloud Build CI/CD (opt-in; Vercel is default production host) ─────────────

variable "github_owner" {
  description = "GitHub org or user for Cloud Build triggers"
  type        = string
  default     = "menezmethod"
}

variable "github_repo" {
  description = "GitHub repository name for Cloud Build triggers"
  type        = string
  default     = "lgportfolio"
}

variable "enable_cloud_build_triggers" {
  description = "Grant Cloud Build SA deploy IAM and manage triggers. Keep false while Vercel hosts production."
  type        = bool
  default     = false
}

variable "enable_cloud_build_production_trigger" {
  description = "Deploy lgportfolio on push to main via cloudbuild.yaml"
  type        = bool
  default     = false
}

variable "enable_cloud_build_preview_trigger" {
  description = "Deploy lgportfolio-preview on pull_request via cloudbuild-preview.yaml"
  type        = bool
  default     = false
}

variable "ga_measurement_id" {
  description = "Optional GA4 measurement ID passed to production Cloud Build (_GA_MEASUREMENT_ID)"
  type        = string
  default     = ""
  sensitive   = true
}
