#!/usr/bin/env bash
# Install safe Hermes watchdogs to ~/.hermes/scripts on the Pi (or laptop).
#
# Usage (on Pi5 after git pull):
#   cd /path/to/lgportfolio
#   ./scripts/hermes/cleanup-hermes.sh --apply   # remove legacy override scripts first
#   ./scripts/hermes/install-watchdogs.sh
#
# Hermes must never mutate INFERENCIA_* or .env.coolify — Coolify is source of truth.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${HERMES_HOME:-$HOME/.hermes}/scripts"

echo "==> Cleaning legacy Hermes scripts (dry-run)..."
"$REPO_ROOT/scripts/hermes/cleanup-hermes.sh" || true
echo "    Run ./scripts/hermes/cleanup-hermes.sh --apply on Pi to archive unsafe scripts."

mkdir -p "$DEST"

install -m 755 "$REPO_ROOT/scripts/hermes/inferencia-watchdog.py" "$DEST/inferencia-watchdog.py"
install -m 755 "$REPO_ROOT/scripts/hermes/portfolio-chat-watchdog.sh" "$DEST/portfolio-chat-watchdog.sh"
install -m 755 "$REPO_ROOT/scripts/hermes/lgportfolio-health-watchdog.sh" "$DEST/lgportfolio-health-watchdog.sh"
install -m 644 "$REPO_ROOT/scripts/hermes/policy.json" "$DEST/policy.json"
install -m 755 "$REPO_ROOT/scripts/hermes/audit-automations.sh" "$DEST/audit-automations.sh"
install -m 755 "$REPO_ROOT/scripts/hermes/cleanup-hermes.sh" "$DEST/cleanup-hermes.sh"

echo "policy_version=3" > "${HERMES_HOME:-$HOME/.hermes}/.installed-version"

echo "Running safety audit..."
if "$DEST/audit-automations.sh"; then
  echo "Audit passed."
else
  echo "WARN: audit found unsafe patterns — run: $DEST/cleanup-hermes.sh --apply"
fi

cat <<EOF
Installed safe watchdogs to ${DEST}:
  - inferencia-watchdog.py         (GET /health only, no recovery)
  - portfolio-chat-watchdog.sh     (shallow /api/health, no POST /api/chat)
  - lgportfolio-health-watchdog.sh (liveness + homepage + shallow health)
  - cleanup-hermes.sh              (archive legacy override scripts)
  - policy.json                    (allowlist + do-not-override env vars)

Hermes cron (no_agent: true):
  inferencia:  */15  python3 ${DEST}/inferencia-watchdog.py
  portfolio:   */15  bash ${DEST}/portfolio-chat-watchdog.sh
  lgportfolio: */45  bash ${DEST}/lgportfolio-health-watchdog.sh

NEVER automate (overrides Coolify / caused outages):
  - POST https://gimenez.dev/api/chat
  - docker restart / coolify redeploy on inferencia or ollama
  - sed/echo to INFERENCIA_* or .env.coolify
EOF
