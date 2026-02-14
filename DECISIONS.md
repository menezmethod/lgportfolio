# Portfolio Rebuild Decisions

## Project Setup
- **Framework:** Next.js 15 App Router with TypeScript
- **Styling:** Tailwind CSS with original site colors preserved (#32c0f4 cyan, #e97124 orange)
- **AI Chat:** Vercel AI SDK + Google Gemini 2.0 Flash (free tier)
- **RAG:** Supabase pgvector scaffolded (optional - falls back to static context)
- **Infrastructure:** GCP Cloud Run via Terraform
- **CI/CD:** GitHub Actions with Workload Identity

## Branch Strategy
- Working branch: `main` (per directive)
- Source: Convert from existing CRA React app (master branch)

## Key Decisions
1. Used original site colors (#32c0f4 cyan for primary, #e97124 orange for secondary) adapted to dark theme
2. Implemented Vercel AI SDK for streaming chat responses
3. Created comprehensive rate limiting to stay within Gemini free tier (10 RPM, 1000 RPD)
4. Pre-seeded cache for 9 common questions to avoid burning API calls
5. Session-based message cap (20/session) to manage usage
6. Architecture page as case study - showing RAG pipeline, cost breakdown, infrastructure diagrams
7. Edge runtime for chat API for better performance
8. No maxTokens in streamText - relies on system prompt for length control
9. String concatenation instead of template literals for cached responses (avoided parsing issues)

## Assumptions
- Luis will provide GOOGLE_API_KEY as GitHub Secret
- Supabase optional - static fallback works without it
- Using Workload Identity instead of service account keys for better security
- Dark theme only - no light mode

## Cost Optimization
- Cloud Run scale-to-0: $0-5/mo
- Supabase free tier: $0
- Gemini API free tier: $0-3/mo
- Total estimated: $1-11/month

## Quality Gates Met
- [x] npm run build succeeds
- [x] npm run lint passes (warnings only, no errors)
- [x] All pages render: Home, About, Work, Architecture, Chat, Contact
- [x] Chat API with rate limiting and caching
- [x] RAG pipeline scaffolded
- [x] Terraform IaC complete
- [x] GitHub Actions CI/CD configured
- [x] Dockerfile for containerization
- [x] Comprehensive README and SETUP.md

## Files Created/Updated
- All Next.js app pages with dark theme
- src/lib/rate-limit.ts - Rate limiting + response caching
- src/lib/rag.ts - RAG retrieval logic
- src/app/api/chat/route.ts - Gemini streaming API
- src/app/api/rag/route.ts - RAG context retrieval
- src/app/architecture/page.tsx - Architecture case study
- terraform/main.tf - GCP Cloud Run IaC
- .github/workflows/deploy.yml - CI/CD pipeline
- README.md - Comprehensive documentation
- SETUP.md - Step-by-step setup instructions
- QUESTIONS.md - Questions for Luis post-build
