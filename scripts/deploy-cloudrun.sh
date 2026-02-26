#!/usr/bin/env bash
#
# Deploy portfolio to Cloud Run (lgportfolio). Run from repo root.
# Prereqs: Docker running (OrbStack), Terraform installed (brew install terraform).
# APIs and Artifact Registry repo are already set up.

set -euo pipefail

PROJECT_ID=lgportfolio
REGION=us-east1

echo "=== Build & push image ==="
docker build -t us-east1-docker.pkg.dev/${PROJECT_ID}/portfolio/app:latest .
docker push us-east1-docker.pkg.dev/${PROJECT_ID}/portfolio/app:latest

echo ""
echo "=== Terraform apply ==="
cd "$(dirname "$0")/../terraform"
terraform init -input=false
terraform plan -input=false -out=tfplan
terraform apply -input=false tfplan

echo ""
echo "=== Next: DNS ==="
echo "Get LB IP and point gimenez.dev to it:"
terraform output load_balancer_ip
