# Optional: $10 budget with email alerts at 50%, 90%, 100% (free).
# Set terraform.tfvars: billing_account_id and budget_alert_email.
# When threshold is exceeded: email alert + Pub/Sub → Cloud Function automatically scales Cloud Run to 0 (see budget-kill.tf).

resource "google_monitoring_notification_channel" "budget_email" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  display_name = "Portfolio budget alerts"
  type         = "email"
  labels = {
    email_address = var.budget_alert_email
  }
}

resource "google_billing_budget" "portfolio" {
  count = var.billing_account_id != "" && var.budget_alert_email != "" ? 1 : 0

  billing_account = var.billing_account_id
  display_name    = "portfolio-$10-kill-switch"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "10"
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis      = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.9
    spend_basis      = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis      = "CURRENT_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [
      google_monitoring_notification_channel.budget_email[0].id
    ]
    pubsub_topic   = google_pubsub_topic.budget_alerts[0].id
    schema_version = "1.0"
  }

  depends_on = [google_pubsub_topic_iam_member.billing_publisher]
}
