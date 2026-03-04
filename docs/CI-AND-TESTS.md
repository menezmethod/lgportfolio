# CI and tests

## What runs

- **Lint:** `npm run lint` (ESLint)
- **Build:** `npm run build` (Next.js)
- **Unit tests:** `npm run test` (Vitest) — e.g. `src/__tests__/rate-limit.test.ts`
- **E2E tests:** `npm run test:e2e` (Cypress) — `cypress/e2e/smoke.cy.ts`

The **GitHub Actions workflow** (`.github/workflows/ci.yml`) runs on every **pull request to `main`** and on **push to `main`**. It runs lint, build, unit tests, and Cypress. Cloud Run deploy is **not** changed — Cloud Build still deploys on push to `main`; this workflow only adds checks.

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
npm run test:e2e        # needs app running: npm run build && npm run start (in another terminal), then cypress run
npm run test:e2e:open   # Cypress UI
```

For e2e, start the app first: `npm run build && npm run start`, then in another terminal `npm run test:e2e`.
