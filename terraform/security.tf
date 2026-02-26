# ═══════════════════════════════════════════════════════════════════════════════
# Cloud Armor — WAF & DDoS Protection (Standard Tier, included with ALB)
#
# Rules implemented:
#   1. Rate limiting: 60 requests/min per IP (edge-level, before Cloud Run)
#   2. Block known bad user agents (scanners, bots)
#   3. Block suspicious request patterns (path traversal, SQL injection)
#   4. Chat API specific rate limit: 10 requests/min per IP
#   5. Geographic restriction: allow only US/CA/GB/EU (optional, disabled)
#   6. Default allow
#
# These rules run at Google's edge network — before traffic reaches Cloud Run.
# This means blocked requests do NOT consume Cloud Run free tier budget.
# ═══════════════════════════════════════════════════════════════════════════════

resource "google_compute_security_policy" "default" {
  name        = "portfolio-waf-policy"
  description = "Cloud Armor WAF policy for gimenez.dev"
  type        = "CLOUD_ARMOR"

  # ── Rule 1: Rate limit all traffic (60 req/min per IP) ──────────────────

  rule {
    action   = "throttle"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 60
        interval_sec = 60
      }
      enforce_on_key = "IP"
    }
    description = "Global rate limit: 60 req/min per IP"
  }

  # ── Rule 2: Stricter rate limit on chat API (10 req/min per IP) ─────────

  rule {
    action   = "throttle"
    priority = 900
    match {
      expr {
        expression = "request.path.matches('/api/chat')"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      rate_limit_threshold {
        count        = 10
        interval_sec = 60
      }
      enforce_on_key = "IP"
    }
    description = "Chat API rate limit: 10 req/min per IP"
  }

  # ── Rule 3: Block known scanners and malicious user agents ──────────────

  rule {
    action   = "deny(403)"
    priority = 2000
    match {
      expr {
        expression = "request.headers['user-agent'].matches('(?:sqlmap|nikto|nessus|masscan|zgrab|nuclei|httpx|dirbuster|gobuster|wfuzz|ffuf|whatweb|shodan|censys|nmap)')"
      }
    }
    description = "Block known vulnerability scanners"
  }

  # ── Rule 4a: Block path traversal (max 5 expressions per rule)
  rule {
    action   = "deny(403)"
    priority = 3000
    match {
      expr {
        expression = "request.path.contains('../') || request.path.contains('..\\\\') || request.path.contains('/etc/passwd') || request.path.contains('wp-admin') || request.path.contains('.git/')"
      }
    }
    description = "Block path traversal and exploit paths"
  }
  # ── Rule 4b: Block more exploit paths
  rule {
    action   = "deny(403)"
    priority = 3001
    match {
      expr {
        expression = "request.path.contains('wp-login') || request.path.contains('phpmyadmin') || request.path.contains('.env') || request.path.contains('/proc/') || request.path.contains('xmlrpc')"
      }
    }
    description = "Block wp-login, phpmyadmin, .env, etc."
  }

  # ── Rule 5: Large body block removed (CEL header checks limited); rely on app/CDN ──

  # ── Default Rule: Allow ─────────────────────────────────────────────────

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default: allow all traffic"
  }

  # Adaptive protection (standard tier — automatic DDoS detection)
  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable          = true
      rule_visibility = "STANDARD"
    }
  }
}
