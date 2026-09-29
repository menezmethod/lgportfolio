# Plan: Cloudflare free tier for RAG + re-enabling War Room and Chat

Status: proposed · 2026-09-28 · repo state: `main` @ 5d22a5e

## 1. Where main actually is

| Area | State on `main` today |
|---|---|
| War Room page | Deleted in #109 ("simplify site"). `/war-room` returns 404 in prod. **Everything it needs survived**: `src/components/war-room/WarRoomDashboard.tsx`, `/api/war-room/data`, `/api/war-room/explain-error`, telemetry, Prometheus client, and the `src/__tests__/api-war-room.test.ts` suite. |
| AI chat | `/chat` works in prod, but is linked from nowhere. Nav is `/`, `/about`, `/contact`; only `not-found.tsx` points at `/chat`. |
| RAG | Prod returns `source: "fallback"` — file-based `retrieveFileContext()`. The Cloud SQL + pgvector branch in `src/lib/rag.ts` is dead code: no `CLOUD_SQL_*` env on Coolify, and `generateEmbedding()` needs `GOOGLE_API_KEY`, which the GCP teardown removed. |
| Chat providers | Inferencia on the Pi (LAN, `gemma4:12b`) → OpenRouter free models. 52s total budget, first-token gate in `src/lib/chat-providers.ts`. The Pi is the single point of failure. |
| War Room data | Intermittently flips to `metrics_source: "memory"` in prod while `/api/health` still reports Prometheus up — an 8s query timeout against a Pi that also runs Ollama and Next. |
| Cloudflare | Already in the path: `gimenez.dev` is on Cloudflare DNS + Cloudflare Tunnel (`docs/DEPLOY-COOLIFY.md`). Everything below uses that same account. No new vendor, no credit card, no paid plan. |

## 2. Free-tier budget (Sept 2026)

| Service | Free allocation | What it covers here |
|---|---|---|
| **Vectorize** | 5M stored / 30M queried dims per month | Entire RAG retrieval: the KB chunks as vectors + one query per `retrieveContext()`. A ~30-chunk KB × 1024 dims ≈ 31k stored dims — orders of magnitude of headroom. |
| **Workers AI** | 10,000 neurons/day (hard cap on Free) | Embeddings for RAG (negligible: ~11 neurons to embed the whole KB, ~0.02 per query) plus chat **fallback**. `@cf/meta/llama-3.3-70b-instruct-fp8-fast` ≈ 141 neurons per ~3k-in/300-out answer → ~70 free fallback replies/day. |
| **AI Search** | Free during open beta: 20,000 queries/mo, 100 instances, 100k files | Alternative, not chosen — managed chunking/embedding hides the step we already have code for, and open beta is a gratuitous pricing risk. Kept in pocket if we ever want managed hybrid search. |
| **AI Gateway** (optional, not in v1) | Core features free: analytics, caching, rate limiting; 100k logs/mo | Later: cache duplicate chat prompts, per-request logs. Skip until asked. |
| **Workers Free** | 100k requests/day | Not needed for this plan — no Worker required (REST APIs are callable from the Next app on the Pi). |

## 3. Phase 1 — RAG on Cloudflare (the actual ask)

**Chosen: Vectorize + Workers AI — the line-for-line equivalent of the old pgvector path.** Same shape as before: embed the query → similarity search → format `[Source: …]` chunks → fall back to file retrieval on any failure. Only the embedding provider and vector store change.

