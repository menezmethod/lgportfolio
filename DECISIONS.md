# Architecture Decisions

## Core decisions

1. **Single chat provider path**
   - `/api/chat` uses one OpenAI-compatible provider configuration (`INFERENCIA_*` env vars).
   - No multi-provider fallback logic.

2. **Reality-first contribution framing**
   - System prompt and knowledge base explicitly prevent over-claiming ownership.
   - Responses must frame team scale context and Luis's specific contributions.

3. **Production chat host truth**
   - Production chat is documented as gpt-oss on local MacBook Pro M4 Max (128GB).
   - Hobby SBC/MCU experimentation is explicitly separated from production hosting.

4. **Deterministic evaluation harness**
   - Added `/api/chat/eval` + `scripts/run-chat-eval.sh`.
   - Enables recruiter/security regression checks via CLI without GUI tests.

5. **Local knowledge retrieval**
   - Retrieval is section-aware over canonical `knowledge.ts`.
   - Removed drift-prone fallback context from `/api/rag`.

6. **Free-first infrastructure posture**
   - Cloud Run max instances remains 1.
   - ALB + Cloud Armor retained for edge security and real architecture credibility.

## Quality gates

- `npm run lint`
- `npm run build`
- chat eval run through CLI harness
- Terraform formatting/validation checks for infra edits
