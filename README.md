# gimenez.dev

Source for [gimenez.dev](https://gimenez.dev), the portfolio of Luis Gimenez. It is also a small production system: a Next.js app with a RAG chat and a live War Room, deployed with Coolify on a free-tier cloud VM.

## Stack

- **App:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4.
- **Hosting:** Coolify on a free-tier cloud VM, with Cloudflare DNS and proxy in front. Merging to `main` runs CI (lint, build, unit tests) on GitHub Actions and then triggers the Coolify deploy. See [docs/DEPLOY-COOLIFY.md](docs/DEPLOY-COOLIFY.md).
- **Chat:** retrieval and generation run on Cloudflare. A Cloudflare Worker (`workers/rag`) embeds with Workers AI and searches a Vectorize index, and Workers AI generates the answer. File-based retrieval over `src/lib/knowledge.ts` is the fallback.
- **Provider chain in code:** `src/lib/chat-providers.ts` can try [inferencia](https://github.com/menezmethod/inferencia) and OpenRouter before Workers AI, but only when their environment variables are set. `CHAT_PROVIDERS` (comma list of `inferencia`, `openrouter`, `cloudflare`) restricts chat to exactly those providers in that order without deleting any keys; production sets `CHAT_PROVIDERS=cloudflare`, so chat generation runs on Cloudflare Workers AI. The chat page and the War Room show the providers that are active.
- **Observability:** in-app telemetry and structured JSON logs feed the public `/war-room` page. When `PROMETHEUS_URL` is set and reachable, the page reads Prometheus instead, and a source badge says which. `/api/metrics` exposes the Prometheus text format behind an admin secret.
- **Rollback path:** Terraform, Cloud Build, and a Cloud Run deployment are kept in `terraform/`, `cloudbuild.yaml`, and the `Dockerfile`. See [docs/DEPLOY-CLOUDRUN.md](docs/DEPLOY-CLOUDRUN.md).

Limit: War Room counters live in memory and reset when the app restarts.

## Run it locally

```bash
npm install
cp .env.example .env.local   # optional: Cloudflare RAG and admin keys
npm run dev                  # http://localhost:3000
```

Every public page works without keys. Chat returns 503 until an inference provider is configured.

## Checks

```bash
npm run lint
npm run test        # Vitest
npm run build
```

Cypress end-to-end tests run in CI (`npm run test:e2e`). See [docs/CI-AND-TESTS.md](docs/CI-AND-TESTS.md).

## Content

- Pages read from `src/content/pages/*.md` and `src/content/projects.json`.
- The chat knowledge base is `src/lib/knowledge.ts`. Claims there follow the CV: if the CV does not support a statement, it does not belong in the file.
- Personal projects are built on personal equipment.
- `scripts/build-resume.mjs` builds `public/Luis-Gimenez-Resume.pdf` from the CV source with headless Chrome. It applies public-safe substitutions from a private, gitignored file (`.private/resume-redactions.json`, or the path in `RESUME_REDACTIONS_FILE`) and stops with an explanation if that file is missing.
- Checks that name private terms read `.private/forbidden-terms.json` when it exists and are skipped with a warning when it does not (for example in CI). Neither file is committed.

## More

- [AGENTS.md](AGENTS.md): how to run, deploy, and debug this repo.
- [docs/](docs/README.md): deployment, cost, CI, and architecture decisions.
