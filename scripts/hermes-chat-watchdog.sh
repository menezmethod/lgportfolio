#!/usr/bin/env bash
# Hermes no-agent cron watchdog for gimenez.dev + Inferencia chain.
# Uses /api/health only — never POST /api/chat (avoids LLM spend + rate limits).
#
# Exit 0 + empty stdout = healthy (silent)
# Exit 0 + stdout         = alert delivered

set -euo pipefail

SITE_URL="${SITE_URL:-https://gimenez.dev}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-10}"

fail() {
  echo "portfolio-chat-watchdog: $*"
  exit 0
}

health_json="$(curl -fsS --max-time "$HEALTH_TIMEOUT" "${SITE_URL}/api/health")" || fail "GET /api/health failed"

infer_status="$(printf '%s' "$health_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['checks']['inference_api']['status'])" 2>/dev/null || echo unknown)"
if [ "$infer_status" != "up" ]; then
  fail "/api/health inference_api=${infer_status} (expected up)"
fi

# Chat route alive (HEAD — no inference call)
chat_code="$(curl -sS --max-time "$HEALTH_TIMEOUT" -o /dev/null -w '%{http_code}' -X HEAD "${SITE_URL}/api/chat" || echo 000)"
if [ "$chat_code" != "405" ] && [ "$chat_code" != "200" ]; then
  fail "HEAD /api/chat returned HTTP ${chat_code} (expected 405 or 200)"
fi

exit 0
