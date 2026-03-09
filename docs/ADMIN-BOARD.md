# Administration Board

Single-pane observability and recruiter-activity dashboard. Entry point: `/admin` (redirects to `/admin/board`). Requires `ADMIN_SECRET`.

## Sections

| Tab | Data source | Purpose |
|-----|-------------|---------|
| **System** | `/api/war-room/data` (in-memory telemetry) | Live metrics, SLO status, recent errors, time-series charts — same data as the public War Room, polled every 60s when visible |
| **Recruiters** | Firestore `chat_sessions` + `chat_memory` via `/api/admin/sessions` | Session list (message count, engagement score, email capture), full conversation drill-down |
| **Logs** | Cloud Logging via `/api/admin/logs` | Structured logs with severity filter, trace ID links, time range |
| **Metrics** | `/api/metrics` (Prometheus text exposition) | App-wide counters, histograms, gauges — scrapable by any Prometheus-compatible system |

## Data model (Firestore)

- **`chat_sessions`** — `session_id`, `started_at`, `last_activity_at`, `message_count`, `cache_hits`, `rate_limited`, `status`, `engagement_score`, `recruiter_email`, `total_duration_ms`, `trace_id`
- **`chat_memory`** — `messages[]` (role + content) for conversation context

No additional collections or GCP services beyond what the app already uses.

## APIs

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/war-room/data` | GET | Public | Telemetry JSON (60s server cache) |
| `/api/admin/sessions` | GET | `X-Admin-Secret` | Session list from Firestore |
| `/api/admin/sessions/[id]` | GET | `X-Admin-Secret` | Full conversation for a session |
| `/api/admin/logs` | GET | `X-Admin-Secret` | Cloud Run structured logs |
| `/api/admin/board/stats` | GET | `X-Admin-Secret` | Aggregates (7d sessions, email count) |
| `/api/admin/board/view` | POST | `X-Admin-Secret` | Records board view (analytics) |
| `/api/metrics` | GET | `X-Admin-Secret` | Prometheus text exposition format |

## Auth

Single `ADMIN_SECRET` (header or session cookie after first auth). Same credential for all admin routes. The secret is stored in GCP Secret Manager and injected into Cloud Run via `cloudbuild.yaml`.

## Architecture

```
Browser → /admin/board
  ├── System tab     → GET /api/war-room/data (public, 60s cache)
  ├── Recruiters tab → GET /api/admin/sessions (Firestore)
  │                  → GET /api/admin/sessions/[id] (drill-down)
  ├── Logs tab       → GET /api/admin/logs (Cloud Logging API)
  └── Metrics tab    → GET /api/metrics (in-memory telemetry → Prometheus format)
```

All data is read-only. The board adds no write paths. War Room polling uses the Page Visibility API — background tabs do not poll (see [ADR-002](./adr/002-page-visibility-war-room-polling.md)).
