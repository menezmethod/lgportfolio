# Deploy on Coolify (primary — gimenez.dev)

Production hosting for **gimenez.dev** runs on the homelab Pi 5 (`192.168.0.207`) under **Coolify**, on the same Docker network as **Inferencia** (`inferencia:8080`) and **Prometheus** (`prometheus-prometheus-1:9090`). No Vercel serverless limits; metrics and LLM calls stay on the LAN.

**Coolify UI:** [https://cp.menezmethod.com](https://cp.menezmethod.com)

## Architecture

```
Internet → Cloudflare DNS (gimenez.dev zone)
        → Cloudflare Tunnel (coolify-tunnel on Pi)
        → lgportfolio:3000 (Next.js standalone)
        ↔ inferencia:8080 (chat, same Docker network)
        ↔ prometheus-prometheus-1:9090 (War Room aggregates)
```

Traefik on the Pi (`coolify-proxy`) is also configured for direct access; production traffic uses the **tunnel** so you do not need port forwarding.

## One-time setup

### 1. DNS (Cloudflare — gimenez.dev zone)

Nameservers should be Cloudflare (`henrik.ns.cloudflare.com`, `jule.ns.cloudflare.com`). In **Cloudflare → gimenez.dev → DNS**:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| **CNAME** | `@` | `19bf9243-3d61-4db1-bd9a-60665e2b675d.cfargotunnel.com` | Proxied |
| **CNAME** | `www` | `19bf9243-3d61-4db1-bd9a-60665e2b675d.cfargotunnel.com` | Proxied |

**Delete** any A/CNAME records still pointing at Vercel (`76.76.21.21`, `cname.vercel-dns.com`).

Tunnel ingress for `gimenez.dev` is in `/data/cloudflared/config.yml` on the Pi (routes to `http://lgportfolio:3000`). Redeploy with `./scripts/deploy-coolify.sh` to refresh it.

### 2. Secrets on the Pi

```bash
ssh pico-infra
mkdir -p /home/menez/apps/lgportfolio
cd /home/menez/apps/lgportfolio
# copy .env.coolify.example → .env.coolify and fill ADMIN_SECRET, INFERENCIA_API_KEY, etc.
```

Use the same `INFERENCIA_API_KEY` as the inferencia container (`docker exec inferencia env | grep API_KEYS`).

### 3. Deploy from your Mac

```bash
chmod +x scripts/deploy-coolify.sh
./scripts/deploy-coolify.sh
```

This syncs the repo, installs the Traefik route (`/data/coolify/proxy/dynamic/gimenez.yaml`), updates the Prometheus scrape target to `lgportfolio:3000`, builds the image on the Pi (aarch64), and starts the container.

## Coolify UI + GitHub auto-deploy (recommended)

1. **cp.menezmethod.com** → **+** new project **`gimenez.dev`** → **+ Add Resource** → **Application**
2. **GitHub App:** `coolify-menez` → repo `menezmethod/lgportfolio`, branch `main`
3. **Build pack:** Dockerfile · **Port:** `3000`
4. **Domains:** `gimenez.dev`, `www.gimenez.dev`
5. **Environment variables** (same as `.env.coolify.example`); set `COOLIFY=1`
6. **Disable** Coolify “deploy on every commit” — GitHub Actions deploys after CI passes (see below)
7. Stop the manual container if still running: `docker compose -f docker-compose.coolify.yml down` on the Pi
8. Update **cloudflared** ingress to point at the Coolify-managed container name (or route via Traefik labels Coolify adds)

### GitHub Actions deploy (after CI)

On merge to `main`, `.github/workflows/ci.yml` runs lint → build → unit tests → Cypress, then calls the Coolify API to deploy the exact commit that passed CI.

Add repo secrets (**Settings → Secrets → Actions**):

| Secret | Value |
|--------|--------|
| `COOLIFY_URL` | `https://cp.menezmethod.com` |
| `COOLIFY_API_TOKEN` | From Coolify **Keys & Tokens** |
| `COOLIFY_APP_UUID` | Application UUID from Coolify app settings |

Enable **API** in Coolify if disabled: **Settings** → enable API access for tokens.

## Environment variables

| Variable | Coolify value |
|----------|----------------|
| `INFERENCIA_BASE_URL` | `http://inferencia:8080/v1` |
| `PROMETHEUS_URL` | `http://prometheus-prometheus-1:9090` |
| `INFERENCIA_API_KEY` | Same key as inferencia service |
| `INFERENCIA_CHAT_MODEL` | `gemma4:e4b` |
| `ADMIN_SECRET` | Your admin secret |
| `NEXT_PUBLIC_SITE_URL` | `https://gimenez.dev` |
| `COOLIFY` | `1` |

## Verify

```bash
curl -s https://gimenez.dev/api/health | python3 -m json.tool
curl -s https://gimenez.dev/api/war-room/data | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['metrics_source'], d.get('service_status',{}).get('checks',{}).get('prometheus'))"
```

War Room should show `metrics_source: prometheus` and Prometheus **UP**.

## Rollback to Vercel

Point Namecheap `@` / `www` back to Vercel (`76.76.21.21` / `cname.vercel-dns.com`). See [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md).
