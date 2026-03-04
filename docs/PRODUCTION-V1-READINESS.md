# Production v1 release readiness

Checklist for going live with version one.

## Design and copy

- [x] **Administration Board** — No “v2” badge; labeled as version one.
- [x] **Conversations** — Same dark theme and chrome as Administration Board (bg `#0d1117`, cards `#161b22`, header with Board / Logs / Log out).
- [x] **Logs** — Standalone Logs page uses same admin dark theme and layout pattern.
- [x] **Daily budget** — 150 LLM requests per day; resets every calendar day (midnight). Comment in `rate-limit.ts` confirms reset behavior.
- [ ] **Grammar/copy** — Optional pass on all public and admin pages; align knowledge base (Section 8) with site copy.

## Tests and CI

- [x] **Unit tests** — Vitest; `src/__tests__/rate-limit.test.ts` (rate limit, cache, daily budget).
- [x] **E2E tests** — Cypress; `cypress/e2e/smoke.cy.ts` (home, about, chat load).
- [x] **CI workflow** — `.github/workflows/ci.yml` runs on PR and push to `main`: lint, build, unit tests, Cypress.
- [ ] **Branch protection** — Require CI (or `lint-build-test` + `cypress`) to pass before merging to `main`. See `docs/CI-AND-TESTS.md`.

## Already in place

- Rate limits (Cloud Armor + app); caching (CDN, war-room, RAG); cost caps (max instances, $20 budget kill).
- Admin and Firebase secrets via Secret Manager; no secrets in repo.
- Terraform lifecycle: image not overwritten by Terraform; Cloud Build deploys app.
- Logs API: message/endpoint from request logs when `jsonPayload` is missing.

## Before you ship

1. Run locally: `npm run lint && npm run build && npm run test`.
2. Optionally run Cypress: `npm run build && npm run start` (background), then `npm run test:e2e`.
3. Set branch protection so PRs cannot merge until CI passes (see `docs/CI-AND-TESTS.md`).
