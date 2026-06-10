# Vercel cleanup — one project, main-only deploys

## Canonical setup

| Item | Value |
|------|--------|
| Vercel team | `menezmethods-projects` |
| Project | **`lgportfolio` only** (domains: `gimenez.dev`, `www.gimenez.dev`) |
| GitHub repo | `menezmethod/lgportfolio` |
| Production deploy | **Merge to `main` only** (Vercel Git integration) |
| PR previews | **Disabled** (`scripts/vercel-should-build.sh` skips `VERCEL_ENV=preview`) |
| CI | GitHub Actions (`ci.yml`) — lint, build, test, Cypress on PRs and main |

## Removed duplicates (2026-06-10)

Do not recreate these projects — they tripled deployment quota:

- `lgportfolio-fix` (deleted)
- `lgportfolio-inline` (deleted)

## Hermes / agent rules

- **Never** `vercel link` a second project for this repo
- **Never** `vercel --prod` or `vercel rollback` from crons (report-only watchdogs)
- Portfolio weekly audit → PR to `main`; humans merge; Vercel deploys once

## Watchdogs (no chat POST spam)

- `scripts/hermes-chat-watchdog.sh` — uses `/api/health` only (no POST `/api/chat`)
- `~/.hermes/scripts/inferencia-watchdog.py` — same pattern

## Manual commands

```bash
# Inventory + deploy budget
python3 ~/.hermes/scripts/vercel-governor.py --report

# Production deploy (Tier 3 — human only)
cd /Users/luisgimenez/Development/03-products/lgportfolio
git checkout main && git pull
# merge PR in GitHub → Vercel builds automatically
```

## Troubleshooting

**Queued builds piling up:** Dashboard → lgportfolio → Cancel queued. Fix branch churn; previews are off.

**Main not deploying:** Confirm `vercel.json` `ignoreCommand` points at `scripts/vercel-should-build.sh` and latest commit is on `main`.

**Stale production SHA:** Site may still be HTTP 200 — run governor report; merge pending work or promote manually (human decision).
