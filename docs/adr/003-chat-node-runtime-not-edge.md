# ADR-003: AI Chat Uses Node.js Runtime, Not Edge

**Status:** Accepted
**Date:** 2026-02

## Context

Next.js API routes can run on the Edge Runtime (V8 isolates, limited API surface) or the standard Node.js runtime. The AI chat endpoint (`/api/chat`) needs to:
1. Stream LLM responses via the AI SDK
2. Retrieve RAG context (optionally from Cloud SQL via `pg` driver)
3. Persist session data to Firestore via `firebase-admin`
4. Apply rate limiting with in-memory state

## Decision

Use the Node.js runtime for `/api/chat` (and all API routes). Do not use the Edge Runtime.

## Consequences

- **Positive:** Full Node.js API access — `pg`, `firebase-admin`, `crypto`, and the AI SDK all work without limitations. In-memory rate limiting and telemetry counters work reliably within a single Cloud Run instance. No compatibility issues with native modules.
- **Negative:** Slightly higher cold-start latency compared to Edge Runtime (~200-500ms vs ~50ms). This is acceptable because Cloud Run already has cold-start overhead and the LLM inference itself takes 2-10 seconds.
- **Trade-off:** Edge would give lower latency for the initial connection, but would require external state stores (Redis, KV) for rate limiting and session management — adding complexity and cost that is not justified for a portfolio site.
