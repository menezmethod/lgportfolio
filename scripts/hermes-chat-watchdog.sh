#!/usr/bin/env bash
# Hermes no-agent cron watchdog for gimenez.dev chat + Inferencia chain.
# Usage (on Pi5): hermes cron create "every 5m" --no-agent --script hermes-chat-watchdog.sh --deliver telegram --name "portfolio-chat-watchdog"
#
# Exit 0 + empty stdout  = healthy (silent tick)
# Exit 0 + stdout         = alert delivered verbatim
# Non-zero exit           = Hermes delivers error alert

set -euo pipefail

SITE_URL="${SITE_URL:-https://gimenez.dev}"
CHAT_TIMEOUT="${CHAT_TIMEOUT:-45}"
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

chat_tmp="$(mktemp)"
trap 'rm -f "$chat_tmp"' EXIT

http_code="$(curl -sS --max-time "$CHAT_TIMEOUT" -o "$chat_tmp" -w '%{http_code}' -X POST "${SITE_URL}/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"ping"}]}')" || fail "POST /api/chat connection failed"

if [ "$http_code" != "200" ]; then
  body="$(head -c 200 "$chat_tmp" | tr '\n' ' ')"
  fail "POST /api/chat returned HTTP ${http_code}: ${body}"
fi

if [ ! -s "$chat_tmp" ]; then
  fail "POST /api/chat returned HTTP 200 but empty body"
fi

# Healthy — silent tick (watchdog pattern)
exit 0
