# Setup Instructions for Luis

## Prerequisites

- Node.js 20+
- npm or yarn
- Google Cloud Platform account
- Supabase account (optional, for RAG)

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

# Optional: For RAG vector search (get from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
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

## Supabase RAG Setup (Optional)

For the AI chat to use vector search instead of static context:

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor and run:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create match function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id BIGINT, content TEXT, metadata JSONB, similarity FLOAT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.content, d.metadata, 1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

3. Add your Supabase credentials to `.env.local`

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
| Supabase | $0 (free tier) |
| Gemini API | $0-3/mo (free tier) |
| **Total** | **$1-11/mo** |

---

## Need Help?

Email: luisgimenezdev@gmail.com
GitHub: https://github.com/menezmethod/lgportfolio
