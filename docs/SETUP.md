# Setup Instructions for Luis

## Prerequisites

- Node.js 20+
- npm or yarn
- Google Cloud Platform account
- GCP Cloud SQL (optional, for RAG — Terraform can create it)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio
npm install
```

### 2. Configure Environment Variables

Copy the example env file and add your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Required: Get from https://aistudio.google.com/apikey
GOOGLE_API_KEY=your-gemini-api-key-here

# Optional: For RAG vector search (Cloud SQL + pgvector; on GCP Terraform sets these)
# Locally: run Cloud SQL Proxy, then set RAG_DB_HOST=127.0.0.1 and DB credentials
# RAG_DB_NAME=rag
# RAG_DB_USER=ragapp
# RAG_DB_PASSWORD=...
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm run start
```

---

## RAG with Cloud SQL (Optional)

For the AI chat to use vector search instead of static file-based context:

1. In Terraform, set `enable_rag_cloud_sql = true` (default) in `terraform.tfvars`. Run `terraform apply` to create the Cloud SQL instance (PostgreSQL + pgvector), database `rag`, and user. Credentials are stored in Secret Manager and wired to Cloud Run.
2. Apply the schema once (e.g. via Cloud SQL Proxy locally): `psql "host=127.0.0.1 dbname=rag user=ragapp" -f scripts/init-rag-db.sql`
3. Seed the knowledge base and embeddings: `GOOGLE_API_KEY=... npx tsx scripts/seed-rag-db.ts` (use same DB credentials; with proxy, set `RAG_DB_HOST=127.0.0.1` in `.env.local`).
4. After seeding, create the IVFFlat index for faster search: `CREATE INDEX knowledge_chunks_embedding_idx ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`

On Cloud Run, env vars are set by Terraform. For local dev, run [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy) and set `RAG_DB_HOST=127.0.0.1`, `RAG_DB_NAME`, `RAG_DB_USER`, `RAG_DB_PASSWORD` in `.env.local`.

---

## GCP Deployment (Optional)

### Option 1: GitHub Actions (Recommended)

1. Create a GCP project
2. Enable APIs:
   - Cloud Run
   - Artifact Registry
   - Cloud Build
   - Secret Manager

3. Create a Service Account with roles:
   - Cloud Run Admin
   - Artifact Registry Writer
   - Secret Manager Secret Accessor

4. Add these secrets to GitHub:
   - `GCP_PROJECT_ID`
   - `WIF_PROVIDER` (Workload Identity Provider)
   - `WIF_SA` (Service Account email)
   - `REGION` (e.g., us-central1)
   - `GEMINI_API_KEY`

5. Push to main → deployment happens automatically

### Option 2: Manual Terraform

```bash
cd terraform
terraform init
terraform plan -var="project_id=your-project"
terraform apply -var="project_id=your-project"
```

---

## Common Issues

### "Rate limited" message
- This is expected! The chat uses Gemini's free tier (10 RPM, 1000 RPD)
- Rate limiting protects against abuse
- Use the cached responses or contact Luis directly

### Build fails
- Ensure Node.js 20+ is installed
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Chat doesn't respond
- Check that `GOOGLE_API_KEY` is set in `.env.local`
- Verify the key has Gemini API access at https://aistudio.google.com

---

## Cost Estimate

| Service | Cost |
|---------|------|
| Cloud Run | $0-5/mo |
| Cloud SQL (RAG) | ~\$7–10/mo db-f1-micro, or 30-day free trial |
| Gemini API | $0-3/mo (free tier) |
| **Total** | **$1-11/mo** |

---

## Need Help?

Email: luisgimenezdev@gmail.com
GitHub: https://github.com/menezmethod/lgportfolio
