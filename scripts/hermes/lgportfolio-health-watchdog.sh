#!/usr/bin/env bash
# Hermes no-agent cron watchdog for lgportfolio (gimenez.dev) site health.
# Report-only — never deploys, rollbacks, or restarts containers.
#
# Checks:
#   GET /api/health/live   — process liveness (Docker/Coolify healthcheck path)
#   GET /                  — homepage reachable
#   GET /api/health?shallow=1 — app health without Inferencia cascade
#
# Exit 0 + empty stdout = healthy (silent)
# Exit 0 + stdout         = alert line for Hermes delivery
#
# Env:
#   SITE_URL          default https://gimenez.dev
#   HEALTH_TIMEOUT    default 10 (seconds)

set -euo pipefail

SITE_URL="${SITE_URL:-https://gimenez.dev}"
SITE_URL="${SITE_URL%/}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-10}"
USER_AGENT="hermes-lgportfolio-health-watchdog/1"

fail() {
  echo "lgportfolio-health-watchdog: $*"
  echo "lgportfolio-health-watchdog: report-only — no auto-deploy (fix manually; humans promote via merge to main + CI Coolify deploy)"
  exit 0
}

http_code() {
  curl -sS --max-time "$HEALTH_TIMEOUT" -o /dev/null -w '%{http_code}' \
    -H "User-Agent: ${USER_AGENT}" \
    "$1" 2>/dev/null || echo 000
}

# Liveness — same path Coolify/Docker HEALTHCHECK uses
live_code="$(http_code "${SITE_URL}/api/health/live")"
if [ "$live_code" != "200" ]; then
  fail "GET /api/health/live returned HTTP ${live_code} (expected 200)"
fi

live_json="$(curl -fsS --max-time "$HEALTH_TIMEOUT" \
  -H "User-Agent: ${USER_AGENT}" \
  "${SITE_URL}/api/health/live" 2>/dev/null || echo '{}')"
live_status="$(printf '%s' "$live_json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")"
if [ "$live_status" != "ok" ]; then
  fail "/api/health/live status=${live_status:-unknown} (expected ok)"
fi

# Homepage
home_code="$(http_code "${SITE_URL}/")"
if [ "$home_code" != "200" ]; then
  fail "GET / returned HTTP ${home_code} (expected 200)"
fi

# Shallow app health — no Inferencia probe (see /api/health route)
health_json="$(curl -fsS --max-time "$HEALTH_TIMEOUT" \
  -H "User-Agent: ${USER_AGENT}" \
  -H "X-Hermes-Watchdog: 1" \
  "${SITE_URL}/api/health?shallow=1" 2>/dev/null || fail "GET /api/health?shallow=1 failed")"

health_status="$(printf '%s' "$health_json" | python3 -c "import json,sys; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo unknown)"
if [ "$health_status" != "healthy" ] && [ "$health_status" != "degraded" ]; then
  fail "/api/health status=${health_status} (expected healthy or degraded)"
fi

exit 0
