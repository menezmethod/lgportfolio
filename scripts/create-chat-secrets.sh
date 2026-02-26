#!/usr/bin/env bash
# Create GCP Secret Manager secrets for chat (Firebase + admin) and grant Cloud Run access.
# Usage:
#   export PROJECT_ID=lgportfolio-a1410   # or your GCP project
#   # Put Firebase service account JSON in .secret/firebase-service-account.json
#   export ADMIN_SECRET=your-admin-password   # optional, for /admin/conversations
#   ./scripts/create-chat-secrets.sh

set -e
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Set PROJECT_ID or run: gcloud config set project YOUR_PROJECT"
  exit 1
fi
echo "Using project: $PROJECT_ID"

# Create secrets if they don't exist
for name in firebase-service-account admin-secret; do
  if ! gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    gcloud secrets create "$name" --replication-policy="automatic" --project="$PROJECT_ID"
    echo "Created secret: $name"
  else
    echo "Secret already exists: $name"
  fi
done

# Add version for Firebase from file
FIREBASE_FILE="${1:-.secret/firebase-service-account.json}"
if [[ -f "$FIREBASE_FILE" ]]; then
  gcloud secrets versions add firebase-service-account --data-file="$FIREBASE_FILE" --project="$PROJECT_ID"
  echo "Added version to firebase-service-account from $FIREBASE_FILE"
else
  echo "To add your Firebase JSON run:"
  echo "  gcloud secrets versions add firebase-service-account --data-file=YOUR_JSON_FILE --project=$PROJECT_ID"
fi

# Add version for admin secret from env or file
ADMIN_FILE=".secret/admin-secret.txt"
if [[ -n "$ADMIN_SECRET" ]]; then
  echo -n "$ADMIN_SECRET" | gcloud secrets versions add admin-secret --data-file=- --project="$PROJECT_ID"
  echo "Added version to admin-secret from ADMIN_SECRET"
elif [[ -f "$ADMIN_FILE" ]]; then
  gcloud secrets versions add admin-secret --data-file="$ADMIN_FILE" --project="$PROJECT_ID"
  echo "Added version to admin-secret from $ADMIN_FILE"
else
  echo "To add admin secret run:"
  echo "  echo -n 'your-secret' | gcloud secrets versions add admin-secret --data-file=- --project=$PROJECT_ID"
fi

# Grant Cloud Run service account access to both secrets
SA_EMAIL="portfolio-sa@${PROJECT_ID}.iam.gserviceaccount.com"
for name in firebase-service-account admin-secret; do
  gcloud secrets add-iam-policy-binding "$name" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
  echo "Granted ${SA_EMAIL} access to $name"
done
echo "Done. Update Cloud Run to use secrets: add to --set-secrets:"
echo "  FIREBASE_SERVICE_ACCOUNT_JSON=firebase-service-account:latest,ADMIN_SECRET=admin-secret:latest"
