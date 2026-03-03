# Traffic & cost readiness (if the portfolio blows up)

This doc audits **rate limits**, **caching**, and **cost controls** so the site can handle a traffic spike without blowing the budget. All levers stay within free tier where possible.

---

## Rate limits (two layers)

### 1. Cloud Armor (edge, before Cloud Run)

| Rule   | Scope              | Limit        | Purpose |
|--------|--------------------|--------------|---------|
| 100    | `/api/admin/*`     | **Exempt**   | Admin board traffic with `X-Admin-Secret` not throttled. |
| 200    | `/api/war-room/data` | 120 req/min per IP | Dashboard polling; higher than global so one user doesn’t 429. |
| 1000   | All traffic        | 60 req/min per IP | Global cap; blocked requests never hit Cloud Run. |
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
- **Negative caching:** 404 and 429 cached at edge for 30s so bursts don’t hammer origin.
- **When it caches:** Responses with cacheable `Cache-Control` (e.g. `public, max-age=...`).

### App-sent Cache-Control (Next.js)

- **Static pages** (/, /about, /work, /contact, /architecture, /war-room):  
  `public, max-age=3600, s-maxage=3600, stale-while-revalidate=60`  
  → CDN and browser cache; spike traffic is served from edge.
- **Config:** `next.config.ts` → `headers()`.

### In-memory (server-side, per instance)

| Endpoint              | TTL   | Purpose |
|-----------------------|-------|---------|
| `/api/war-room/data`  | 30 s | Dashboard metrics; one compute per 30s per instance. |
| `/api/rag`            | 60 s | Response cache by normalized query (max 200 entries). Duplicate questions (e.g. “who is luis”) hit cache. |
| Chat                  | N/A  | In-memory cached replies for common prompts (`getCachedResponse` in `rate-limit.ts`). |

### What is not cached

- `/api/chat` (LLM) — never cached.
- `/api/health` — `no-store`.
- `/admin/*` — dynamic, no cache.
- `/api/admin/*` — dynamic, no cache.

---

## Cost caps (so we don’t go poor)

| Control            | Where              | Effect |
|--------------------|--------------------|--------|
| **Max instances**  | Terraform + Cloud Build | `max_instance_count = 1` → at most one Cloud Run instance. |
| **Budget kill**    | `terraform/budget.tf` + `budget-kill.tf` | $20 budget; at threshold, Pub/Sub → Cloud Function sets Cloud Run to 0 instances. |
| **Edge rate limits** | Cloud Armor       | 60/min global; excess gets 429 at edge and does not reach Cloud Run. |
| **Chat limits**    | App + Cloud Armor  | 2 RPM per IP, 10/min at edge, 150/day, 10 msgs/session. |

---

## If traffic “blows up” tomorrow

1. **Static pages** → Served from CDN (1h cache); origin gets very few HTML requests.
2. **War room** → 30s server cache + 120/min per IP at edge; dashboard stays usable without overloading origin.
3. **Chat** → Hard limits (2 RPM, 10/min edge, 150/day) keep LLM and Firestore usage bounded.
4. **RAG** → 60s response cache absorbs duplicate questions.
5. **429 bursts** → Negative caching (30s) at CDN so repeated 429s don’t all hit Cloud Run.
6. **Runaway cost** → Single instance cap + $20 budget kill switch stop scaling and spend.

---

## Checklist (all areas)

- [x] Cloud Armor: global 60/min, chat 10/min, admin exempt, war-room 120/min, scanner/exploit block.
- [x] App: 2 RPM chat, 150/day, 10 msgs/session; chat cache for common prompts.
- [x] CDN: enabled, static cache, negative caching 404/429 30s.
- [x] Static pages: Cache-Control for /, /about, /work, /contact, /architecture, /war-room.
- [x] War room API: 30s server cache, Cache-Control 30s.
- [x] RAG API: 60s in-memory response cache, 200 entries max.
- [x] Max instances: 1.
- [x] Budget: $20 kill switch with auto scale-to-zero.

No secrets in repo; no test suite. See `AGENTS.md` for run/build/deploy and `docs/CHECKLIST-FINAL-SWEEP.md` for general checklist.
