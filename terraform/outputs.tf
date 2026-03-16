# ── Outputs ───────────────────────────────────────────────────────────────────

locals {
  namecheap_dns_instructions_edge = <<-EOT

    ╔══════════════════════════════════════════════════════════════════╗
    ║               NAMECHEAP DNS CONFIGURATION                       ║
    ╠══════════════════════════════════════════════════════════════════╣
    ║                                                                  ║
    ║  1. Log into Namecheap → Domain List → gimenez.dev → Manage    ║
    ║  2. Go to "Advanced DNS" tab                                    ║
    ║  3. Delete any existing A or CNAME records for @ and www        ║
    ║  4. Add these records:                                          ║
    ║                                                                  ║
    ║     Type   Host   Value                      TTL                ║
    ║     ─────  ─────  ─────────────────────────  ──────             ║
    ║     A      @      ${try(google_compute_global_address.default[0].address, "EDGE_DISABLED")}              Automatic          ║
    ║     CNAME  www    gimenez.dev.               Automatic          ║
    ║                                                                  ║
    ║  5. Wait 5-30 minutes for DNS propagation                       ║
    ║  6. SSL certificate auto-provisions (up to 24 hours)            ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝

  EOT

  namecheap_dns_instructions_low_cost = <<-EOT

    Edge mode is disabled.

    Primary public URL:
      ${google_cloud_run_v2_service.portfolio.uri}

    Custom domain DNS can stay parked or be repointed later when edge mode is re-enabled.

  EOT
}

output "load_balancer_ip" {
  description = "Static IP for the load balancer — null when enable_load_balancer=false"
  value       = var.enable_load_balancer ? google_compute_global_address.default[0].address : null
}

output "cloud_run_url" {
  description = "Direct Cloud Run URL (bypasses ALB, for debugging only)"
  value       = google_cloud_run_v2_service.portfolio.uri
}

output "public_base_url" {
  description = "Primary public URL for the portfolio in the current mode"
  value       = var.enable_load_balancer ? "https://${var.domain}" : google_cloud_run_v2_service.portfolio.uri
}

output "service_account_email" {
  description = "Cloud Run service account"
  value       = google_service_account.portfolio.email
}

output "ssl_certificate_name" {
  description = "SSL certificate name when edge mode is enabled; null when enable_load_balancer=false"
  value       = var.enable_load_balancer ? google_compute_managed_ssl_certificate.default[0].name : null
}

output "namecheap_dns_instructions" {
  description = "Instructions for Namecheap DNS configuration in the current mode"
  value       = var.enable_load_balancer ? local.namecheap_dns_instructions_edge : local.namecheap_dns_instructions_low_cost
}
