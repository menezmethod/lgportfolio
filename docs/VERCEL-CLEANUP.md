# Vercel project cleanup

## Problem

Three Vercel projects are connected to this repo. Every push/PR triggers **three builds**:

| Project | Status |
|---------|--------|
| `lgportfolio` | **Keep** — serves `gimenez.dev` |
| `lgportfolio-inline` | **Disconnect** — duplicate, burns build minutes |
| `lgportfolio-fix` | **Disconnect** — duplicate, burns build minutes |

## Target behavior

| Event | What deploys |
|-------|----------------|
| Open/update PR | **Preview** on `lgportfolio` only |
| Merge to `main` | **Production** on `lgportfolio` only |
| Any event | `lgportfolio-inline` / `lgportfolio-fix` → **skipped** |

Controlled by `scripts/vercel-should-build.sh` in `vercel.json`.

## One-time setup (Vercel Dashboard)

### Step 1 — Disconnect duplicate projects

For **`lgportfolio-inline`** and **`lgportfolio-fix`**:

1. [Vercel Dashboard](https://vercel.com/dashboard) → open project
2. **Settings** → **Git** → **Disconnect**
3. (Optional) Delete the project entirely if unused

### Step 2 — Configure canonical project

On **`lgportfolio`** only:

1. **Settings** → **Environment Variables** → add:

| Name | Value | Environments |
|------|-------|--------------|
| `VERCEL_CANONICAL_PROJECT` | `1` | Production, Preview, Development |

2. **Settings** → **Git** → enable **Automatically expose System Environment Variables**

3. Confirm **Production Branch** = `main`

### Step 3 — Verify after next PR

GitHub checks should show:

- `Vercel – lgportfolio` — building or success
- `Vercel – lgportfolio-inline` — **Canceled / Ignored** (or gone after disconnect)
- `Vercel – lgportfolio-fix` — **Canceled / Ignored** (or gone after disconnect)

After merge to `main`, only one production deploy:

```bash
gh api 'repos/menezmethod/lgportfolio/deployments?per_page=5' \
  --jq '.[] | select(.environment | test("lgportfolio")) | {environment, sha: .sha[0:7], created_at}'
```

## Optional: CI deploy backup

Add GitHub secrets for `lgportfolio` project ID only. See `docs/VERCEL-DEPLOY.md` §6.
