#!/usr/bin/env bash
# Vercel Ignored Build Step
#
# One canonical project (lgportfolio) builds:
#   - Preview on PRs / non-main branches
#   - Production when merged to main
#
# Duplicate projects (lgportfolio-inline, lgportfolio-fix) always skip.
#
# Setup on lgportfolio only (Vercel → Settings → Environment Variables):
#   VERCEL_CANONICAL_PROJECT=1   (all environments, or at least Preview + Production)
#
# Also: disconnect Git on lgportfolio-inline and lgportfolio-fix (see docs/VERCEL-CLEANUP.md)
#
# Exit 0 = skip | Exit 1 = build

set -euo pipefail

if [ "${VERCEL_CANONICAL_PROJECT:-}" != "1" ]; then
  echo "skip: duplicate Vercel project (not lgportfolio)"
  exit 0
fi

case "${VERCEL_ENV:-}" in
  preview)
    echo "build: canonical preview"
    exit 1
    ;;
  production)
    if [ "${VERCEL_GIT_COMMIT_REF:-}" = "main" ]; then
      echo "build: canonical production (main)"
      exit 1
    fi
    echo "skip: production deploy only allowed from main"
    exit 0
    ;;
  *)
    echo "skip: unknown VERCEL_ENV=${VERCEL_ENV:-unset}"
    exit 0
    ;;
esac
