#!/usr/bin/env bash
# Add OPENROUTER_API_KEY to the lgportfolio Vercel project (all environments).
#
# Prerequisites:
#   export VERCEL_TOKEN=<token from https://vercel.com/account/tokens>
#   export OPENROUTER_API_KEY=<key from https://openrouter.ai/keys>
#
# Usage:
#   ./scripts/vercel-add-openrouter-env.sh
#
# Optional overrides:
#   VERCEL_SCOPE=menezmethods-projects VERCEL_PROJECT=lgportfolio ./scripts/vercel-add-openrouter-env.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SCOPE="${VERCEL_SCOPE:-menezmethods-projects}"
PROJECT="${VERCEL_PROJECT:-lgportfolio}"
KEY_NAME="OPENROUTER_API_KEY"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "error: VERCEL_TOKEN is not set. Create one at https://vercel.com/account/tokens" >&2
  exit 1
fi

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "error: OPENROUTER_API_KEY is not set. Create one at https://openrouter.ai/keys" >&2
  exit 1
fi

export VERCEL_ORG_ID=""
export VERCEL_PROJECT_ID=""

echo "Linking Vercel project ${SCOPE}/${PROJECT}..."
npx --yes vercel@latest link --yes \
  --token "$VERCEL_TOKEN" \
  --scope "$SCOPE" \
  --project "$PROJECT"

for env in production preview development; do
  echo "Setting ${KEY_NAME} for ${env}..."
  npx --yes vercel@latest env add "$KEY_NAME" "$env" \
    --value "$OPENROUTER_API_KEY" \
    --force \
    --yes \
    --token "$VERCEL_TOKEN"
done

echo "Done. Redeploy production to pick up the new variable:"
echo "  npx vercel@latest --prod --token \$VERCEL_TOKEN --scope $SCOPE --project $PROJECT"
