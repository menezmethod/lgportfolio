#!/usr/bin/env bash
# Back-compat wrapper — canonical script lives in scripts/hermes/.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$REPO_ROOT/scripts/hermes/portfolio-chat-watchdog.sh" "$@"
