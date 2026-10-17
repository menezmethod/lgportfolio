# ═══════════════════════════════════════════════════════════════════════════════
# Portfolio alerts: recruiter detected, spam/abuse, high errors
# Log-based metrics from Cloud Run stdout → Cloud Logging; alert policies notify when relevant.
# Set portfolio_alert_email in terraform.tfvars to receive email notifications.
# ═══════════════════════════════════════════════════════════════════════════════

locals {
  log_filter_base = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"lgportfolio\""
}

# ── Notification channel (optional) ───────────────────────────────────────────

resource "google_monitoring_notification_channel" "portfolio_alerts" {
  count = var.portfolio_alert_email != "" ? 1 : 0

  display_name = "Portfolio alerts (recruiter, spam, errors)"
  type         = "email"
  labels = {
    email_address = var.portfolio_alert_email
  }

  depends_on = [google_project_service.apis]
}

# ── Log-based metrics ──────────────────────────────────────────────────────────

resource "google_logging_metric" "recruiter_email_captured" {
  name        = "portfolio_recruiter_email_captured"
  description = "Count of chat sessions where a recruiter left their email"
  filter      = "${local.log_filter_base} AND jsonPayload.message=\"Chat session email captured\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  depends_on = [google_project_service.apis]
}

resource "google_logging_metric" "rate_limit_hits" {
  name        = "portfolio_rate_limit_hits"
  description = "Count of rate limit hits (spam/abuse indicator)"
  filter      = "${local.log_filter_base} AND (jsonPayload.message=~\"Rate limit.*\" OR jsonPayload.message=\"Daily limit exhausted\")"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  depends_on = [google_project_service.apis]
}

resource "google_logging_metric" "prompt_injection_blocked" {
  name        = "portfolio_prompt_injection_blocked"
  description = "Count of prompt injection attempts blocked"
  filter      = "${local.log_filter_base} AND jsonPayload.message=\"Prompt injection attempt blocked\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  depends_on = [google_project_service.apis]
}

resource "google_logging_metric" "api_errors" {
  name        = "portfolio_api_errors"
  description = "Count of API errors (severity ERROR)"
  filter      = "${local.log_filter_base} AND severity>=ERROR"

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  depends_on = [google_project_service.apis]
}

# ── Alert: Recruiter detected (positive signal) ─────────────────────────────────

resource "google_monitoring_alert_policy" "recruiter_detected" {
  display_name = "Portfolio: Recruiter left email"
  combiner     = "OR"

  conditions {
    display_name = "At least one recruiter email captured in 15m"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"lgportfolio\" AND metric.type=\"logging.googleapis.com/user/${replace(google_logging_metric.recruiter_email_captured.name, "/", "%2F")}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      duration        = "0s"

      aggregations {
        alignment_period   = "900s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  notification_channels = var.portfolio_alert_email != "" ? [google_monitoring_notification_channel.portfolio_alerts[0].id] : []

  alert_strategy {
    auto_close = "86400s"
  }

  documentation {
    content   = "A visitor to the chat left their email (recruiter lead). Check Admin Board → Recruiters for the conversation."
    mime_type = "text/markdown"
  }

  depends_on = [google_logging_metric.recruiter_email_captured, time_sleep.wait_for_log_metrics]
}

# ── Alert: Spam / abuse (rate limits or prompt injection) ───────────────────────

resource "google_monitoring_alert_policy" "spam_abuse" {
  display_name = "Portfolio: Possible spam or abuse"
  combiner     = "OR"

  conditions {
    display_name = "Rate limit hits >= 5 in 5 minutes"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"lgportfolio\" AND metric.type=\"logging.googleapis.com/user/${replace(google_logging_metric.rate_limit_hits.name, "/", "%2F")}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 4
      duration        = "0s"

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  conditions {
    display_name = "Prompt injection attempts >= 3 in 5 minutes"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"lgportfolio\" AND metric.type=\"logging.googleapis.com/user/${replace(google_logging_metric.prompt_injection_blocked.name, "/", "%2F")}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 2
      duration        = "0s"

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  notification_channels = var.portfolio_alert_email != "" ? [google_monitoring_notification_channel.portfolio_alerts[0].id] : []

  alert_strategy {
    auto_close = "3600s"
  }

  documentation {
    content   = "High rate limit hits or prompt injection attempts. Review Admin Board → Logs and War Room for details."
    mime_type = "text/markdown"
  }

  depends_on = [google_logging_metric.rate_limit_hits, google_logging_metric.prompt_injection_blocked, time_sleep.wait_for_log_metrics]
}

# ── Alert: High API errors ─────────────────────────────────────────────────────

resource "google_monitoring_alert_policy" "high_errors" {
  display_name = "Portfolio: High API errors"
  combiner     = "OR"

  conditions {
    display_name = "10+ API errors in 5 minutes"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"lgportfolio\" AND metric.type=\"logging.googleapis.com/user/${replace(google_logging_metric.api_errors.name, "/", "%2F")}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 9
      duration        = "0s"

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  notification_channels = var.portfolio_alert_email != "" ? [google_monitoring_notification_channel.portfolio_alerts[0].id] : []

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "Elevated API error rate. Check Admin Board → Logs and War Room → Recent errors."
    mime_type = "text/markdown"
  }

  depends_on = [google_logging_metric.api_errors, time_sleep.wait_for_log_metrics]
}

# Allow new log-based metrics to become visible (GCP can take up to ~10 min; 2 min is often enough)
resource "time_sleep" "wait_for_log_metrics" {
  create_duration = "120s"
  depends_on = [
    google_logging_metric.recruiter_email_captured,
    google_logging_metric.rate_limit_hits,
    google_logging_metric.prompt_injection_blocked,
    google_logging_metric.api_errors,
  ]
}
