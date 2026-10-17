# Automatic budget kill-switch: when budget threshold is exceeded, scale Cloud Run to 0.
# Requires billing_account_id and budget_alert_email in terraform.tfvars.
# Budget → Pub/Sub → Cloud Function → Cloud Run API (max-instances=0).

data "google_project" "project" {
  project_id = var.project_id
}

# Pub/Sub topic for budget notifications (GCP Billing publishes to this)
resource "google_pubsub_topic" "budget_alerts" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  name = "budget-alerts-portfolio"
}

# Allow GCP Billing to publish budget notifications to the topic
resource "google_pubsub_topic_iam_member" "billing_publisher" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  topic  = google_pubsub_topic.budget_alerts[0].name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-billing.iam.gserviceaccount.com"
}

# Service account for the budget-kill function (needs Run Admin to scale service to 0)
resource "google_service_account" "budget_kill" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  account_id   = "budget-kill-fn"
  display_name = "Budget kill switch Cloud Function"
}

resource "google_project_iam_member" "budget_kill_run_admin" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.budget_kill[0].email}"
}

# Zip the budget-kill function source
data "archive_file" "budget_kill" {
  type        = "zip"
  source_dir  = "${path.module}/../functions/budget-kill"
  output_path = "${path.module}/budget-kill.zip"
}

# GCS bucket for function source (Gen2 requires source in GCS or repo)
resource "google_storage_bucket" "functions" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  name     = "${var.project_id}-functions-${data.google_project.project.number}"
  location = var.region
}

resource "google_storage_bucket_object" "budget_kill_zip" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  name   = "budget-kill-${data.archive_file.budget_kill.output_md5}.zip"
  bucket = google_storage_bucket.functions[0].name
  source = data.archive_file.budget_kill.output_path
}

# Cloud Function Gen2: triggered by budget Pub/Sub, scales Cloud Run to 0
resource "google_cloudfunctions2_function" "budget_kill" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  name        = "budget-kill"
  location    = var.region
  description = "Scales Cloud Run to 0 when budget threshold exceeded (automatic kill switch)"

  build_config {
    runtime     = "nodejs20"
    entry_point = "scaleCloudRunToZero"
    source {
      storage_source {
        bucket = google_storage_bucket.functions[0].name
        object = google_storage_bucket_object.budget_kill_zip[0].name
      }
    }
  }

  service_config {
    max_instance_count    = 1
    available_memory      = "256Mi"
    timeout_seconds       = 60
    service_account_email = google_service_account.budget_kill[0].email
    environment_variables = {
      GOOGLE_CLOUD_PROJECT = var.project_id
      CLOUD_RUN_REGION     = var.region
      CLOUD_RUN_SERVICE    = "lgportfolio"
    }
  }

  event_trigger {
    trigger_region        = var.region
    event_type            = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic          = google_pubsub_topic.budget_alerts[0].id
    retry_policy          = "RETRY_POLICY_RETRY"
    service_account_email = google_service_account.budget_kill[0].email
  }

  depends_on = [
    google_project_service.apis,
    google_storage_bucket_object.budget_kill_zip,
  ]
}

# Allow the Eventarc trigger (running as budget_kill SA) to invoke the function
resource "google_cloudfunctions2_function_iam_member" "budget_kill_invoker" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  cloud_function = google_cloudfunctions2_function.budget_kill[0].name
  location       = var.region
  role           = "roles/run.invoker"
  member         = "serviceAccount:${google_service_account.budget_kill[0].email}"
}
