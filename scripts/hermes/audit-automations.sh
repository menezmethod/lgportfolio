#!/usr/bin/env bash
# Audit Hermes + local crons for patterns that break Inferencia / chat.
# Run on Pi after install or when debugging: ./scripts/hermes/audit-automations.sh
#
# Exit 0 = clean | Exit 1 = dangerous patterns found (prints report)

set -euo pipefail

HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
ISSUES=0

warn() {
  echo "UNSAFE: $*"
  ISSUES=$((ISSUES + 1))
}

ok() {
  echo "OK: $*"
}

scan_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  local rel="${f#$HERMES_HOME/}"

  if rg -qi 'POST.*(/api/chat|chat/completions)' "$f" 2>/dev/null; then
    warn "$rel — POST /api/chat (loads Ollama, rate limits)"
  fi
  if rg -qi 'docker\s+(restart|rm|stop|kill).*(inferencia|ollama)' "$f" 2>/dev/null; then
    warn "$rel — docker restart/stop inferencia or ollama (502 storms)"
  fi
  if rg -qi 'coolify.*(restart|redeploy|deploy).*inferencia' "$f" 2>/dev/null; then
    warn "$rel — Coolify redeploy inferencia"
  fi
  if rg -qi 'WATCHDOG_ENABLE_RECOVERY\s*=\s*(1|true|yes)' "$f" 2>/dev/null; then
    warn "$rel — auto-recovery enabled"
  fi
  if rg -qi 'vercel\s+(--prod|rollback)' "$f" 2>/dev/null; then
    warn "$rel — Vercel prod deploy/rollback from cron"
  fi
}

echo "=== Hermes / automation safety audit ==="
echo "HERMES_HOME=$HERMES_HOME"
echo

if [ ! -d "$HERMES_HOME" ]; then
  echo "WARN: $HERMES_HOME not found — nothing to audit"
  exit 0
fi

# Required safe scripts (from install-watchdogs.sh)
for required in scripts/inferencia-watchdog.py scripts/portfolio-chat-watchdog.sh; do
  if [ -f "$HERMES_HOME/$required" ]; then
    ok "installed $required"
  else
    warn "missing $required — run ./scripts/hermes/install-watchdogs.sh"
  fi
done

# Scan all Hermes scripts and cron definitions
while IFS= read -r -d '' f; do
  scan_file "$f"
done < <(find "$HERMES_HOME" -type f \( -name '*.sh' -o -name '*.py' -o -name '*.json' -o -name '*.yaml' -o -name '*.yml' \) -print0 2>/dev/null)

# Crontab entries referencing hermes (user crontab only)
if crontab -l 2>/dev/null | rg -i 'hermes|inferencia-watchdog|portfolio-chat' >/tmp/hermes-cron.txt 2>/dev/null; then
  echo "--- crontab (hermes-related) ---"
  cat /tmp/hermes-cron.txt
  while IFS= read -r line; do
    case "$line" in \#*|"") continue ;; esac
    if echo "$line" | rg -qi 'api/chat|docker restart|enable_recovery'; then
      warn "crontab: $line"
    else
      ok "crontab: $line"
    fi
  done < /tmp/hermes-cron.txt
fi

echo
if [ "$ISSUES" -gt 0 ]; then
  echo "FAILED: $ISSUES unsafe pattern(s). Fix or remove before enabling crons."
  echo "Safe watchdogs: GET /health only, shallow /api/health, interval >= 10 min, no_agent: true"
  exit 1
fi

echo "PASSED: no unsafe automation patterns detected."
exit 0
