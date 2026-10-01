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
4. **`smoke-production`** (after `deploy`, **non-blocking**, `continue-on-error`): waits up to about 5 minutes for `https://gimenez.dev/api/health/live` while Coolify builds, then runs `cypress/e2e/smoke.cy.ts` against production. A failure prints a warning annotation and does not turn the workflow red.

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
