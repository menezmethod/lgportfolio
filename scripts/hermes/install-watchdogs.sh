#!/usr/bin/env bash
# Install safe Hermes watchdogs to ~/.hermes/scripts on the Pi (or laptop).
#
# Usage (on Pi5 after git pull):
#   cd /path/to/lgportfolio
#   ./scripts/hermes/install-watchdogs.sh
#
# Then update Hermes cron entries to call:
#   python3 ~/.hermes/scripts/inferencia-watchdog.py
#   bash ~/.hermes/scripts/portfolio-chat-watchdog.sh
#
# REMOVE any cron that POSTs /api/chat or runs docker/coolify restart.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${HERMES_HOME:-$HOME/.hermes}/scripts"

mkdir -p "$DEST"

install -m 755 "$REPO_ROOT/scripts/hermes/inferencia-watchdog.py" "$DEST/inferencia-watchdog.py"
install -m 755 "$REPO_ROOT/scripts/hermes-chat-watchdog.sh" "$DEST/portfolio-chat-watchdog.sh"

cat <<EOF
Installed safe watchdogs to ${DEST}:
  - inferencia-watchdog.py   (GET /health only, no recovery)
  - portfolio-chat-watchdog.sh (shallow /api/health, no POST /api/chat)

Hermes cron (no_agent: true, every 10-15 min — not 5 min):
  inferencia: python3 ${DEST}/inferencia-watchdog.py
  portfolio:  bash ${DEST}/portfolio-chat-watchdog.sh

DISABLE in Hermes / crontab:
  - Any script that POSTs https://gimenez.dev/api/chat
  - Any script that docker restart / coolify redeploy on inferencia or ollama
EOF
