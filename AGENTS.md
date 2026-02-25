# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **Next.js 16 portfolio site** (`gimenez.dev`) with an AI chat feature. It is a single Next.js process with no local databases or external services required for basic operation.

### Running the app

- `npm run dev` — starts dev server on port 3000
- `npm run build` — production build
- `npm run lint` — ESLint (has pre-existing warnings/errors in the repo)

See `README.md` **Scripts** table for the full list.

### Environment variables

- Copy `.env.example` to `.env.local`. The portfolio pages (Home, About, Work, Architecture, Contact) work without any API keys.
- The AI chat feature uses an **Inferencia API** (OpenAI-compatible). The default `INFERENCIA_BASE_URL` is baked into the code; only `INFERENCIA_API_KEY` is needed for chat. Without it, chat returns 503 but all other pages work fine.
- Supabase and Google Gemini keys are optional (RAG falls back to a local knowledge file in `src/lib/knowledge.ts`).

### Gotchas

- `npm run lint` exits with code 1 due to pre-existing `react/no-unescaped-entities` and `@typescript-eslint/no-explicit-any` errors. This is expected and not a blocker.
- The nav labels differ from route paths: "Experience" → `/work`, "System Design" → `/architecture`, "AI Chat" → `/chat`.
- No automated test suite exists in this repo (no `test` script in `package.json`).
