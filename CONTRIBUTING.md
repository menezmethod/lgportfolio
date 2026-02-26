# Contributing

## Humans

- **Setup:** See [README.md](./README.md) (quick start, env vars, project structure).
- **Deploy / infra:** See [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md) and [AGENTS.md](./AGENTS.md).

## AI agents (Cursor, Claude Code, OpenClaw, etc.)

**Use [AGENTS.md](./AGENTS.md) as the single source of truth.** It covers:

- How to run (`npm run dev`), build (`npm run build`), and lint
- Deployment: push to `main` → Cloud Build deploys; when to use Terraform
- All routes (including admin: `/admin/conversations`, `/admin/logs`) and APIs
- Environment variables and secrets (no keys in repo; use `.env.local` or Secret Manager)
- Security: rate limits, prompt-injection defense, headers
- **Viewing logs:** UI (`/admin/logs`), CLI (`gcloud logging read`), API (`GET /api/admin/logs` with `X-Admin-Secret`)
- **Admin:** `ADMIN_SECRET` for sessions and logs; Firestore for chat analytics/memory
- Gotchas: no test script, rate limits on in prod, War Room cache 10s
- Free-tier and cost control (budget kill switch in `scripts/`)

Before making changes, read the relevant section of AGENTS.md so your edits match run/deploy/debug and constraints.
