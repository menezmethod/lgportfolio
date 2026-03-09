# Traffic & cost control

This document describes **rate limits**, **caching**, and **cost controls** so the site remains within budget under traffic spikes. Configuration favors free-tier usage where possible.

---

## Request volume & networking cost

**Uptime checks** (GCP Monitoring) and **client polling** (War Room, Admin Board) drive most of the request count when traffic is low. Each request hits the load balancer and (unless CDN serves it) Cloud Run, contributing to egress and invocation cost.

| Source | Low-traffic (current) | If job hunting (tighter SLA) |
|--------|------------------------|-----------------------------|
| Uptime checks (all 3) | 600s (10 min) → ~432/day | health 60s or 300s, others 300s |
| War Room / Admin poll | 60s → 1/min per tab | 30s |
| War room API server cache | 60s | 30s |

**Low-traffic mode (default):** Uptime checks every 10 min, dashboard poll every 60s. Architecture is still visible (LB, CDN, Armor, Run, 3 uptime checks, alert); cost stays minimal. **When job hunting:** In `terraform/monitoring.tf` set health `period = "60s"` or `"300s"`; in War Room and Admin board pages change poll interval to `30000`; in `api/war-room/data/route.ts` set `CACHE_TTL = 30_000` and `max-age=30`.

---

## Rate limits (two layers)

### 1. Cloud Armor (edge, before Cloud Run)

| Rule   | Scope              | Limit        | Purpose |
|--------|--------------------|--------------|---------|
| 100    | `/api/admin/*`     | **Exempt**   | Admin board traffic with `X-Admin-Secret` not throttled. |
| 200    | `/api/war-room/data` | 120 req/min per IP | Dashboard polling; higher than global so one user doesn’t 429. |
| 1000   | All traffic        | 180 req/min per IP | Global cap; blocked requests never hit Cloud Run. |
| 900    | `/api/chat`        | 10 req/min per IP | Chat is expensive; strict limit. |
| 2000+  | Scanners / exploit paths | Deny 403   | Block bad user agents and path traversal. |

**File:** `terraform/security.tf`. Adaptive DDoS (layer 7) is enabled.

### 2. Application (in Cloud Run)

| Layer        | Where            | Limit        | Purpose |
|-------------|------------------|--------------|---------|
| Chat per IP | `src/lib/rate-limit.ts` | 2 RPM (config: `CHAT_MAX_RPM_PER_IP`) | Prevents one IP from burning LLM budget. |
| Daily LLM   | Same             | 150/day (config: `CHAT_DAILY_BUDGET`) | Keeps chat within free-tier usage. |
| Session     | Same             | 10 messages/session (config: `NEXT_PUBLIC_CHAT_MAX_MESSAGES`) | Caps tokens per conversation. |

**Override:** `RATE_LIMITS_DISABLED=true` disables app limits (dev only; do not use in prod).

---

## Caching (free tier, reduces origin load)

### CDN (Cloud CDN, Terraform)

- **Backend:** `terraform/loadbalancer.tf` — `enable_cdn = true`, `CACHE_ALL_STATIC`.
- **TTLs:** `default_ttl = 3600`, `max_ttl = 86400`, `client_ttl = 3600`.
- **Negative caching:** 404 cached at edge for 30s (429 not supported by Cloud CDN for negative caching).
- **When it caches:** Responses with cacheable `Cache-Control` (e.g. `public, max-age=...`).

### App-sent Cache-Control (Next.js)

- **Static pages** (/, /about, /work, /contact, /architecture, /war-room):  
  `public, max-age=3600, s-maxage=3600, stale-while-revalidate=60`  
  → CDN and browser cache; spike traffic is served from edge.
- **Config:** `next.config.ts` → `headers()`.

### In-memory (server-side, per instance)

| Endpoint              | TTL   | Purpose |
|-----------------------|-------|---------|
| `/api/war-room/data`  | 60 s | Dashboard metrics; client polls every 60s (low-traffic cost). |
| `/api/rag`            | 60 s | Response cache by normalized query (max 200 entries). Duplicate questions (e.g. “who is luis”) hit cache. |
| Chat                  | N/A  | In-memory cached replies for common prompts (`getCachedResponse` in `rate-limit.ts`). |

### What is not cached

- `/api/chat` (LLM) — never cached.
- `/api/health` — `no-store`.
- `/admin/*` — dynamic, no cache.
- `/api/admin/*` — dynamic, no cache.

---

## Cost controls

| Control            | Where              | Effect |
|--------------------|--------------------|--------|
| **Max instances**  | Terraform + Cloud Build | `max_instance_count = 1` → at most one Cloud Run instance. |
| **Budget kill**    | `terraform/budget.tf` + `budget-kill.tf` | $20 budget; at threshold, Pub/Sub → Cloud Function sets Cloud Run to 0 instances. |
| **Edge rate limits** | Cloud Armor       | 180/min global; excess gets 429 at edge and does not reach Cloud Run. |
| **Chat limits**    | App + Cloud Armor  | 2 RPM per IP, 10/min at edge, 150/day, 10 msgs/session. |

---

## Behavior under traffic spike

1. **Static pages** → Served from CDN (1h cache); origin gets very few HTML requests.
2. **War room** → 60s server cache + 120/min per IP at edge; dashboard remains usable without overloading origin.
3. **Chat** → Hard limits (2 RPM, 10/min edge, 150/day) keep LLM and Firestore usage bounded.
4. **RAG** → 60s response cache absorbs duplicate questions.
5. **Rate-limited responses** → Served at edge; excess requests do not reach Cloud Run.
6. **Runaway cost** → Single instance cap + $20 budget kill switch stop scaling and spend.

---

## Distributed abuse (e.g. many IPs / botnet)

If an attacker uses many IPs (e.g. 1000 machines) and opens the site or War Room and leaves tabs open:

- **Per-IP limits** — Cloud Armor applies 180 req/min per IP (global) and 120/min per IP for `/api/war-room/data`. So 1000 IPs could theoretically send 120k–180k requests/min. In practice they are capped per IP; no single IP can exceed the intended budget.
- **War Room polling only when visible** — The War Room and Administration Board only poll `/api/war-room/data` when the browser tab is **visible** (Page Visibility API). Tabs left open in the background do **not** keep polling. That greatly reduces traffic from "leave 1000 tabs open" abuse.
- **Single instance + budget kill** — `max_instance_count = 1` and the $20 budget kill (scale-to-zero) cap cost. Under heavy distributed traffic the instance is saturated and cost is bounded; once the budget threshold is hit, the service is scaled to zero.
- **Adaptive DDoS** — Cloud Armor layer-7 adaptive protection is enabled; it can detect and mitigate volumetric patterns.

So protection is: per-IP rate limits, no background polling for War Room, one instance max, and automatic scale-to-zero on budget.

---

## Checklist (all areas)

- [x] Cloud Armor: global 180/min, chat 10/min, admin exempt, war-room 120/min, scanner/exploit block.
- [x] App: 2 RPM chat, 150/day, 10 msgs/session; chat cache for common prompts.
- [x] CDN: enabled, static cache, negative caching for 404 (30s).
- [x] Static pages: Cache-Control for /, /about, /work, /contact, /architecture, /war-room.
- [x] War room API: 60s server cache; client polls every 60s when tab visible (low-traffic cost).
- [x] RAG API: 60s in-memory response cache, 200 entries max.
- [x] Max instances: 1.
- [x] Budget: $20 kill switch with auto scale-to-zero.

See `AGENTS.md` for run/build/deploy and `docs/CHECKLIST-FINAL-SWEEP.md` for the production checklist.
