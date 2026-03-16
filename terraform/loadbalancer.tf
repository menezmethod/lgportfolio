# ═══════════════════════════════════════════════════════════════════════════════
# Global External Application Load Balancer for Cloud Run
#
# Path: Internet → Static IP → HTTPS Proxy → URL Map → Backend Service → NEG → Cloud Run
#
# Includes:
#   - Google-managed SSL certificate (free, auto-renewing)
#   - Cloud CDN (edge caching for static assets)
#   - HTTP → HTTPS redirect
#   - Cloud Armor policy attachment (see security.tf)
# ═══════════════════════════════════════════════════════════════════════════════

# ── Global Static IP ─────────────────────────────────────────────────────────

resource "google_compute_global_address" "default" {
  count = var.enable_load_balancer ? 1 : 0

  name = "portfolio-lb-ip"

  depends_on = [google_project_service.apis]
}

# ── Serverless NEG (points to Cloud Run) ─────────────────────────────────────

resource "google_compute_region_network_endpoint_group" "cloudrun_neg" {
  count = var.enable_load_balancer ? 1 : 0

  name                  = "portfolio-cloudrun-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.portfolio.name
  }
}

# ── Backend Service (with CDN + Cloud Armor) ─────────────────────────────────

resource "google_compute_backend_service" "default" {
  count = var.enable_load_balancer ? 1 : 0

  name = "portfolio-backend"

  protocol    = "HTTPS"
  port_name   = "http"
  timeout_sec = 30

  backend {
    group = google_compute_region_network_endpoint_group.cloudrun_neg[0].id
  }

  # Cloud CDN (free-tier: edge cache reduces Cloud Run requests when traffic spikes)
  enable_cdn = true
  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    max_ttl                      = 86400
    client_ttl                   = 3600
    signed_url_cache_max_age_sec = 0

    cache_key_policy {
      include_host         = true
      include_protocol     = true
      include_query_string = false
    }

    # Negative caching: 404 at edge (429 not supported by Cloud CDN for negative caching)
    negative_caching = true
    negative_caching_policy {
      code = 404
      ttl  = 30
    }
  }

  # Cloud Armor
  security_policy = google_compute_security_policy.default[0].id

  log_config {
    enable = true
    # Keep a thin sample for edge visibility without paying to log half of all requests.
    sample_rate = 0.1
  }
}

# ── URL Map ──────────────────────────────────────────────────────────────────

resource "google_compute_url_map" "default" {
  count = var.enable_load_balancer ? 1 : 0

  name            = "portfolio-url-map"
  default_service = google_compute_backend_service.default[0].id
}

# HTTP → HTTPS redirect URL map
resource "google_compute_url_map" "http_redirect" {
  count = var.enable_load_balancer ? 1 : 0

  name = "portfolio-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

# ── Google-Managed SSL Certificate ───────────────────────────────────────────

resource "google_compute_managed_ssl_certificate" "default" {
  count = var.enable_load_balancer ? 1 : 0

  name = "portfolio-ssl-cert"

  managed {
    domains = [var.domain]
  }
}

# ── HTTPS Target Proxy ───────────────────────────────────────────────────────

resource "google_compute_target_https_proxy" "default" {
  count = var.enable_load_balancer ? 1 : 0

  name             = "portfolio-https-proxy"
  url_map          = google_compute_url_map.default[0].id
  ssl_certificates = [google_compute_managed_ssl_certificate.default[0].id]
}

# HTTP target proxy (for redirect)
resource "google_compute_target_http_proxy" "redirect" {
  count = var.enable_load_balancer ? 1 : 0

  name    = "portfolio-http-redirect-proxy"
  url_map = google_compute_url_map.http_redirect[0].id
}

# ── Forwarding Rules (the actual listener) ───────────────────────────────────

resource "google_compute_global_forwarding_rule" "https" {
  count = var.enable_load_balancer ? 1 : 0

  name                  = "portfolio-https-rule"
  target                = google_compute_target_https_proxy.default[0].id
  port_range            = "443"
  ip_address            = google_compute_global_address.default[0].id
  load_balancing_scheme = "EXTERNAL"
}

resource "google_compute_global_forwarding_rule" "http_redirect" {
  count = var.enable_load_balancer ? 1 : 0

  name                  = "portfolio-http-redirect-rule"
  target                = google_compute_target_http_proxy.redirect[0].id
  port_range            = "80"
  ip_address            = google_compute_global_address.default[0].id
  load_balancing_scheme = "EXTERNAL"
}
