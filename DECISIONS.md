# Portfolio Rebuild Decisions

## Project Setup
- **Framework:** Next.js 15 App Router with TypeScript
- **Styling:** Tailwind CSS (modern, efficient for portfolio)
- **AI Chat:** Gemini API for conversational AI
- **RAG:** Supabase pgvector for document embeddings
- **Infrastructure:** GCP Cloud Run via Terraform
- **CI/CD:** GitHub Actions

## Branch Strategy
- Working branch: `main` (per directive)
- Source: Convert from existing CRA React app

## Key Decisions
1. Using Tailwind instead of MUI for cleaner Next.js integration
2. Gemini for AI chat (per directive - not Claude)
3. Supabase pgvector for RAG (simpler than GCP vector search)
4. Cloud Run for deployment (serverless container)

## Assumptions
- Luis will provide API keys via environment variables
- Using `npx create-next-app` with app router
- Keeping existing content from CRA version
