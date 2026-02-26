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
