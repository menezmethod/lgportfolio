# ═══════════════════════════════════════════════════════════════════════════════
# GCP Uptime Checks & Alert Policies (free tier)
#
# Uptime Checks: free up to 100
# Alert Policies: free (notification channels may have costs)
# ═══════════════════════════════════════════════════════════════════════════════

# ── Uptime Check: Homepage (every 5 min) ─────────────────────────────────────

resource "google_monitoring_uptime_check_config" "homepage" {
  display_name = "Portfolio Homepage"
  timeout      = "10s"
  period       = "300s"

  http_check {
    path         = "/"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.domain
    }
  }

  depends_on = [google_project_service.apis]
}

# ── Uptime Check: Health API (every 1 min) ───────────────────────────────────

resource "google_monitoring_uptime_check_config" "health" {
  display_name = "Portfolio Health API"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/api/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true

    accepted_response_status_codes {
      status_class = "STATUS_CLASS_2XX"
    }
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.domain
    }
  }

  content_matchers {
    content = "healthy"
    matcher = "CONTAINS_STRING"
  }

  depends_on = [google_project_service.apis]
}

# ── Uptime Check: War Room (every 5 min) ─────────────────────────────────────

resource "google_monitoring_uptime_check_config" "war_room" {
  display_name = "Portfolio War Room"
  timeout      = "10s"
  period       = "300s"

  http_check {
    path         = "/war-room"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.domain
    }
  }

  depends_on = [google_project_service.apis]
}

# ── Alert Policy: Uptime failure (2 consecutive) ─────────────────────────────

resource "google_monitoring_alert_policy" "uptime_alert" {
  display_name = "Portfolio Uptime Alert"
  combiner     = "OR"

  conditions {
    display_name = "Health endpoint down"
    condition_threshold {
      filter          = "resource.type = \"uptime_url\" AND metric.type = \"monitoring.googleapis.com/uptime_check/check_passed\" AND metric.label.check_id = \"${google_monitoring_uptime_check_config.health.uptime_check_id}\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "120s"

      trigger {
        count = 1
      }

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.label.host"]
      }
    }
  }

  alert_strategy {
    auto_close = "604800s"
  }

  depends_on = [google_project_service.apis]
}
