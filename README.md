# Luis Gimenez Portfolio

A next-generation, AI-powered portfolio website built with Next.js 15, TypeScript, and Google Cloud Platform. Features an AI chat interface powered by Gemini and a RAG (Retrieval-Augmented Generation) pipeline for accurate responses about my work.

## 🚀 Live Site

**URL:** https://gimenez.dev

## ✨ Features

- **Modern Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS
- **AI Chat:** Interactive chat powered by Google's Gemini API
- **RAG Pipeline:** Context-aware responses using Supabase pgvector (optional)
- **Responsive Design:** Mobile-first, accessible UI
- **SEO Optimized:** Meta tags, Open Graph, semantic HTML
- **Infrastructure as Code:** Terraform for GCP Cloud Run deployment
- **CI/CD:** GitHub Actions for automated deployment
- **Containerized:** Docker for consistent environments

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| AI | Google Gemini API |
| Vector DB | Supabase pgvector (optional) |
| Icons | Lucide React |
| Animation | Framer Motion |
| Deployment | GCP Cloud Run |
| IaC | Terraform |
| CI/CD | GitHub Actions |

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- Google Cloud Platform account
- Gemini API key (get at https://aistudio.google.com/app/apikey)
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
# Edit .env.local and add your GEMINI_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Required for AI chat
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - for RAG vector search
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# GCP Configuration (for deployment)
GCP_PROJECT_ID=your_gcp_project_id
GCP_REGION=us-central1

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

### Supabase RAG Setup (Optional)

To enable vector search for the AI chat:

1. Create a Supabase project
2. Enable the pgvector extension
3. Create the embeddings table:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE portfolio_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(768),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX ON portfolio_embeddings 
USING ivfflat (embedding vector_cosine_ops);
```

4. Add your portfolio content to the table

## 🏗️ Build

```bash
# Build for production
npm run build

# Run linter
npm run lint
```

## 🐳 Docker

Build and run locally with Docker:

```bash
# Build image
docker build -t lgportfolio .

# Run container
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  lgportfolio
```

## ☁️ GCP Cloud Run Deployment

### Option 1: GitHub Actions (Recommended)

1. Fork this repository
2. Add these secrets to your GitHub repository:
   - `GCP_PROJECT_ID`: Your GCP project ID
   - `GCP_SA_KEY`: Service account key JSON
   - `GEMINI_API_KEY`: Your Gemini API key

3. Push to `main` branch - deployment happens automatically

### Option 2: Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Plan changes
terraform plan \
  -var="project_id=your_project_id" \
  -var="region=us-central1" \
  -var="container_image=gcr.io/your_project_id/lgportfolio:latest"

# Apply
terraform apply \
  -var="project_id=your_project_id" \
  -var="region=us-central1" \
  -var="container_image=gcr.io/your_project_id/lgportfolio:latest"
```

## 📁 Project Structure

```
lgportfolio/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── about/        # About page
│   │   ├── work/         # Projects showcase
│   │   ├── contact/      # Contact page
│   │   ├── chat/         # AI chat interface
│   │   ├── api/          # API routes
│   │   │   ├── chat/     # Gemini API route
│   │   │   └── rag/      # RAG retrieval route
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable components
│   └── lib/              # Utility functions
├── terraform/            # Terraform IaC
├── .github/
│   └── workflows/        # GitHub Actions
├── Dockerfile            # Container config
├── next.config.ts        # Next.js config
└── package.json
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🤖 AI Chat Implementation

The AI chat feature uses:

1. **Gemini API**: For generating responses
2. **System Prompt**: Pre-configured with Luis's background
3. **Conversation History**: Last 10 messages for context
4. **Fallback RAG**: Static portfolio context when Supabase isn't configured

### API Routes

- `POST /api/chat` - Gemini chat endpoint
- `POST /api/rag` - RAG context retrieval

## 🔐 Security

- Environment variables for all secrets
- No hardcoded API keys
- CORS configured for production
- Input validation on API routes

## 📄 License

MIT License - see LICENSE file for details

## 👤 Author

**Luis Gimenez**
- Website: https://gimenez.dev
- GitHub: [@menezmethod](https://github.com/menezmethod)
- LinkedIn: [linkedin.com/in/gimenezdev](https://www.linkedin.com/in/gimenezdev/)
- Twitter: [@menezmethod](https://twitter.com/menezmethod)

---

Built with ❤️ and AI
