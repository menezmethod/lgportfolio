# Deploy on Vercel (primary)

GCP assets (`terraform/`, `cloudbuild.yaml`, `Dockerfile`) stay in the repo for rollback; production traffic is intended to run on **Vercel** after you point DNS here.

**Deploy policy (2026-06):** One Vercel project (`lgportfolio`). Production builds **only on merge to `main`**. PR previews are disabled to protect deployment quota — see [VERCEL-CLEANUP.md](./VERCEL-CLEANUP.md).

## 1. Create the project

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project** → import `menezmethod/lgportfolio`.
2. **Framework Preset:** Next.js (auto-detected). **Node:** 20.x (matches `package.json` engines).
3. **Root directory:** `.` (default).
4. Deploy once on the default `*.vercel.app` URL and confirm pages load.

## 2. Environment variables

In **Project → Settings → Environment Variables**, set at least:

| Variable | Notes |
|----------|--------|
| `INFERENCIA_API_KEY` | Primary LLM for `/api/chat` (self-hosted Inferencia). |
| `INFERENCIA_BASE_URL` | OpenAI-compatible base URL (e.g. `https://llm.menezmethod.com/v1`). |
| `INFERENCIA_CHAT_MODEL` | Optional; app default `gemma4:e4b`. |
| `OPENROUTER_API_KEY` | Cloud fallback when Inferencia/laptop is down (free models). |
| `ADMIN_SECRET` | Required for `/admin/*` and admin APIs. |
| `NEXT_PUBLIC_SITE_URL` | `https://gimenez.dev` (canonical URL / metadata). |

Optional (same behavior as on Cloud Run):

- `FIREBASE_SERVICE_ACCOUNT_JSON` — Firestore session memory / analytics.
- `GOOGLE_CLOUD_PROJECT` — only if you still want **Admin → Logs** to read Cloud Logging from GCP.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics 4.
- RAG Cloud SQL vars — only if you use Postgres/pgvector (see `SETUP.md`).

Redeploy after changing env vars (**Deployments → … → Redeploy** or push to `main`).

### Add OpenRouter key via CLI

```bash
export VERCEL_TOKEN=<from https://vercel.com/account/tokens>
export OPENROUTER_API_KEY=<from https://openrouter.ai/keys>
./scripts/vercel-add-openrouter-env.sh
```

Sets `OPENROUTER_API_KEY` on **production**, **preview**, and **development** for `menezmethods-projects/lgportfolio`.

## 3. Custom domain + Namecheap DNS

In Vercel: **Project → Settings → Domains** → add `gimenez.dev` and `www.gimenez.dev`. Vercel shows the exact records to use; prefer those over anything generic.

**Typical setup when DNS stays at Namecheap** (Advanced DNS):

| Type | Host | Value |
|------|------|--------|
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com.` |

TTL: Automatic or 1 min is fine. Remove old records that pointed the apex/`www` at the GCP load balancer IP so only Vercel remains.

Propagation is usually minutes; SSL is issued by Vercel after DNS verifies.

## 4. CLI (optional)

```bash
npm i -g vercel   # if needed
vercel link       # in repo root; links to the Vercel project
vercel env pull   # optional: download envs to .env.local for local dev
```

## 5. Stop paying for the old GCP app path (manual)

After `gimenez.dev` serves Vercel and looks correct:

1. In **Google Cloud Console → Cloud Build → Triggers**: disable the deploy trigger for this repo (stops image churn on every push).
2. Optionally scale **Cloud Run** `lgportfolio` **max instances** to `0` or delete the trigger only—Terraform and `cloudbuild.yaml` remain for a future return to GCP.

You do **not** need to delete `terraform/` or remove docs; this repo stays dual-capable.

## 6. CI deploy (recommended — fixes silent production stalls)

After CI passes on `main`, GitHub Actions can deploy to the **`lgportfolio`** Vercel project (the one with `gimenez.dev`). Add these **GitHub repo secrets** (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | [Vercel → Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `vercel link` then read `.vercel/project.json`, or Project Settings → General |
| `VERCEL_PROJECT_ID` | Same `.vercel/project.json` — use the **`lgportfolio`** project (not `lgportfolio-inline` or `lgportfolio-fix`) |

Until secrets are set, CI prints a warning and you must redeploy manually.

## 7. One Vercel project (cleanup done)

Duplicate Vercel projects (`lgportfolio-inline`, `lgportfolio-fix`) were **deleted**. Only **`lgportfolio`** should be connected to this repo. See **`docs/VERCEL-CLEANUP.md`**.

Deploy model:

- **PR** → no Vercel build (`scripts/vercel-should-build.sh` skips preview)
- **Merge to `main`** → one production deploy on `lgportfolio`

Enable **Automatically expose System Environment Variables** on the Vercel project.

## 8. Troubleshooting: “pushes to main don’t deploy”

**Symptoms:** GitHub shows merges to `main`, but `gimenez.dev` stays on an old commit; chat fixes never land.

**Check:**

```bash
# Last production deploy (post-cleanup: environment is "Production")
gh api 'repos/menezmethod/lgportfolio/deployments?per_page=5' \
  --jq '.[] | select(.environment=="Production") | {created_at, sha: .sha[0:7]}'
```

**Verify new code is live** (after chat fix merge):

```bash
curl -s https://gimenez.dev/api/health | jq .checks.inference_api
# New code includes latency_ms from Inferencia probe, e.g. {"status":"up","latency_ms":120}
```

**Common causes:**

| Cause | Fix |
|-------|-----|
| Wrong Vercel project updated | Redeploy **lgportfolio** (not inline/fix) |
| `autoJobCancelation` canceled in-flight builds | Disabled in `vercel.json`; rapid merges no longer cancel production |
| Git integration flaky | Use CI deploy secrets (section 6) |
| Env vars changed | Redeploy after updating Vercel env vars |

**Immediate unblock:** Vercel Dashboard → **lgportfolio** → Deployments → **Redeploy** latest `main` (⋯ menu → Redeploy).
