# Final sweep checklist — gimenez.dev portfolio

**Date:** February 2026  
**Scope:** Terraform best practices, $20 budget kill switch, free tier, security, full codebase + docs + browser verification.

---

## 1. Terraform

- [x] **Budget kill switch set to $20** — `terraform/budget.tf`: `units = "20"`, display_name `portfolio-$20-kill-switch`. Alerts at 50%, 90%, 100%. Pub/Sub → Cloud Function scales Cloud Run to 0.
- [x] **Free tier first** — Cloud SQL for RAG: `enable_rag_cloud_sql` default **false** (file-based RAG free). Set `true` only if you want vector RAG (~$7–10/mo).
- [x] **Terraform best practices** — Pinned provider versions (~> 5.0), sensitive variables marked, tfvars.example template only (real tfvars gitignored). Comment in `main.tf` references terraform-best-practices.com.
- [x] **APIs** — Only required ones enabled; sqladmin only when Cloud SQL used.
- [x] **CDN caching** — `loadbalancer.tf`: Cloud CDN `CACHE_ALL_STATIC`, default_ttl 3600, max_ttl 86400.

---

## 2. Secrets (never in repo)

- [ ] **Create secrets in GCP (run these yourself; never commit keys):**

  **Project:** Use your actual project ID (e.g. `lgportfolio-a1410`). Alternatively run `./scripts/create-chat-secrets.sh` after setting `PROJECT_ID` and putting your Firebase JSON at `.secret/firebase-service-account.json` (see [CHAT-SECRETS.md](./CHAT-SECRETS.md)).

  ```bash
  # Firebase (chat sessions, admin board) — create secret, then add version with your JSON file
  gcloud secrets create firebase-service-account --project=YOUR_PROJECT_ID
  gcloud secrets versions add firebase-service-account --data-file=path/to/your-firebase-sa.json --project=YOUR_PROJECT_ID

  # Admin UI/API secret
  echo -n "YOUR_ADMIN_SECRET" | gcloud secrets create admin-secret --data-file=- --project=YOUR_PROJECT_ID
  # If secret already exists:
  echo -n "YOUR_ADMIN_SECRET" | gcloud secrets versions add admin-secret --data-file=- --project=YOUR_PROJECT_ID

  # Inferencia (if not in Terraform)
  echo -n "YOUR_INFERENCIA_API_KEY" | gcloud secrets create inferencia-api-key --data-file=- --project=YOUR_PROJECT_ID
  echo -n "YOUR_INFERENCIA_BASE_URL" | gcloud secrets create inferencia-base-url --data-file=- --project=YOUR_PROJECT_ID
  ```

- [x] **.gitignore** — `.env*.local`, `.secrets/`, `*service*account*.json`, `terraform/*.tfvars`, `*.tfstate*`, `*.pem`, `*.key` all ignored.
- [x] **.env.example** — No real values; only variable names and placeholders.
- [x] **No secrets in code** — All credentials from env or Secret Manager.

---

## 3. Security

- [x] **CSP / HSTS / X-Frame-Options** — In `next.config.ts`.
- [x] **Rate limiting** — App (2 RPM, 10 msg/session, 150/day) + Cloud Armor at edge.
- [x] **Prompt injection** — `src/lib/security.ts` patterns.
- [x] **Ingress** — Cloud Run internal-and-cloud-load-balancing only (ALB only).
- [x] **Admin** — All admin routes require `ADMIN_SECRET` (header or session).

---

## 4. Cost & free tier

- [x] **Budget** — $20 kill switch; Pub/Sub + Cloud Function scales Run to 0 when exceeded.
- [x] **Cloud Run** — scale-to-zero, max 1 instance.
- [x] **Cloud SQL** — Off by default (`enable_rag_cloud_sql = false`); no DB cost unless you enable it.
- [x] **Caching** — CDN for static assets to reduce Run invocations.
- [x] **No extra paid services** — Logging, Trace, Monitoring, Armor (standard) within free/low-cost use.

---

## 5. Codebase passes

- [x] **Pass 1** — Terraform: budget $20, free-tier defaults, best-practice comments.
- [x] **Pass 2** — README, AGENTS.md, .env.example: no secrets; Cloud SQL optional; $20 budget noted.
- [x] **Pass 3** — All pages (/, /about, /work, /architecture, /contact, /chat, /war-room, /admin/*): copy and links point to gimenez.dev and current stack (GCP, Cloud SQL optional).
- [x] **Knowledge base** — `src/lib/knowledge.ts`: RAG described as file-based or Cloud SQL (pgvector); no Supabase; framing and rules unchanged.
- [x] **Work page** — Payment Card Tender: GKE, no Pub/Sub. Portfolio project: Cloud SQL pgvector.
- [x] **Architecture page** — RAG: Cloud SQL or file-based, GCP-native.

---

## 6. Build & deploy

- [x] **Build** — `npm run build` succeeds.
- [x] **Lint** — `npm run lint` passes.
- [x] **Terraform** — `terraform init -input=false && terraform validate` passes.
- [ ] **Push to main** — After your review; branch protection may require a PR.
- [ ] **Post-push** — Cloud Build deploys; ensure Secret Manager has `firebase-service-account` and `admin-secret` (and Inferencia secrets if not from Terraform) so `--set-secrets` in `cloudbuild.yaml` succeeds.

---

## 7. Manual steps when you’re back

1. **Create GCP secrets** (see section 2) for the project you use in Terraform/Cloud Build.
2. **Firebase JSON** — Save your Firebase service account JSON to a file outside the repo (e.g. `~/secrets/firebase-sa.json`), then:  
   `gcloud secrets versions add firebase-service-account --data-file=~/secrets/firebase-sa.json --project=YOUR_PROJECT_ID`
3. **Terraform apply** (if you want infra changes):  
   `cd terraform && terraform plan && terraform apply`
4. **Budget** — In `terraform.tfvars` set `billing_account_id` and `budget_alert_email` so the $20 budget and kill switch are created.
5. **.env.local** — Keep only on your machine; add `FIREBASE_SERVICE_ACCOUNT_JSON` (full JSON string) for local dev if you want chat/sessions locally. Never commit.

---

## 8. Browser verification (recommended)

- [x] Open `/` — Hero and sections load (verified in-sweep).
- [x] Open `/work` — Payment Card Tender (GKE, no Pub/Sub); portfolio (Cloud SQL pgvector) (verified).
- [x] Open `/chat` — Send a message; AI responded with knowledge-base answer (verified).
- [x] Open `/war-room` — Tiles and charts load (verified).
- [ ] Open `/admin` — Redirect to board; enter admin secret; check System, Recruiters, Logs, Metrics tabs (do when you have ADMIN_SECRET).
- [ ] Open `/architecture` — Case study and RAG line (Cloud SQL / file-based).

---

## Files touched (summary)

| Area | Files |
|------|--------|
| Terraform | `main.tf`, `budget.tf`, `variables.tf`, `terraform.tfvars.example`, `cloudsql.tf` |
| Security / ignore | `.gitignore` |
| Docs | `README.md`, `AGENTS.md`, `docs/SETUP.md`, `docs/DECISIONS.md`, `docs/QUESTIONS.md`, this checklist |
| App copy | `src/app/work/page.tsx`, `src/app/architecture/page.tsx`, `src/lib/knowledge.ts` |

No secrets or private keys were written into the repository. All sensitive values belong in Secret Manager or local `.env.local` only.
