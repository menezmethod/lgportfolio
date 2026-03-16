#!/usr/bin/env bash
#
# Toggle the portfolio edge stack on or off through Terraform.
#   off = low-cost mode (Cloud Run public ingress, no ALB/CDN/Cloud Armor,
#         and the custom domain will stop serving unless another front door exists)
#   on  = edge mode (ALB/CDN/Cloud Armor in front of Cloud Run)
#
# Usage:
#   ./scripts/set-edge-mode.sh off
#   ./scripts/set-edge-mode.sh on

set -euo pipefail

MODE="${1:-}"

if [[ "$MODE" != "on" && "$MODE" != "off" ]]; then
  echo "Usage: $0 [on|off]"
  exit 1
fi

ENABLE_LB=false
if [[ "$MODE" == "on" ]]; then
  ENABLE_LB=true
fi

cd "$(dirname "$0")/../terraform"

terraform init -input=false
terraform apply -input=false -auto-approve -var="enable_load_balancer=${ENABLE_LB}"

echo ""
echo "Public URL:"
terraform output public_base_url

if [[ "$MODE" == "on" ]]; then
  echo ""
  echo "If this is a fresh edge enable, confirm DNS still points at:"
  terraform output load_balancer_ip
fi
