# Plan: Version 2.0 — Administration Board (Single Pane of Glass)

**Goal:** One observability and recruiter-activity board so you never miss an opportunity. The portfolio is a lead-generation engine; the admin board is the control room.

**Status:** Implemented (v2.0). Entry: `/admin` or `/admin/board`. See AGENTS.md and README for routes and instrumentation.

---

## 1. Vision and user story

**As Luis (job seeker):** I run a state-of-the-art portfolio to attract recruiters. I need to see, in one place:

- **Is the site healthy?** — Same live metrics and errors as the War Room.
- **Are recruiters chatting?** — Who started a conversation, when, how many messages, did they leave an email?
- **What did they ask?** — Full conversation thread so I can prioritize follow-up.
- **What’s breaking?** — Recent logs and errors without leaving the board.

I don’t want to context-switch between Cloud Logging, Firestore console, War Room, and admin conversations. One **Administration Board** that expands the War Room and adds recruiter analytics, all behind one login (admin secret).

---

## 2. Current state (what we have)

| Piece | Location | Data source |
|-------|----------|-------------|
| Live metrics & errors | `/war-room` (public) | In-memory telemetry → `/api/war-room/data` |
| Cloud Run logs | `/admin/logs` | Cloud Logging API, `X-Admin-Secret` |
| Chat sessions list | `/admin/conversations` | Firestore `chat_sessions` via `/api/admin/sessions` |
| Conversation detail | `/admin/conversations` (drill-down) | Firestore `chat_sessions` + `chat_memory` via `/api/admin/sessions/[id]` |

**Firestore today:**

- **`chat_sessions`** — Per-session: `session_id`, `started_at`, `last_activity_at`, `message_count`, `cache_hits`, `rate_limited`, `status`, `engagement_score`, `recruiter_email`, `total_duration_ms`, `trace_id`.
- **`chat_memory`** — Per-session: `messages[]` (role + content) for context.

No new backend services required for v2.0. We unify the **UI** and, if needed, add a few Firestore reads for aggregates.

---

## 3. Version 2.0 scope: Administration Board

**One authenticated surface:** `/admin` (or `/admin/board`) as the single entry. From there, everything is sections or tabs — no jumping to separate “War Room” vs “Conversations” vs “Logs” URLs for daily use.

### 3.1 Sections of the board

1. **Live system (War Room)**  
   - Reuse the same data as `/war-room`: service status, request metrics, chat metrics, infrastructure, recent events, recent errors, time-series charts.  
   - Option A: Embed or reuse War Room components in the admin layout (admin-only route that renders the same dashboard).  
   - Option B: Iframe to `/war-room` (simplest but less integrated).  
   - **Recommendation:** Reuse components and `/api/war-room/data` so the board is one app, one layout, one auth.

2. **Recruiter activity (Firestore)**  
   - **Sessions table:** Session ID, started, last activity, message count, engagement score, **email (if captured)**, status. Sort by `last_activity_at` desc. Link to open full conversation.  
   - **Summary cards:** Total sessions (e.g. 7d), sessions with email captured, maybe “new since last visit” if we add a simple “last viewed” hint later.  
   - **Conversation detail:** Same as current `/admin/conversations` drill-down: full thread (user + assistant). Open in a side panel or inline expand to avoid leaving the board.

3. **Logs**  
   - **Option A:** Embed the current “logs viewer” (time range, severity, table with trace links) as a section or tab.  
   - **Option B:** Link to “Open full logs” → `/admin/logs` for power use.  
   - **Recommendation:** Embed the same logs UI as a section so “logs” is on the same page; keep `/admin/logs` for deep filtering if needed.

4. **Optional: simple activity feed**  
   - “Latest: 3 sessions in last 24h, 2 with email” or “Last recruiter chat: 2 hours ago.”  
   - Source: Firestore `chat_sessions` (we already have `last_activity_at`). No new collection.

5. **Prometheus metrics**  
   - **App-wide:** Expose **`/api/metrics`** in [Prometheus text exposition format](https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format). Source: same in-memory telemetry (counters, histograms, gauges) that already feeds the War Room. Metric names and labels must be normalized for valid Prometheus output (e.g. `http_requests_total{endpoint="/api/chat",method="POST",status="200"}`).  
   - **Instrumentation everywhere:** Every API route records at least request count and latency (and status). Today `/api/chat`, `/api/health` are well instrumented; add `recordRequest()` (or equivalent) to all remaining routes: `/api/rag`, `/api/war-room/data`, `/api/war-room/explain-error`, `/api/admin/sessions`, `/api/admin/sessions/[id]`, `/api/admin/logs`, `/api/chat/save-email`. Use consistent labels: `endpoint`, `method`, `status`.  
   - **Admin board and this section:** Instrument admin usage: e.g. `admin_board_views_total`, `admin_sessions_list_requests_total`, `admin_logs_requests_total`, `admin_conversation_detail_requests_total`.  
   - **Board UI:** Add a **Metrics** subsection (tab or card) that either (A) links to "Raw Prometheus: /api/metrics" for copy-paste or scraper config, or (B) embeds a read-only summary of key metrics (same counters/gauges the War Room uses, or a table of `metric_name label=value`). Optionally protect `/api/metrics` with admin secret so only the board (and your scraper) can access it.

