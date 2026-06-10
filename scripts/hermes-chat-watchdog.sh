#!/usr/bin/env bash
# Hermes no-agent cron watchdog for gimenez.dev Inferencia chain.
# Usage (on Pi5): hermes cron create "every 5m" --no-agent --script hermes-chat-watchdog.sh --deliver telegram --name "portfolio-chat-watchdog"
#
# Checks GET /api/health only. That endpoint probes Inferencia /health (see
# src/lib/inferencia-health.ts). Do NOT POST /api/chat here: each inference call
# consumes the 150/day LLM budget and can take 50s+, which false-alarms at 45s.
#
# Exit 0 + empty stdout  = healthy (silent tick)
# Exit 0 + stdout         = alert delivered verbatim
# Non-zero exit           = Hermes delivers error alert

set -euo pipefail

SITE_URL="${SITE_URL:-https://gimenez.dev}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-10}"

fail() {
  echo "portfolio-chat-watchdog: $*"
  exit 0
}

health_json="$(curl -fsS --max-time "$HEALTH_TIMEOUT" "${SITE_URL}/api/health")" || fail "GET /api/health failed"

health_status="$(printf '%s' "$health_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo unknown)"
if [ "$health_status" = "unhealthy" ]; then
  fail "/api/health status=${health_status}"
fi

infer_status="$(printf '%s' "$health_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['checks']['inference_api']['status'])" 2>/dev/null || echo unknown)"
if [ "$infer_status" != "up" ]; then
  fail "/api/health inference_api=${infer_status} (expected up)"
fi

# Healthy — silent tick (watchdog pattern)
exit 0
