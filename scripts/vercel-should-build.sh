#!/usr/bin/env bash
# Vercel Ignored Build Step — main-only production deploys.
#
# PR / branch pushes: skip (GitHub Actions CI validates PRs; no Vercel preview builds).
# Production: build only when Git merges to main.
#
# Exit 0 = skip build | Exit 1 = proceed with build

set -euo pipefail

if [ "${VERCEL_ENV:-}" = "production" ] && [ "${VERCEL_GIT_COMMIT_REF:-}" = "main" ]; then
  echo "build: production deploy from main"
  exit 1
fi

echo "skip: env=${VERCEL_ENV:-unset} ref=${VERCEL_GIT_COMMIT_REF:-unset}"
exit 0
