#!/usr/bin/env bash
# Deploy lgportfolio to Coolify homelab (Pi 5 @ 192.168.0.207).
# Builds on the host (aarch64), joins the coolify network, wires Traefik + Prometheus.
set -euo pipefail

HOST="${DEPLOY_HOST:-pico-infra}"
REMOTE_DIR="${DEPLOY_DIR:-/home/menez/apps/lgportfolio}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Syncing repo to ${HOST}:${REMOTE_DIR}"
ssh "$HOST" "mkdir -p ${REMOTE_DIR}"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env.local \
  --exclude .env.coolify \
  "$REPO_ROOT/" "${HOST}:${REMOTE_DIR}/"

echo "==> Ensuring .env.coolify exists on host"
ssh "$HOST" "test -f ${REMOTE_DIR}/.env.coolify" || {
  echo "ERROR: ${REMOTE_DIR}/.env.coolify missing on ${HOST}."
  echo "Copy .env.coolify.example → .env.coolify and fill secrets, then re-run."
  exit 1
}

echo "==> Updating Cloudflare tunnel ingress for gimenez.dev"
ssh "$HOST" "python3 - <<'PY'
from pathlib import Path
p = Path('/data/cloudflared/config.yml')
text = p.read_text()
block = '''  - hostname: gimenez.dev
    service: http://lgportfolio:3000
    originRequest:
      noTLSVerify: true
  - hostname: www.gimenez.dev
    service: http://lgportfolio:3000
    originRequest:
      noTLSVerify: true
'''
if 'hostname: gimenez.dev' not in text:
    text = text.replace('  - hostname: prometheus.menezmethod.com', block + '  - hostname: prometheus.menezmethod.com')
    p.write_text(text)
    print('cloudflared config updated')
else:
    print('cloudflared ingress already set')
PY
docker restart cloudflared-tunnel 2>/dev/null || true"

echo "==> Installing Traefik route for gimenez.dev"
ssh "$HOST" "sudo tee /data/coolify/proxy/dynamic/gimenez.yaml" <<'EOF'
# gimenez.dev — portfolio (lgportfolio container on coolify network)
http:
  routers:
    gimenez-http:
      entryPoints:
        - http
      service: lgportfolio
      rule: "Host(`gimenez.dev`) || Host(`www.gimenez.dev`)"
      middlewares:
        - redirect-to-https
    gimenez-https:
      entryPoints:
        - https
      service: lgportfolio
      rule: "Host(`gimenez.dev`) || Host(`www.gimenez.dev`)"
      tls:
        certResolver: letsencrypt
  services:
    lgportfolio:
      loadBalancer:
        servers:
          - url: "http://lgportfolio:3000"
EOF

echo "==> Updating Prometheus scrape (internal network target)"
ssh "$HOST" "ADMIN=\$(grep '^ADMIN_SECRET=' ${REMOTE_DIR}/.env.coolify | cut -d= -f2-); \
  sudo sed -i '/job_name: \"gimenez\"/,/^  - job_name:/{
    s|scheme: https|scheme: http|
    s|targets: \\[\"gimenez.dev\"\\]|targets: [\"lgportfolio:3000\"]|
  }' /home/menez/docker/prometheus/prometheus.yml 2>/dev/null || true"

# Patch prometheus gimenez job via python for reliability
ssh "$HOST" "python3 - <<'PY'
from pathlib import Path
import re
p = Path('/home/menez/docker/prometheus/prometheus.yml')
if not p.exists():
    raise SystemExit('prometheus.yml not found')
text = p.read_text()
admin = Path('${REMOTE_DIR}/.env.coolify').read_text().split('ADMIN_SECRET=',1)[-1].split()[0].strip('\"')
block = '''  - job_name: \"gimenez\"
    scheme: http
    http_headers:
      X-Admin-Secret:
        secrets:
          - \"''' + admin + '''\"
    metrics_path: /api/metrics
    scrape_interval: 15s
    static_configs:
      - targets: [\"lgportfolio:3000\"]
'''
text = re.sub(r'  - job_name: \"gimenez\".*?(?=\n  - job_name:|\Z)', block, text, count=1, flags=re.S)
p.write_text(text)
print('prometheus.yml updated')
PY
docker restart prometheus-prometheus-1 && sleep 3 && docker network connect coolify prometheus-prometheus-1 2>/dev/null || true"

echo "==> Connecting Prometheus to coolify network (idempotent)"
ssh "$HOST" "docker network connect coolify prometheus-prometheus-1 2>/dev/null || true"

echo "==> Building and starting lgportfolio"
ssh "$HOST" "cd ${REMOTE_DIR} && docker compose -f docker-compose.coolify.yml up -d --build"

echo "==> Waiting for health"
for i in $(seq 1 30); do
  if ssh "$HOST" "curl -sf http://127.0.0.1:3000/api/health 2>/dev/null || docker exec lgportfolio wget -qO- http://127.0.0.1:3000/api/health 2>/dev/null"; then
    echo "Healthy."
    break
  fi
  sleep 5
  if [ "$i" -eq 30 ]; then
    echo "WARN: health check timed out — check: ssh ${HOST} docker logs lgportfolio"
  fi
done

echo "==> Verifying chat chain (auth + model)"
ssh "$HOST" "chmod +x ${REMOTE_DIR}/scripts/verify-coolify-chat.sh && ENV_FILE=${REMOTE_DIR}/.env.coolify ${REMOTE_DIR}/scripts/verify-coolify-chat.sh" || {
  echo "WARN: verify-coolify-chat failed — fix INFERENCIA_API_KEY in .env.coolify (must match inferencia API_KEYS)"
}

echo ""
echo "Deploy complete. DNS step (Namecheap):"
echo "  A  @   → 47.203.87.233  (home public IP — traefik issues Let's Encrypt cert)"
echo "  A  www → 47.203.87.233"
echo "Remove Vercel records (76.76.21.21 / cname.vercel-dns.com)."
echo ""
echo "Verify: curl -s https://gimenez.dev/api/health"
