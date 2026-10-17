# GCP observability — Console & mobile app

Where to find observability data for the portfolio in **Google Cloud Console** and in the **Google Cloud mobile app**.

---

## Observability surfaces

| Signal | Console (web) | Mobile app |
|--------|---------------|------------|
| **Custom dashboard** (traffic, uptime, errors, cost) | Monitoring → Dashboards → [your dashboard] | Operations / Monitoring → Dashboards |
| **Logs** | Logging → Logs Explorer (filter: `resource.type="cloud_run_revision"`, `resource.labels.service_name="YOUR_SERVICE"`) | Logging / Logs (same project) |
| **Traces** | Observability → Trace (Trace Explorer) | Operations → Trace / Latency |
| **Errors** | Operations → Error Reporting | Operations → Error Reporting / Incidents |
| **Uptime** | Monitoring → Uptime checks | Monitoring → Uptime checks |
| **Alerts** | Monitoring → Alerting | Operations → Incidents / Alerts |

Custom dashboards created in Cloud Monitoring (e.g. via Terraform `google_monitoring_dashboard`) are accessible in both the web console and the mobile app under the same project.

---

## Trace visibility

If traces are not appearing:

1. **Trace API must be enabled** — `cloudtrace.googleapis.com` is included in Terraform (`terraform/main.tf` → `required_apis`). Run `terraform apply` if not yet applied.

2. **Project selection** — In the mobile app, select the same project that runs Cloud Run and has `GOOGLE_CLOUD_PROJECT` set.

3. **Trace context** — Cloud Run sets `X-Cloud-Trace-Context` on requests. The app logs with `trace_id` and `GOOGLE_CLOUD_PROJECT` so that `logging.googleapis.com/trace` links logs to Trace. Cloud Run samples traces (~0.1 req/s per instance); with low traffic, generate a few requests and check after a short delay.

4. **Mobile path** — In the Google Cloud app: Operations → Trace / Latency. Alternatively, open a log entry with a trace link and follow it to the trace view.

---

## Architecture alignment

- **Single dashboard** in GCP (Console + mobile): uptime, request count, instance count, latency, errors, cost
- **Traces** enabled via Trace API + `GOOGLE_CLOUD_PROJECT` + structured logs with trace ID
- **Logs, Error Reporting, Uptime, Alerts** all in the same project — no external observability tools required
