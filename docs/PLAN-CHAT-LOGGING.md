# Plan: Log All Chat Sessions (Analytics)

**Status:** Implemented (February 2026).  
**Goal:** Log all chat sessions for analytics while preserving security and privacy.  
**Constraint:** Use only GCP-hosted services (no Supabase or other third-party DBs).

## Where to store (GCP only, free-tier friendly)

- **Firestore:** Document store with generous free tier (1 GiB storage, 50K reads / 20K writes per day). Suited for session documents (e.g. one doc per session with message_count, timestamps, status). Same project as Cloud Run; use Firestore client in the chat route.
- **BigQuery:** Analytics over time (aggregations, trends). Free tier: 1 TB query/month, 10 GB storage. Optionally stream session summary rows to a BigQuery table for reporting; keep raw session docs in Firestore or Cloud Logging.
- **Cloud Logging:** Structured logs (trace_id, latency, cache_hit, status). Already in use; can add a dedicated log name for chat sessions. Free 50 GB/month. Good for audit trail; query via Logs Explorer or export to BigQuery later.

Recommendation: **Firestore for session records** (free tier, server-side only, GCP-native). Optionally **Cloud Logging** for every request and **BigQuery** later if we need dashboards.

## Considerations for implementation

- **What to log:** Session id, timestamp, message count, latency, cache hit, rate limit, errors. No message content (PII, abuse surface).
- **Consent & disclosure:** Privacy policy / chat UI notice if storing any identifiable session data.
- **Security:** No secrets or PII in stored records; sanitization; IAM so only Cloud Run and (if needed) minimal roles can read/write.
- **Schema (e.g. Firestore):** session_id, started_at, last_activity_at, message_count, cache_hits, rate_limited, status, total_duration_ms, trace_id. No user content.

## Current state

- Chat route logs: trace_id, latency, cache_hit, status. No full message content. Prompt-injection blocks are logged without user content (security fix applied).
- War Room / telemetry: in-memory metrics only; no persistent session store.

## Implemented

1. **Scope:** Session-level analytics (no message content in `chat_sessions`); conversation memory in `chat_memory` (role + content for context only).
2. **Firestore:** `src/lib/firestore.ts` — collections `chat_sessions`, `chat_memory`. No Terraform (Firestore already in use); set `FIREBASE_SERVICE_ACCOUNT_JSON` from Secret Manager in Cloud Run.
3. **Chat route:** Writes session summary after each request; appends user+assistant to memory for streaming responses; cache hits also persisted.
4. **Server-side only;** client sends `session_id` (generated once per tab).
5. **Engagement:** Dynamic session limits (default 10, up to 25 when engaged). Optional recruiter email capture via "Email me this conversation" and `/api/chat/save-email`.
6. **Admin:** `/admin/conversations` — list sessions and view full conversation (read-only), protected by `ADMIN_SECRET`.

## Next steps (optional)

- Document in privacy policy that session metadata and conversation memory are stored (GCP Firestore).
- Add Terraform for Firestore indexes if query patterns grow.
