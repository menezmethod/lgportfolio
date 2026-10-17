# Deploy on Coolify (gimenez.dev)

Production runs as a Dockerfile application under **Coolify** on a free-tier cloud VM, with Cloudflare DNS and proxy in front. Chat retrieval and generation run on Cloudflare: Vectorize for retrieval and Workers AI for generation, through the `lgportfolio-rag` worker in `workers/rag/`.

Earlier self-hosted setups are retired and their deploy scripts were removed. `docker-compose.coolify.yml` is kept for reference only.

## Coolify application

- **Build pack:** Dockerfile. **Port:** `3000`.
- **Domains:** `gimenez.dev` and `www.gimenez.dev`.
- **Environment variables:** see `.env.coolify.example`. Set `COOLIFY=1`.
- **Deploy trigger:** GitHub Actions. Coolify's own "deploy on every commit" stays off.

## CI and deploy

On merge to `main`, `.github/workflows/ci.yml` runs lint, build, unit tests, and Cypress, then calls the Coolify API to deploy the commit that passed CI. The repository needs these Actions secrets:

| Secret | Value |
|--------|--------|
| `COOLIFY_URL` | Base URL of the Coolify instance |
| `COOLIFY_API_TOKEN` | From Coolify **Keys & Tokens** |
| `COOLIFY_APP_UUID` | UUID of the lgportfolio application in Coolify |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `CLOUDFLARE_RAG_WORKER_URL` | URL of the `lgportfolio-rag` worker |
| `CLOUDFLARE_RAG_KEY` | Shared key for the worker. Its presence enables retrieval and Workers AI generation. |
| `ADMIN_SECRET` | Protects the admin APIs and `/api/metrics` |
| `NEXT_PUBLIC_SITE_URL` | `https://gimenez.dev` |
| `COOLIFY` | `1` |
| `PROMETHEUS_URL` | Optional. When set and reachable, the War Room reads Prometheus. Otherwise it reads in-app telemetry. |
| `INFERENCIA_*`, `OPENROUTER_API_KEY` | Optional legacy and fallback providers. `src/lib/chat-providers.ts` tries whichever are set, in that order, before Workers AI. |

## Verify

```bash
curl -s https://gimenez.dev/api/health/live
curl -s https://gimenez.dev/api/war-room/data | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['metrics_source'])"
```

`metrics_source` is `memory` when no Prometheus server is configured.

## Healthcheck

Probe `127.0.0.1:3000`, not `localhost`. On Alpine, `localhost` can resolve to IPv6 while Next.js listens on IPv4, which leaves the container unhealthy even when the site works. Use `/api/health/live`, which only checks that the process is up.

## Refreshing the chat knowledge index

The chat retrieves from a Vectorize index seeded from `src/lib/knowledge.ts`. After you change the knowledge base, refresh the index from your own machine (this calls Cloudflare, so run it only when you mean to):

```bash
cd workers/rag && npx wrangler deploy      # once, so the worker has the /prune route
cd ../..
npx tsx scripts/seed-rag-cloudflare.ts --dry-run   # prints what would be upserted and deleted, calls nothing
npx tsx scripts/seed-rag-cloudflare.ts             # upserts current chunks, then deletes stale chunk ids
```

Chunk ids are stable and sequential (`kb-001`, `kb-002`, ...). The seed step replaces chunks with the same id. The prune step deletes the ids past the last current chunk, so text removed from the knowledge base stops being retrieved. It needs `CLOUDFLARE_RAG_WORKER_URL` and `CLOUDFLARE_RAG_KEY` in `.env.local`.