| Old (dead Cloud SQL path) | New (Cloudflare) |
|---|---|
| `generateEmbedding()` → Gemini `text-embedding-004`, 768d, `GOOGLE_API_KEY` | `POST /accounts/{id}/ai/run/@cf/baai/bge-m3` → `result.data[0]`, 1024d, `CLOUDFLARE_API_TOKEN` |
| `pg` Pool + `SELECT … FROM match_documents(query::vector(768), 0.7, topK)` | `POST /accounts/{id}/vectorize/v2/indexes/lgportfolio-kb/query` `{ vector, topK: 5, returnMetadata: "all" }` |
| `match_documents` threshold 0.7 cosine similarity | Vectorize cosine `score` (higher = better); keep `score >= 0.7`, otherwise fall through |
| `scripts/seed-rag-db.ts` + `init-rag-db.sql` | `scripts/seed-rag-cloudflare.ts` — same `chunkText()`, embeds + upserts |

Steps:

1. **Create the index** — `npx wrangler vectorize create lgportfolio-kb --dimensions=1024 --metric=cosine` (wrangler on this Mac is logged in as `luisgimenezdev@gmail.com`, account `2d7646c1…`; if the OAuth token lacks the Vectorize scope, `wrangler login` again or create it in the dashboard). `source`/`content` ride along as per-vector metadata — no metadata index needed.
2. **One scoped token** — Custom API token with `Workers AI:Read` + `Vectorize:Edit`. Env: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (Coolify + `.env.local`).
3. **Seed script** — `scripts/seed-rag-cloudflare.ts`:
   - copy `chunkText()` from `scripts/seed-rag-db.ts` verbatim (splits on `\n\n---+\n\n`, then paragraph-chunks anything over 1500 chars) — same chunks as the pgvector seed
   - embed all chunks in one Workers AI call: `{ "text": [...chunks] }`
   - upsert with stable IDs (`kb-001`…`kb-NNN`) and `metadata: { content, source: "knowledge" }`; re-runs overwrite, so the script is idempotent and needs no delete step
   - run: `CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… npx tsx scripts/seed-rag-cloudflare.ts`
4. **Wire `src/lib/rag.ts`** — same control flow as the old branch:
   - `generateEmbedding()` → Workers AI REST (`{ text: [text] }` → `result.data[0]`); validate 1024 dims
   - `retrieveContext()`: when `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` are set → embed, query Vectorize, map `[Source: ${metadata.source}] ${metadata.content}`, reuse `deduplicateContext`; any error, empty result, or score below threshold → `retrieveFileContext()` (unchanged)
   - delete: the `pg` Pool, `toVectorLiteral()`, the `match_documents` call, the `pg` dependency, and `scripts/seed-rag-db.ts` + `scripts/init-rag-db.sql`
   - update `/api/rag`'s `source` label from `cloudsql` to `cloudflare`
5. **Tests** — extend `src/__tests__/rag.test.ts` with mocked `fetch`: Vectorize success returns cloud context; 500/timeout returns file context.
6. **Verify** — `curl -s -X POST https://gimenez.dev/api/rag -H 'Content-Type: application/json' -d '{"query":"What does Luis do at Home Depot?"}'` → `source: "cloudflare"`, context contains the Home Services section. Flip the token to garbage → still 200 with `fallback`.

Alternative if we change our mind later: AI Search (managed chunking/embedding/hybrid search, free during open beta, 20k queries/mo) — rejected only because it hides the embedding step we already have code for.

## 4. Phase 2 — re-enable chat + make it survive provider outages

1. **Workers AI as the last provider** in `buildChatProviderChain()` (`src/lib/chat-providers.ts`), ~20 lines:
   ```ts
   const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
   const aiToken = process.env.CLOUDFLARE_API_TOKEN?.trim(); // Workers AI:Read
   if (accountId && aiToken) {
     chain.push({
       id: "cloudflare",
       label: "Workers AI (llama-3.3-70b)",
       model: process.env.CLOUDFLARE_CHAT_MODEL?.trim()
         || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
       timeoutMs: 35_000,
       createClient: () => createOpenAI({
         baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
         apiKey: aiToken,
       }),
     });
   }
   ```
   (add `"cloudflare"` to `ChatProviderId`.) Order stays Inferencia → OpenRouter → Cloudflare. The 10k-neuron/day cap failing is fine: the loop already converts it to the existing 503 path.
