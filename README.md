# Luis Gimenez Portfolio

A next-generation, AI-powered portfolio website built with Next.js 15 and Google Cloud Platform. Features an AI chat interface powered by Gemini with RAG pipeline, demonstrating production-grade cloud architecture skills.

## 🎯 Target Roles

- GCP Cloud Architect
- GCP AI/ML Architect  
- GenAI Architect
- Cloud Solutions Architect

## ✨ Features

- **Modern Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS
- **AI Chat:** Interactive chat powered by Google Gemini 2.0 Flash
- **RAG Pipeline:** Vector search using Supabase pgvector (optional)
- **Rate Limiting:** Free tier protection (10 RPM, 1000 RPD)
- **Response Caching:** Pre-seeded cache for common questions
- **Architecture Showcase:** Full system architecture page
- **Responsive Design:** Mobile-first, dark theme
- **Infrastructure as Code:** Terraform for GCP Cloud Run
- **CI/CD:** GitHub Actions → Cloud Run deployment
- **Containerized:** Multi-stage Dockerfile

## 🚀 Live Site

**URL:** https://gimenez.dev

## 🛠️ Tech Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Framework | Next.js 15 (App Router) | SSR/SSG, API routes, RSC |
| Language | TypeScript | Type safety, professional standard |
| Styling | Tailwind CSS | Clean, fast, professional |
| AI Chat | Vercel AI SDK + Google Gemini 2.0 Flash | GCP-aligned, free tier |
| Vector DB | Supabase (pgvector) | Free tier, PostgreSQL-based |
| Embeddings | text-embedding-004 (Gemini API) | Free tier available |
| Hosting | GCP Cloud Run | Proves GCP deployment skills |
| IaC | Terraform | #1 requested skill in job listings |
| CI/CD | GitHub Actions → Cloud Build | Industry standard |

## 📋 Prerequisites

- Node.js 20+
- Google Cloud Platform account
- Gemini API key (free at https://aistudio.google.com/apikey)
- (Optional) Supabase account for RAG features

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your GOOGLE_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

```env
# Required - Get from https://aistudio.google.com/apikey
GOOGLE_API_KEY=your-api-key

# Optional - For RAG vector search
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

See `.env.example` for all options.

## 🏗️ Project Structure

```
lgportfolio/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Hero with animated titles
│   │   ├── about/page.tsx        # About + skills
│   │   ├── work/page.tsx         # Projects showcase
│   │   ├── architecture/page.tsx # Architecture case study
│   │   ├── contact/page.tsx      # Contact info
│   │   ├── chat/page.tsx         # AI chat interface
│   │   └── api/chat/route.ts     # Gemini + RAG API
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── rag.ts               # RAG retrieval logic
│   │   └── rate-limit.ts         # Rate limiting + caching
│   └── content/                 # MDX content (future)
├── terraform/                   # GCP Cloud Run IaC
├── .github/workflows/           # CI/CD pipeline
├── Dockerfile                   # Container config
└── SETUP.md                     # Setup instructions
```

## 🤖 AI Chat Implementation

### Rate Limiting Strategy

The chat implements multiple layers of rate limiting to stay within Gemini's free tier:

1. **Per-IP Token Bucket:** Max 3 requests/minute per visitor
2. **Session Cap:** Max 20 messages per browser session
3. **Daily Budget:** Max 900 requests/day (of 1000 RPD limit)
4. **Response Caching:** Pre-seeded cache for common questions

### Cached Queries

These common queries return cached responses (don't burn API calls):
- "Tell me about Luis's experience"
- "What GCP services has Luis used?"
- "Describe the Churnistic project"
- "What's Luis's tech stack?"
- "Is Luis open to remote work?"
- And more...

### Fallback Strategy

When limits are hit:
1. Return cached response if available
2. Show pre-written fallback message
3. Provide contact info for detailed questions

## 💰 Cost Budget

| Service | Monthly Cost |
|---------|-------------|
| Cloud Run (scale to 0) | $0-5 |
| Supabase (free tier) | $0 |
| Gemini API (free tier) | $0-3 |
| Cloud CDN | $0-2 |
| Secret Manager | <$1 |
| **Total** | **$1-11/month** |

## 🐳 Docker

```bash
# Build image
docker build -t lgportfolio .

# Run locally
docker run -p 3000:3000 -e GOOGLE_API_KEY=your-key lgportfolio
```

## ☁️ GCP Deployment

### GitHub Actions (Recommended)

1. Set up GCP project with APIs enabled
2. Configure Workload Identity
3. Add secrets to GitHub
4. Push to main → auto-deploy

### Terraform

```bash
cd terraform
terraform init
terraform plan -var="project_id=your-project"
terraform apply -var="project_id=your-project"
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## 👤 Author

**Luis Gimenez**
- Email: luisgimenezdev@gmail.com
- GitHub: [@menezmethod](https://github.com/menezmethod)
- LinkedIn: [linkedin.com/in/gimenezdev](https://www.linkedin.com/in/gimenezdev)
- Twitter: [@menezmethod](https://twitter.com/menezmethod)

---

Built with ❤️ and AI. This portfolio is itself a case study in cloud architecture.
