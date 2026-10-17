# CI and tests

## What runs

- **Lint:** `npm run lint` (ESLint)
- **Build:** `npm run build` (Next.js)
- **Unit tests:** `npm run test` (Vitest) — e.g. `src/__tests__/rate-limit.test.ts`
- **E2E tests:** `npm run test:e2e` (Cypress) — `cypress/e2e/smoke.cy.ts` and `flows.cy.ts`. They need no secrets and never send a chat message or call a model.

The **GitHub Actions workflow** (`.github/workflows/ci.yml`) runs on every **pull request to `main`** and on **push to `main`**. Order:

1. **`lint-build-test`:** lint, build, unit tests.
2. **`cypress`:** builds the commit, starts its own production server (`node .next/standalone/server.js` on `127.0.0.1:3000`, with `public` and `.next/static` copied in as the Dockerfile does), waits for `/api/health/live`, and runs Cypress against it (`CYPRESS_BASE_URL=http://127.0.0.1:3000`). A redesign is therefore tested against itself, not against the live site it is about to replace.
3. **`deploy`** (push to `main` only, needs `lint-build-test` and `cypress`): triggers the **Coolify deploy** via the API.
4. **`smoke-production`** (after `deploy`): this job is **strict**.
   - It polls `https://gimenez.dev/api/health/live` every 10 s for up to 8 minutes while Coolify builds. If it never returns HTTP 200 the job **fails**, the workflow turns red, and the `::error::` annotation says Coolify accepted the deploy but the live site is not answering.
   - Then plain `curl` assertions: `/` and `/privacy` return 200, `/api/health/live` returns exactly `{"status":"ok"}`, and `/api/chat/storage` returns JSON with a boolean `storage`. Any miss fails the job.
   - Only the last step, the Cypress content smoke (`cypress/e2e/smoke.cy.ts`), is non-blocking: if it fails it prints a warning annotation.

### Uptime check (`.github/workflows/uptime.yml`)

Runs on `schedule: "*/15 * * * *"` and by hand (`workflow_dispatch`). One job requests `/`, `/privacy` and `/api/health/live` with `curl -fsS -m 15`, 3 attempts 10 s apart, and fails with an `::error::` message on any non-200, or if the `/api/health/live` body is not exactly `{"status":"ok"}`. It needs no secrets, has `contents: read` only, and a concurrency group so runs do not stack.

Limits to know about:
- GitHub Actions cron can run late (it often slips by several minutes under load) and is not guaranteed.
- Scheduled workflows are **auto-disabled after 60 days without repository activity**. Re-enable from the Actions tab if that happens.
- GitHub emails only the user who last touched the workflow (the "actor"), and only if their notification settings allow it.
- **Owner action:** also add an external free monitor, for example UptimeRobot, on `https://gimenez.dev/api/health/live` (keyword `ok`, 5 minute interval) with email or push alerts. It does not depend on GitHub.

`cypress.config.ts` keeps `https://gimenez.dev` as the default `baseUrl` for manual runs; override with `CYPRESS_BASE_URL` or `--config baseUrl=...`.

**Terraform is not in CI.** The `terraform/` directory remains for optional GCP rollback (`docs/DEPLOY-CLOUDRUN.md`); validate manually if you change it.

### Coolify deploy secrets (GitHub → Settings → Secrets)

| Secret | Example / where to get it |
|--------|---------------------------|
| `COOLIFY_URL` | Base URL of your Coolify instance |
| `COOLIFY_API_TOKEN` | Coolify → **Keys & Tokens** → create API token with deploy permission |
| `COOLIFY_APP_UUID` | Coolify app → **Configuration** → UUID in URL or API |

In the Coolify app, **disable** “Deploy on commit” / auto-deploy from GitHub — CI is the gate so broken code does not reach production.

All three Coolify secrets are **required** on `main` pushes; the deploy job fails if any are missing.

## Require CI to pass before merging (branch protection)

Branch protection is configured so PRs cannot merge into `main` until **lint-build-test** and **cypress** pass.

### Using `gh` CLI (already applied)

From the repo root:

```bash
gh api -X PUT repos/menezmethod/lgportfolio/branches/main/protection \
  --input scripts/branch-protection-payload.json \
  -H "Accept: application/vnd.github+json"
```

The payload in `scripts/branch-protection-payload.json` sets:
- **Required status checks:** `lint-build-test`, `cypress` (must pass before merge)
- **Enforce admins:** true
- **Required pull request reviews:** 0 approvals (PR required; status checks block merge)
- **Restrictions:** null (no user/team push restrictions)

To change required checks, edit `contexts` in the JSON and re-run the command.

### Option: GitHub UI

Repo → **Settings** → **Branches** → rule for `main` → **Require status checks to pass before merging** → select `lint-build-test` and `cypress`.

## Running locally

```bash
npm run lint
npm run build
npm run test
npm run test:e2e        # needs the app running, see below; defaults to https://gimenez.dev
npm run test:e2e:open   # Cypress UI
```

For e2e, run it the way CI does, against a production build:

```bash
npm run build
cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static
(cd .next/standalone && PORT=3000 HOSTNAME=127.0.0.1 node server.js) &
npx cypress install   # once
npx cypress run --config baseUrl=http://127.0.0.1:3000
```
