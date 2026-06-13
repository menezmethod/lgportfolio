#!/usr/bin/env bash
# Run on Pi (or: ssh pico-infra 'bash -s' < scripts/verify-coolify-chat.sh)
# Diagnoses "Server temporarily unavailable" — auth, model, and network.
set -euo pipefail

ENV_FILE="${ENV_FILE:-/home/menez/apps/lgportfolio/.env.coolify}"
CONTAINER="${CONTAINER:-lgportfolio}"

fail() { echo "FAIL: $*"; exit 1; }
ok() { echo "OK: $*"; }

echo "=== Coolify chat RCA ==="

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
  ok "loaded $ENV_FILE"
else
  echo "WARN: $ENV_FILE not found — using container env"
fi

BASE="${INFERENCIA_BASE_URL:-http://inferencia:8080/v1}"
ORIGIN="${BASE%/v1}"
ORIGIN="${ORIGIN%/}"
MODEL="${INFERENCIA_CHAT_MODEL:-gemma4:12b}"
KEY="${INFERENCIA_API_KEY:-}"

echo "INFERENCIA_BASE_URL=$BASE"
echo "INFERENCIA_CHAT_MODEL=$MODEL"
echo "INFERENCIA_API_KEY set: $([ -n "$KEY" ] && echo yes || echo NO)"

# 1. Inferencia /health (no auth)
code=$(curl -sS -o /tmp/inf-health.json -w '%{http_code}' --max-time 8 "${ORIGIN}/health" || echo 000)
[ "$code" = "200" ] || fail "Inferencia /health HTTP $code"
python3 -c "
import json,sys
d=json.load(open('/tmp/inf-health.json'))
models=[m['id'] for m in d.get('services',{}).get('ollama',{}).get('models',[])]
print('ollama models:', ', '.join(models[:8]), '...' if len(models)>8 else '')
model='$MODEL'
if model not in models:
    print(f'WARN: configured model {model!r} not in Ollama list')
else:
    print(f'model {model!r} present')
"

# 2. Auth — /v1/models requires Bearer key
if [ -z "$KEY" ]; then
  fail "INFERENCIA_API_KEY empty in $ENV_FILE"
fi
code=$(curl -sS -o /tmp/inf-models.json -w '%{http_code}' --max-time 8 \
  -H "Authorization: Bearer ${KEY}" \
  "${ORIGIN}/v1/models" || echo 000)
[ "$code" = "200" ] || fail "/v1/models auth HTTP $code (key mismatch with inferencia API_KEYS?)"

# 3. lgportfolio container env (Coolify may override .env.coolify)
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "--- container env (lgportfolio) ---"
  docker exec "$CONTAINER" sh -c 'echo INFERENCIA_BASE_URL=$INFERENCIA_BASE_URL; echo INFERENCIA_CHAT_MODEL=$INFERENCIA_CHAT_MODEL; test -n "$INFERENCIA_API_KEY" && echo INFERENCIA_API_KEY=set || echo INFERENCIA_API_KEY=MISSING'
  docker exec "$CONTAINER" wget -qO- --timeout=8 http://inferencia:8080/health >/dev/null \
    && ok "lgportfolio → inferencia:8080 reachable" \
    || fail "lgportfolio cannot reach inferencia:8080 (coolify network?)"
else
  echo "WARN: container $CONTAINER not running"
fi

# 4. Site chat (from Pi)
code=$(curl -sS -o /tmp/chat.json -w '%{http_code}' --max-time 60 -X POST http://127.0.0.1:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"ping"}]}' 2>/dev/null || echo 000)
if [ "$code" = "200" ]; then
  ok "POST /api/chat HTTP 200"
else
  echo "FAIL: POST /api/chat HTTP $code"
  cat /tmp/chat.json 2>/dev/null || true
  exit 1
fi

ok "chat chain healthy"
