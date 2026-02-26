# Luis Gimenez Portfolio

A Next.js portfolio with an AI-powered chat. Built with Next.js 16, TypeScript, and Tailwind. The chat is backed by an OpenAI-compatible API (Inferencia) with a RAG-style knowledge base, and the site showcases cloud architecture and deployment (GCP, Terraform, Docker).

## Target roles

- **Senior**, **Staff**, and **Architect** (e.g. GCP Cloud Architect, AI/ML Architect, Cloud Solutions Architect)
- Accepting interviews; open to remote and select relocation markets.

## Features

- **Modern stack:** Next.js 16 App Router, TypeScript, Tailwind CSS
- **AI chat:** Interactive chat powered by the Inferencia API (OpenAI-compatible). Single provider, no client-side model config.
- **RAG-style context:** Local file-based knowledge base by default; optional Supabase pgvector for vector search (uses Gemini embeddings when configured).
- **Rate limiting:** Per-IP, session cap, and daily budget to protect free tiers.
- **Response caching:** Pre-seeded cache for common questions to reduce API usage.
- **Architecture showcase:** Dedicated architecture page.
- **Responsive design:** Mobile-first, dark theme.
- **Infrastructure:** Terraform for GCP Cloud Run, Docker, Cloud Build (auto-deploy on push to main).

## Live site

**URL:** https://gimenez.dev

## Tech stack

| Component      | Technology                          | Notes                                      |
|----------------|-------------------------------------|--------------------------------------------|
| Framework      | Next.js 16 (App Router)              | SSR/SSG, API routes, RSC                   |
| Language       | TypeScript                          | Type safety                                |
| Styling        | Tailwind CSS                        | Utility-first                              |
| AI chat        | Vercel AI SDK + Inferencia API      | OpenAI-compatible; single provider         |
| RAG / context  | Local knowledge + optional Supabase | File-based by default; pgvector optional  |
| Embeddings     | Gemini text-embedding-004           | Only when Supabase RAG is configured       |
| Hosting        | GCP Cloud Run                       | Scale-to-zero, Terraform                   |
| IaC            | Terraform                           | Cloud Run, secrets, etc.                   |
| CI/CD          | Cloud Build (auto-deploy)            | Push to `main` → build amd64 image, deploy with secrets |

## Prerequisites

- Node.js 20+
- **Chat:** Inferencia API key (contact admin or set up your own OpenAI-compatible endpoint). Required for `/api/chat`.
- **Optional:** Google Gemini API key for RAG embeddings when using Supabase. Get one at https://aistudio.google.com/apikey
- **Optional:** Supabase project for vector-backed RAG (otherwise the app uses the local knowledge file).

## Quick start

```bash
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio

npm install

# Chat requires Inferencia
cp .env.example .env.local
# Set INFERENCIA_BASE_URL and INFERENCIA_API_KEY in .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Chat is at [http://localhost:3000/chat](http://localhost:3000/chat).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `INFERENCIA_BASE_URL` | No (has default) | OpenAI-compatible API base URL (default: `https://llm.menezmethod.com/v1`) |
| `INFERENCIA_API_KEY` | **Yes for chat** | API key for Inferencia. Chat returns 503 if missing. |
| `INFERENCIA_CHAT_MODEL` | No | Chat model ID (default: `mlx-community/gpt-oss-20b-MXFP4-Q8`) |
| `GOOGLE_API_KEY` | Optional | For Gemini embeddings when Supabase RAG is used |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL for vector RAG |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Supabase service role key |
| `CHAT_MAX_RPM_PER_IP` | No | Per-IP rate limit (default: 3) |
| `CHAT_MAX_MESSAGES_PER_SESSION` | No | Session message cap (default: 20) |
| `CHAT_DAILY_BUDGET` | No | Daily request budget (default: 900) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 (no Vercel analytics) |

See `.env.example` for the full list. In production (Cloud Run), Inferencia keys come from GCP Secret Manager via the deploy step; see [AGENTS.md](./AGENTS.md) and [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md).

**Security:** Do not commit `.env.local` or any file containing API keys or secrets. They are gitignored; use your host’s secret manager or environment variables for production.

## Project structure

```
lgportfolio/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home (hero, roles, CTAs)
│   │   ├── about/page.tsx        # About + skills
│   │   ├── work/page.tsx         # Projects
│   │   ├── architecture/page.tsx # Architecture case study
│   │   ├── contact/page.tsx      # Contact + resume
│   │   ├── chat/page.tsx         # AI chat UI
│   │   └── api/
│   │       ├── chat/route.ts     # Chat API (Inferencia only)
│   │       └── rag/route.ts      # RAG/embeddings (optional)
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── knowledge.ts          # Local knowledge base (RAG source)
│   │   ├── rag.ts                # RAG retrieval (local or Supabase)
│   │   └── rate-limit.ts         # Rate limits + response cache
│   └── app/                      # Global layout, styles
├── terraform/                    # GCP Cloud Run IaC (LB, WAF, DNS)
├── cloudbuild.yaml              # Cloud Build: push to main → build & deploy (no GitHub Actions)
├── docs/                        # Additional documentation
├── Dockerfile
└── README.md
```

## AI chat behavior

- **Provider:** One backend only, Inferencia (OpenAI-compatible). No fallbacks or client-side model switching.
- **Rate limiting:** Per-IP token bucket, session message cap, and a daily budget. Cached responses for common questions don’t count against the budget.
- **Context:** System prompt includes RAG context from the local knowledge base (or Supabase when configured).
- **When limits are hit:** Cached answer if available, otherwise a clear message and contact info.

## Cost (indicative)

| Service        | Notes                    |
|----------------|--------------------------|
| Cloud Run      | Scale-to-zero, low traffic ≈ $0–5/mo |
| Inferencia     | Depends on your instance/plan       |
| Supabase       | Free tier available                  |
| Gemini (optional) | Free tier for embeddings         |
| Secret Manager | Typically &lt;$1/mo                  |

## Docker

Locally the app listens on 3000 (Next.js default when PORT is unset). On Cloud Run it uses 8080.

```bash
docker build -t lgportfolio .

docker run -p 3000:3000 \
  -e INFERENCIA_API_KEY=your-key \
  -e INFERENCIA_BASE_URL=https://llm.menezmethod.com/v1 \
  lgportfolio
```

## GCP deployment

Deployment is **Cloud Build only** (no GitHub Actions, Vercel, or Cloudflare). Push to `main` triggers Cloud Build → build image → deploy to Cloud Run. See [docs/DEPLOY-CLOUDRUN.md](./docs/DEPLOY-CLOUDRUN.md) and [AGENTS.md](./AGENTS.md).

If you see Vercel or Cloudflare checks on PRs, disconnect those integrations in **GitHub → Settings → Integrations** (or in the Vercel/Cloudflare dashboards) so only GCP Cloud Build runs.

- **Terraform (infra only):** `cd terraform && terraform init && terraform plan -var="project_id=YOUR_PROJECT" && terraform apply`

## Scripts

| Command         | Description        |
|----------------|--------------------|
| `npm run dev`  | Dev server         |
| `npm run build`| Production build   |
| `npm run start`| Production server  |
| `npm run lint` | ESLint             |

## Author

**Luis Gimenez**
- Email: luisgimenezdev@gmail.com
- GitHub: [@menezmethod](https://github.com/menezmethod)
- LinkedIn: [linkedin.com/in/gimenezdev](https://www.linkedin.com/in/gimenezdev)
- Twitter: [@menezmethod](https://twitter.com/menezmethod)

---

Built with care; this repo is also a small case study in cloud and AI integration.
