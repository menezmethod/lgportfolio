#!/usr/bin/env bash
#
# Budget kill switch: stop request-driven spend by scaling Cloud Run to zero.
# Run this when you hit your budget (e.g. $10) to disable the bleeding.
#
# Usage: ./scripts/disable-project-spend.sh [PROJECT_ID] [REGION]
# Defaults: PROJECT_ID=lgportfolio, REGION=us-east1

set -euo pipefail

PROJECT_ID="${1:-lgportfolio}"
REGION="${2:-us-east1}"
SERVICE_NAME="lgportfolio"

echo "Budget kill switch: scaling Cloud Run to zero (no more request-driven cost)."
echo "  Project: $PROJECT_ID  Region: $REGION  Service: $SERVICE_NAME"
echo ""

gcloud run services update "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --max-instances=0

echo ""
echo "Done. Cloud Run will not serve traffic (max-instances=0)."
echo "To restore later: re-run Terraform or: gcloud run services update $SERVICE_NAME --region=$REGION --max-instances=1"
echo ""
echo "To stop ALL billing (nuclear): unlink the project from the billing account in Console:"
echo "  https://console.cloud.google.com/billing"
