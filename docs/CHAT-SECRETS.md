# Chat secrets (Firebase + admin)

Secrets are created in project **lgportfolio** and IAM is set so `portfolio-sa` can read them.

## 1. Add Firebase service account JSON

From a **file** (recommended; keep it out of shell history):

```bash
gcloud secrets versions add firebase-service-account \
  --data-file=path/to/your-firebase-service-account.json \
  --project=lgportfolio
```

Or from stdin (paste the JSON, then Ctrl+D):

```bash
gcloud secrets versions add firebase-service-account --data-file=- --project=lgportfolio
```

## 2. Add admin secret (for /admin/conversations)

```bash
echo -n 'your-chosen-admin-password' | gcloud secrets versions add admin-secret --data-file=- --project=lgportfolio
```

## 3. Deploy

After both secrets have at least one version, the next push to `main` (or Cloud Build deploy) will inject them into Cloud Run via `cloudbuild.yaml`.

## Optional: use the script

Put your Firebase JSON at `.secret/firebase-service-account.json`, set `ADMIN_SECRET`, then:

```bash
export PROJECT_ID=lgportfolio
export ADMIN_SECRET=your-admin-password
./scripts/create-chat-secrets.sh
```

This (re)runs IAM binding and adds versions from the file/env.
