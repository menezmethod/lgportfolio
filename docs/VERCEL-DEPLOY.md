# Deploy on Vercel (primary)

GCP assets (`terraform/`, `cloudbuild.yaml`, `Dockerfile`) stay in the repo for rollback; production traffic is intended to run on **Vercel** after you point DNS here.

## 1. Create the project

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project** → import `menezmethod/lgportfolio`.
2. **Framework Preset:** Next.js (auto-detected). **Node:** 20.x (matches `package.json` engines).
3. **Root directory:** `.` (default).
4. Deploy once on the default `*.vercel.app` URL and confirm pages load.

## 2. Environment variables

In **Project → Settings → Environment Variables**, set at least:

| Variable | Notes |
|----------|--------|
| `INFERENCIA_API_KEY` | Required for `/api/chat` and War Room “explain error”. |
| `INFERENCIA_BASE_URL` | OpenAI-compatible base URL (e.g. `https://llm.menezmethod.com/v1`). |
| `INFERENCIA_CHAT_MODEL` | Optional; app has a default if unset. |
| `ADMIN_SECRET` | Required for `/admin/*` and admin APIs. |
| `NEXT_PUBLIC_SITE_URL` | `https://gimenez.dev` (canonical URL / metadata). |

Optional (same behavior as on Cloud Run):

- `FIREBASE_SERVICE_ACCOUNT_JSON` — Firestore session memory / analytics.
- `GOOGLE_CLOUD_PROJECT` — only if you still want **Admin → Logs** to read Cloud Logging from GCP.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics 4.
- RAG Cloud SQL vars — only if you use Postgres/pgvector (see `SETUP.md`).

Redeploy after changing env vars (**Deployments → … → Redeploy** or push to `main`).

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