2. **Re-link `/chat`** — add it to the header nav and one homepage CTA. It is the site's differentiator and #109 orphaned it.
3. **Verify** — `curl -si -X POST https://gimenez.dev/api/chat -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"hi"}]}' | grep -i x-chat-provider`; temporarily break `INFERENCIA_BASE_URL` in Coolify → expect `openrouter` then `cloudflare`.
4. Optional later (not now): put OpenRouter + Workers AI behind AI Gateway for free caching and logs. One more moving part for no required outcome.

## 5. Phase 3 — re-enable War Room

1. **Restore the page** (verified: no deleted imports; `WarRoomDashboard` and both API routes still exist):
   ```bash
   mkdir -p src/app/war-room
   git show 867a4d5^:src/app/war-room/page.tsx > src/app/war-room/page.tsx
   ```
2. **Link it discreetly** — one link from `/about` (or the footer). Keep the "content-first" nav from #109; the War Room is supporting evidence, not a headline.
3. **De-flake the metrics path** (no Cloudflare involved — it's a Pi-oversubscription bug):
   - `src/lib/prometheus-client.ts`: `QUERY_TIMEOUT_MS` 8s → 15s, retry once on timeout.
   - `src/lib/war-room-metrics.ts`: cache the last good Prometheus slice for ~5 min so one missed scrape doesn't flip the whole dashboard to memory.
4. **Verify** — `/war-room` 200; `/api/war-room/data` → `metrics_source: "prometheus"`; `npm run test` (war-room + prometheus suites) green.
5. **Be honest about availability**: `/war-room` is served by the Pi — no Cloudflare product keeps it up when the homelab is off. The honest framing for interviews is "Prometheus + in-memory telemetry on a homelab Pi, Cloudflare Tunnel at the edge", not "always-on".

## 6. Phase 4 — env, docs, deploy

- New env vars (Coolify UI + `.env.example` placeholders):
  `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (`Workers AI:Read` + `Vectorize:Edit`), optional `CLOUDFLARE_VECTORIZE_INDEX=lgportfolio-kb`, `CLOUDFLARE_CHAT_MODEL`.
- Update stale `AGENTS.md` (still documents `/war-room`, `/admin/*`, `/docs`, `/work`, `/architecture` — all removed) and `docs/DECISIONS.md`.
- Run `npm run lint && npm run build && npm run test`; merge to `main`; Coolify deploy; re-run the seed script.
- New monthly cost: **$0**.

## 7. Risks and limits

- **Free-tier quota** — Vectorize (5M stored / 30M queried dims per month) and Workers AI (10k neurons/day) both dwarf this workload. If either is ever exhausted, `retrieveContext()` falls back to file retrieval and chat falls through its provider chain — no user-visible breakage.
- **Workers AI hard cap** (10k neurons/day) — fallback only, never primary; exhaustion degrades to the existing honest 503 with the contact email.
- **Secrets** — scoped tokens only (`Workers AI:Read`, `Vectorize:Edit`); Coolify env, never in git; `.env.example` gets placeholders.
- **RAG content is data, not instructions** — existing system-boundary prompt in `/api/chat` stays untouched.

## 8. Optional Phase 5 — chat that survives the Pi (separate, later)

The only setup where chat stays up when the homelab is off: a Cloudflare Worker routed on `gimenez.dev/api/chat` + `/api/rag` that tries the tunnel origin first and, on origin failure, serves Workers AI + Vectorize directly (rate-limit via KV/D1). Bigger job (Worker deploy, route/loop care, KV rate limiting) — do it only if "works while the Pi sleeps" becomes a real requirement.

## Effort

Phase 1 ≈ 3–4 h · Phase 2 ≈ 1–2 h · Phase 3 ≈ 1–2 h · Phase 4 ≈ 1 h. About one day total; Phase 5 is its own plan.