### 3.2 Auth and routing

- **Auth:** Existing `ADMIN_SECRET`; same as `/admin/conversations` and `/admin/logs` (header or form). One login for the whole board.
- **Routes:**  
  - `/admin` or `/admin/board` → Board (War Room + Recruiter activity + Logs + Metrics).  
  - Keep `/admin/conversations` and `/admin/logs` as optional deep links (e.g. “Conversations only” / “Logs only”) or redirect to the board with a hash/query for the right section.

### 3.3 Data model (Firestore) — no change required

- **`chat_sessions`** — Already has what we need: `recruiter_email`, `message_count`, `engagement_score`, `last_activity_at`, etc.  
- **`chat_memory`** — Already used for full conversation in admin.  
- No new collections for v2.0. If we later add “page views” or “UTM,” that can be v2.1.

---

## 4. Architecture (GCP and code)

### 4.1 GCP

- **Firestore** — Single source of truth for recruiter-facing metrics (sessions, emails, conversations). Already in use; no new projects or DBs.
- **Cloud Run** — Same Next.js app; admin board is more routes and UI. No new services.
- **Cloud Logging** — Already used by `/admin/logs`; we just surface it inside the board.
- **Telemetry** — Existing in-memory metrics and `/api/war-room/data`; board consumes the same API.
- **Prometheus** — App exposes `/api/metrics` (Prometheus text format) from the same in-memory store. Enables scraping by any Prometheus-compatible system (e.g. GCP Managed Service for Prometheus, or self-hosted). No new GCP services required; the endpoint is just another route.

Principle: no new GCP products for v2.0. We’re consolidating **observability and recruiter analytics** into one UI, adding **Prometheus exposition** and **metrics throughout the app and admin board**, and reusing existing data.

### 4.2 Code structure (architect-grade)

- **`/admin` layout**  
  - One layout that checks admin secret (cookie or sessionStorage after first auth), then renders the board with sections (tabs or cards).

- **Sections as components**  
  - `AdminBoardWarRoom` — Uses `getWarRoomData()`-style fetch from `/api/war-room/data`; reuses or mirrors War Room components (status, charts, events, errors).  
  - `AdminBoardRecruiterActivity` — Fetches `/api/admin/sessions` (and optionally a small “stats” endpoint if we add aggregates); table + detail panel.  
  - `AdminBoardLogs` — Same data as `/admin/logs`; call `/api/admin/logs` and render table + filters.  
  - `AdminBoardMetrics` — Prometheus section: link to `/api/metrics` and/or embedded summary of key metrics (e.g. `http_requests_total`, `chat_conversations_total`, `errors_total`). All board and API usage above is instrumented so these metrics reflect traffic to the board as well.

- **APIs**  
  - Reuse: `GET /api/war-room/data`, `GET /api/admin/sessions`, `GET /api/admin/sessions/[id]`, `GET /api/admin/logs`.  
  - New: `GET /api/metrics` — Prometheus text exposition format; reads from same telemetry (counters, histograms, gauges). Optional: require `X-Admin-Secret` so only board/scraper can access.  
  - Optional: `GET /api/admin/board/stats` — Aggregates from Firestore (e.g. sessions last 7d, count with email). Keeps the board to one or two Firestore reads per load if we want summary cards.

- **Security**  
  - All board data behind `X-Admin-Secret` (or same auth as current admin pages).  
  - War Room data is public today; when served **inside** the board, we don’t expose new data — we only restrict who can see the **combined** view (board). Optionally we could require admin for `/api/war-room/data` when requested from the board (same response, different auth). Simplest: board is admin-only; War Room section uses the same public `/api/war-room/data` (no secrets in that payload).

### 4.3 UI/UX

- **Single scroll or tabs:** Either one long page (War Room → Recruiter activity → Logs) or tabs “System | Recruiters | Logs.” Tabs reduce initial load and keep focus.  
- **Recruiter table:** Columns: Last activity, Message count, Email (yes/no or value), Status. Row click → expand or side panel with full conversation (reuse current conversation detail).  
- **Mobile:** Board is for you (admin); desktop-first is acceptable. Responsive table (horizontal scroll or cards) is enough.

