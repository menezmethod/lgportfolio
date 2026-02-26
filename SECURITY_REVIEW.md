# Security + Credibility Review (Feb 2026)

## Goal

Perform a skeptical, recruiter-grade audit focused on:
- Security correctness
- Honesty/realism of claims
- Chat behavior reliability against injection/scope abuse
- Infra best-practice alignment

## Highest-risk findings discovered

1. **Credibility drift in docs/content (High)**
   - Stale Gemini/Anthropic references and contradictory setup docs.
   - Some copy overstated scope/ownership beyond contributor framing.
   - `AGENTS.md` had corrupted trailing content.

2. **RAG drift risk (Medium)**
   - `/api/rag` used a static fallback context that diverged from canonical `knowledge.ts`.

3. **Operational testing gap for LLM behavior (High)**
   - No deterministic, repeatable backend mechanism to evaluate recruiter/security response quality from CLI.

4. **CSP looseness (Medium)**
   - `unsafe-eval` was present in all environments.

5. **Terraform/documentation drift (Medium)**
   - Deployment and infra docs had stale assumptions inconsistent with actual Cloud Build + Cloud Run posture.

## Changes implemented

### Security + backend

- Added shared provider/system-prompt config:
  - `src/lib/chat-config.ts`
- Hardened `/api/chat`:
  - Provider config validation
  - `no-store` cache-control for responses/errors
  - Shared refusal text + centralized system prompt
  - Cached responses still available even when daily budget is exhausted
- Added deterministic eval framework:
  - `src/lib/chat-eval.ts`
  - `src/app/api/chat/eval/route.ts`
  - `scripts/run-chat-eval.sh`

### Retrieval consistency

- Replaced drift-prone `/api/rag` fallback with canonical retrieval via `retrieveContext`.
- Simplified retrieval to section-aware local knowledge-base selection in `src/lib/rag.ts`.

### Content realism + honesty

- Updated knowledge base with explicit production chat host truth:
  - gpt-oss on MacBook Pro M4 Max (128GB)
  - Raspberry Pi/Zero/Pico work is hobby-only for this site context
- Reduced inflated or ambiguous claims across key pages (`/`, `/about`, `/work`, `/architecture`, `/contact`).

### Config/docs alignment

- Rebuilt `.env.example`, `README.md`, `SETUP.md`, `DEBUGGING_CHAT.md`, `DECISIONS.md`, `QUESTIONS.md`, and `AGENTS.md` for single-source consistency.
- Converted GitHub workflow to CI-only lint/build to avoid deployment-path conflict with Cloud Build.

## Single smartest addition (implemented)

**A backend LLM behavior gate (`/api/chat/eval`) plus CLI runner (`scripts/run-chat-eval.sh`)**.

Why this is accretive:
- Converts subjective “chat seems okay” into repeatable pass/fail checks.
- Tests honesty, scope refusal, prompt-injection defense, and infrastructure realism with one command.
- Enables regression checks before and after deploy without UI/manual overhead.

## How to run the new gate

```bash
./scripts/run-chat-eval.sh --base-url http://localhost:3000
```

Optional:

```bash
./scripts/run-chat-eval.sh --base-url https://gimenez.dev --token "$CHAT_EVAL_TOKEN" --include-responses
```

## Residual risks

1. Heuristic evaluator checks can miss nuanced language regressions.
2. In-memory rate limits/telemetry reset on cold starts (intentional design tradeoff).
3. `CHAT_EVAL_TOKEN` should be configured in remote environments to avoid exposing eval surface.
