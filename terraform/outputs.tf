# ── Outputs ───────────────────────────────────────────────────────────────────

output "load_balancer_ip" {
  description = "Static IP for the load balancer — point your DNS A record here"
  value       = google_compute_global_address.default.address
}

output "cloud_run_url" {
  description = "Direct Cloud Run URL (bypasses ALB, for debugging only)"
  value       = google_cloud_run_v2_service.portfolio.uri
}

output "service_account_email" {
  description = "Cloud Run service account"
  value       = google_service_account.portfolio.email
}

output "ssl_certificate_status" {
  description = "SSL certificate provisioning status"
  value       = google_compute_managed_ssl_certificate.default.managed[0].status
}

output "namecheap_dns_instructions" {
  description = "Instructions for Namecheap DNS configuration"
  value       = <<-EOT

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
    ║     A      @      ${google_compute_global_address.default.address}              Automatic          ║
    ║     CNAME  www    gimenez.dev.               Automatic          ║
    ║                                                                  ║
    ║  5. Wait 5-30 minutes for DNS propagation                       ║
    ║  6. SSL certificate auto-provisions (up to 24 hours)            ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝

  EOT
}