---

## 5. Implementation phases

### Phase 0 — Prometheus metrics (app-wide + admin)

- **Expose `/api/metrics`** — Add a GET handler that reads from the existing telemetry module and outputs [Prometheus text exposition format](https://prometheus.io/docs/instrumenting/exposition_formats/#text-based-format). Map current counters/histograms/gauges (including labels encoded in names like `http_requests_total{endpoint="..."}`) to valid `NAME LABELS value` lines.  
- **Instrument all API routes** — Ensure every route calls the telemetry layer: `recordRequest(endpoint, method, statusCode, durationMs)`. Add to: `/api/rag`, `/api/war-room/data`, `/api/war-room/explain-error`, `/api/admin/sessions`, `/api/admin/sessions/[id]`, `/api/admin/logs`, `/api/chat/save-email`.  
- **Admin-specific metrics** — When implementing the board, increment counters such as `admin_board_views_total`, `admin_sessions_list_requests_total`, `admin_logs_requests_total`, `admin_conversation_detail_requests_total` (or equivalent with labels) so admin usage is visible in Prometheus and in the board’s Metrics section.

### Phase 1 — Board shell and War Room

- Add `/admin/board` (or `/admin` redirect to `/admin/board`).  
- Admin layout: require secret; then render a layout with placeholders for “War Room,” “Recruiters,” “Logs,” “Metrics.”  
- **War Room section:** Reuse War Room data fetch and components (or a slim duplicate) so the board shows live metrics and errors.  
- **Metrics section:** Link to `/api/metrics` (and optionally show a small table of key metrics). Record `admin_board_views_total` (or similar) on board load.  
- No change to Firestore or existing APIs beyond instrumentation above.

### Phase 2 — Recruiter activity on the board

- Add **Recruiter activity** section: call `/api/admin/sessions`, render table (session, started, last activity, message count, email, status).  
- Row click → load `/api/admin/sessions/[id]` and show conversation in a panel or modal.  
- Optional: `GET /api/admin/board/stats` (e.g. 7d session count, count with email) and summary cards above the table.

### Phase 3 — Logs on the board

- Add **Logs** section: same filters and table as `/admin/logs`, using `GET /api/admin/logs`.  
- Embed in the board so “logs” are one click away without leaving the page.

### Phase 4 — Polish and entry point

- Nav: from anywhere in admin, “Board” brings you to the single view (tabs/sections: System | Recruiters | Logs | Metrics).  
- Optional: default route `/admin` → board (with login gate).  
- Docs: update README and AGENTS.md so “admin board” is the recommended way to observe recruiters and system health; document `/api/metrics` (Prometheus) and instrumentation for agents.

---

## 6. Success criteria

- You open one URL (`/admin` or `/admin/board`), authenticate once, and see:  
  - Live system health (War Room).  
  - List of recruiter chats and who left an email.  
  - Full conversation on demand.  
  - Recent logs with trace links.  
  - Prometheus metrics (link and/or summary) so you can scrape or eyeball the same metrics from the board.  
- Every API route and admin action is instrumented; `/api/metrics` exposes Prometheus format for the whole app (including admin usage).  
- No need to open Cloud Console or Firestore console for day-to-day “who chatted and what did they say?”

---

## 7. Non-goals (v2.0)

- **No new GCP services** — Firestore, Cloud Logging, existing APIs only.  
- **No BigQuery or Dataflow** — If we need long-term analytics later, that’s v2.1+.  
- **No UTM or page-view tracking** — Can be added later and wired into the same board.  
- **No public War Room change** — Public `/war-room` can stay as is; the board is an admin-only, expanded view.

---

## 8. Summary

| What | How |
|------|-----|
| **Single pane of glass** | One admin board: War Room + Recruiter activity (Firestore) + Logs + **Prometheus metrics**. |
| **Recruiter observability** | Sessions table + email column + full conversation drill-down; optional summary cards. |
| **Prometheus metrics** | **App-wide:** `/api/metrics` in Prometheus text format; every API route + admin actions instrumented. **Board:** Metrics section (link/summary). |
| **Data** | Firestore only (existing collections). No new DBs or services. |
| **GCP** | Same stack: Cloud Run, Firestore, Cloud Logging; Prometheus exposition from in-memory telemetry (scrapable by GCP or any Prometheus). |
| **Auth** | Existing `ADMIN_SECRET`; one login for the whole board. |

This plan keeps v2.0 shippable, uses the database you already have, and makes it easy to see at a glance whether recruiters are engaging and who left contact info — so you can focus on follow-up and not lose opportunities.
