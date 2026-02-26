#!/usr/bin/env bash
# Check Google-managed SSL cert status for gimenez.dev. Run from repo root.
# Cert must be ACTIVE before https://gimenez.dev works.

set -euo pipefail

echo "=== SSL certificate status ==="
gcloud compute ssl-certificates describe portfolio-ssl-cert --global \
  --format="table(managed.status,managed.domainStatus)"

echo ""
echo "When status is ACTIVE, visit: https://gimenez.dev"
