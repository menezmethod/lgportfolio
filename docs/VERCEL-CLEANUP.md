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

## Git branch cleanup (2026-06-10)

Stale remote branches (agent `cursor/*`, duplicate `master`, deploy trigger branches) were removed so pushes do not leave clutter in GitHub.

```bash
# Preview, then apply
./scripts/git-cleanup-stale-branches.sh
./scripts/git-cleanup-stale-branches.sh --apply
```

**Recommended (one-time, in GitHub UI):** Repo → **Settings → General** → enable **Automatically delete head branches** after PR merge.

Old **Deployments** rows (`Production – lgportfolio-inline`, etc.) stay in GitHub history — harmless; new merges only report `Production`.

## Hermes / agent rules

- **Never** `vercel link` a second project for this repo
- **Never** `vercel --prod` or `vercel rollback` from crons (report-only watchdogs)
- Portfolio weekly audit → PR to `main`; humans merge; Vercel deploys once

## Watchdogs (no chat POST spam, no auto-restart, no env override)

On Pi5 after each pull:

```bash
./scripts/hermes/cleanup-hermes.sh --apply
./scripts/hermes/install-watchdogs.sh
./scripts/hermes/audit-automations.sh
```

| Script | Safe behavior |
|--------|----------------|
| `scripts/hermes/inferencia-watchdog.py` | GET Inferencia `/health` + shallow portfolio health |
| `scripts/hermes/portfolio-chat-watchdog.sh` | Same — **no POST /api/chat**, **no docker restart** |
| `scripts/hermes/cleanup-hermes.sh` | Archives legacy recovery scripts that mutate `INFERENCIA_*` / `.env.coolify` |

**Remove from Hermes crons** (these break Inferencia or override Coolify):

- POST `https://gimenez.dev/api/chat` (loads Ollama, rate limits)
- `docker restart` / Coolify auto-recovery on inferencia or ollama (502 storm)
- `sed` / `echo` to `.env.coolify` or `INFERENCIA_*` env vars
- Intervals under 10 minutes on inference checks

Portfolio `/api/health?shallow=1` + header `X-Hermes-Watchdog: 1` skips the Inferencia probe cascade.

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
