# Portfolio Decisions

## Project Setup
- **Framework:** Next.js 16 App Router with TypeScript (Node 20.9+)
- **Styling:** Tailwind CSS with original site colors preserved (#32c0f4 cyan, #e97124 orange)
- **AI Chat:** AI SDK + Inferencia (OpenAI-compatible)
- **RAG:** GCP Cloud SQL (PostgreSQL + pgvector) optional; falls back to file-based knowledge
- **Infrastructure:** GCP Cloud Run via Terraform
- **CI/CD:** Cloud Build (push to `main` → build & deploy to Cloud Run)
- **Version:** Single source of truth in `package.json`, read via `src/lib/version.ts`

## Key Decisions
1. Used original site colors (#32c0f4 cyan for primary, #e97124 orange for secondary) adapted to dark theme
2. Implemented AI SDK for streaming chat (Inferencia API)
3. Created comprehensive rate limiting (per-IP, session cap, daily budget)
4. Pre-seeded cache for common questions to avoid burning API calls
5. Chat API uses Node.js runtime (full API access for RAG/inference) — see [ADR-003](./adr/003-chat-node-runtime-not-edge.md)
6. Single Cloud Run instance with $20 budget kill switch — see [ADR-001](./adr/001-single-cloud-run-instance.md)
7. Page Visibility API for War Room polling — see [ADR-002](./adr/002-page-visibility-war-room-polling.md)
8. Dark theme only — no light mode
9. In-memory telemetry resets on cold start (honest dashboard)
10. SLOs tracked in War Room: availability, P95 latency, error rate, budget headroom

## Architecture Decision Records
See [docs/adr/](./adr/) for formal ADRs.

## Quality Gates
- [x] `npm run build` succeeds
- [x] `npm run lint` passes (0 errors, 0 warnings)
- [x] `npm run test` — Vitest unit tests pass
- [x] `npm run test:e2e` — Cypress smoke tests pass
- [x] All pages render: Home, About, Work, Architecture, Chat, Contact, War Room
- [x] Chat API with rate limiting, prompt injection defense, and caching
- [x] RAG pipeline (file-based; Cloud SQL optional)
- [x] Terraform IaC complete
- [x] Cloud Build CI/CD (push to main → deploy)
- [x] Security headers (CSP, HSTS, X-Frame-Options)
- [x] No secrets in client responses or logs
