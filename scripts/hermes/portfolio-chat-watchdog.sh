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

# Shallow health — does not cascade into Inferencia /health (see /api/health?shallow=1)
health_json="$(curl -fsS --max-time "$HEALTH_TIMEOUT" \
  -H "X-Hermes-Watchdog: 1" \
  "${SITE_URL}/api/health?shallow=1")" || fail "GET /api/health?shallow=1 failed"

site_status="$(printf '%s' "$health_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo unknown)"
if [ "$site_status" != "healthy" ] && [ "$site_status" != "degraded" ]; then
  fail "/api/health status=${site_status} (expected healthy or degraded)"
fi

# Inferencia direct — /health only, never POST /v1/chat/completions
inferencia_health="${INFERENCIA_HEALTH_URL:-https://llm.menezmethod.com/health}"
infer_code="$(curl -sS --max-time "$HEALTH_TIMEOUT" -o /dev/null -w '%{http_code}' "$inferencia_health" || echo 000)"
if [ "$infer_code" != "200" ]; then
  fail "Inferencia GET ${inferencia_health} returned HTTP ${infer_code}"
fi

# Chat route alive (HEAD — no inference call)
chat_code="$(curl -sS --max-time "$HEALTH_TIMEOUT" -o /dev/null -w '%{http_code}' -X HEAD "${SITE_URL}/api/chat" || echo 000)"
if [ "$chat_code" != "405" ] && [ "$chat_code" != "200" ]; then
  fail "HEAD /api/chat returned HTTP ${chat_code} (expected 405 or 200)"
fi

exit 0
