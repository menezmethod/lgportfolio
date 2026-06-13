#!/usr/bin/env bash
# Remove legacy Hermes scripts that override Coolify/Inferencia env or restart containers.
#
# Default: dry-run (prints what would change).
# Apply:   ./scripts/hermes/cleanup-hermes.sh --apply
#
# Run on Pi after git pull, before install-watchdogs.sh.

set -euo pipefail

HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
SCRIPTS_DIR="${HERMES_HOME}/scripts"
ARCHIVE_DIR="${HERMES_HOME}/archive/$(date +%Y%m%d-%H%M%S)"
APPLY=false
MOVED=0
DISABLED_CRONS=0

for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=true ;;
    -h|--help)
      echo "Usage: $0 [--apply]"
      echo "  Archives unsafe ~/.hermes scripts and disables matching crontab lines."
      exit 0
      ;;
  esac
done

# Only these filenames may stay in ~/.hermes/scripts (report-only watchdogs).
ALLOWLIST=(
  inferencia-watchdog.py
  portfolio-chat-watchdog.sh
  audit-automations.sh
  cleanup-hermes.sh
  policy.json
  vercel-governor.py
)

is_allowlisted() {
  local base="$1"
  local f
  for f in "${ALLOWLIST[@]}"; do
    if [ "$base" = "$f" ]; then
      return 0
    fi
  done
  return 1
}

file_is_unsafe() {
  local f="$1"
  [ -f "$f" ] || return 1
  if rg -qi 'POST.*(/api/chat|chat/completions)' "$f" 2>/dev/null; then return 0; fi
  if rg -qi 'docker\s+(restart|rm|stop|kill).*(inferencia|ollama)' "$f" 2>/dev/null; then return 0; fi
  if rg -qi 'coolify.*(restart|redeploy|deploy)' "$f" 2>/dev/null; then return 0; fi
  if rg -qi '(sed|echo|printf).*(INFERENCIA_|\.env\.coolify)' "$f" 2>/dev/null; then return 0; fi
  if rg -qi 'WATCHDOG_ENABLE_RECOVERY\s*=\s*(1|true|yes)' "$f" 2>/dev/null; then return 0; fi
  if rg -qi 'vercel\s+(--prod|rollback)' "$f" 2>/dev/null; then return 0; fi
  return 1
}

legacy_name() {
  local base="$1"
  case "$base" in
    *recovery*|*heal*|*fix-env*|*fix_env*|*chat-health*|*inferencia-monitor*)
      return 0
      ;;
  esac
  return 1
}

cron_is_unsafe() {
  echo "$1" | rg -qi 'api/chat|docker restart|enable_recovery|INFERENCIA_|\.env\.coolify|coolify.*deploy'
}

archive_file() {
  local f="$1"
  local reason="$2"
  local rel="${f#$HERMES_HOME/}"
  if [ "$APPLY" = true ]; then
    mkdir -p "$ARCHIVE_DIR"
    mkdir -p "$(dirname "${ARCHIVE_DIR}/${rel}")"
    mv "$f" "${ARCHIVE_DIR}/${rel}"
    echo "ARCHIVED: $rel ($reason) → ${ARCHIVE_DIR}/${rel}"
  else
    echo "WOULD ARCHIVE: $rel ($reason)"
  fi
  MOVED=$((MOVED + 1))
}

echo "=== Hermes cleanup (override + legacy script removal) ==="
echo "HERMES_HOME=$HERMES_HOME"
echo "mode=$([ "$APPLY" = true ] && echo apply || echo dry-run)"
echo

if [ ! -d "$HERMES_HOME" ]; then
  echo "Nothing to clean — $HERMES_HOME does not exist."
  exit 0
fi

if [ -d "$SCRIPTS_DIR" ]; then
  while IFS= read -r -d '' f; do
    base="$(basename "$f")"
    if is_allowlisted "$base"; then
      if file_is_unsafe "$f"; then
        archive_file "$f" "allowlisted name but unsafe content — replaced on next install"
      else
        echo "KEEP: scripts/$base"
      fi
      continue
    fi
    if legacy_name "$base" || file_is_unsafe "$f"; then
      archive_file "$f" "legacy or unsafe automation"
    else
      echo "REVIEW: scripts/$base (not on allowlist — not auto-removed)"
    fi
  done < <(find "$SCRIPTS_DIR" -type f \( -name '*.sh' -o -name '*.py' \) -print0 2>/dev/null)
fi

if crontab -l 2>/dev/null >/tmp/hermes-cron-full.txt; then
  while IFS= read -r line; do
    case "$line" in
      \#*|"") continue ;;
    esac
    if cron_is_unsafe "$line"; then
      if [ "$APPLY" = true ]; then
        echo "DISABLED CRON: $line"
      else
        echo "WOULD DISABLE CRON: $line"
      fi
      DISABLED_CRONS=$((DISABLED_CRONS + 1))
    fi
  done < /tmp/hermes-cron-full.txt

  if [ "$APPLY" = true ] && [ "$DISABLED_CRONS" -gt 0 ]; then
    crontab -l 2>/dev/null | while IFS= read -r line; do
      case "$line" in
        \#HERMES-DISABLED*)
          echo "$line"
          ;;
        *)
          if cron_is_unsafe "$line"; then
            echo "# HERMES-DISABLED $(date -Iseconds) — $line"
          else
            echo "$line"
          fi
          ;;
      esac
    done | crontab -
  fi
fi

echo
echo "Summary: archived/moved=$MOVED disabled_crons=$DISABLED_CRONS"
if [ "$APPLY" = false ] && { [ "$MOVED" -gt 0 ] || [ "$DISABLED_CRONS" -gt 0 ]; }; then
  echo "Re-run with --apply to apply changes, then: ./scripts/hermes/install-watchdogs.sh"
fi

if [ "$MOVED" -gt 0 ] || [ "$DISABLED_CRONS" -gt 0 ]; then
  exit 1
fi

echo "CLEAN: no legacy override scripts or crons found."
exit 0
