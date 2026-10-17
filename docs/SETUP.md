# Local development setup

## Prerequisites

- Node.js 20.9+
- npm
- GCP account (for production deployment)

## Quick start

```bash
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Edit `.env.local` with your values. See `.env.example` for all available variables.

**Required for chat:**

```env
INFERENCIA_API_KEY=your-inferencia-api-key
INFERENCIA_BASE_URL=http://localhost:8080/v1
INFERENCIA_CHAT_MODEL=your-model-name
```

**Optional:**

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}   # Chat session analytics
ADMIN_SECRET=your-admin-secret                                  # /admin access
```

RAG defaults to file-based knowledge (`src/lib/knowledge.ts`). For vector search via Cloud SQL (pgvector), set `enable_rag_cloud_sql = true` in Terraform and configure DB credentials — see [DEPLOY-CLOUDRUN.md](./DEPLOY-CLOUDRUN.md).

## Build and test

```bash
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests (162 tests)
npm run test:e2e     # Cypress (requires app running: npm run build && npm run start)
```

## Production deployment

See [DEPLOY-CLOUDRUN.md](./DEPLOY-CLOUDRUN.md) for the full Cloud Run deployment checklist. Push to `main` triggers Cloud Build auto-deploy.

## Cost

| Service | Monthly |
|---------|---------|
| Cloud Run + ALB | ~$18 (ALB fixed; Run scales to zero) |
| Cloud SQL (optional) | ~$7–10 (db-f1-micro) |
| LLM inference | Varies by provider |
| **Without Cloud SQL** | **~$18–20** |

Budget kill switch at $20 — see [TRAFFIC-AND-COST.md](./TRAFFIC-AND-COST.md).
