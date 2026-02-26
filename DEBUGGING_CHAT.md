# Chat Debugging

## Fast checks

1. Start app:
   - `npm run dev`
2. Verify health:
   - `curl -s http://localhost:3000/api/health`
3. Verify chat:
   - `curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"What does Luis do?"}]}'`
4. Run evaluation harness:
   - `./scripts/run-chat-eval.sh --base-url http://localhost:3000`

## Common failures

### `503` from `/api/chat`
- `INFERENCIA_API_KEY` missing or invalid
- `INFERENCIA_BASE_URL` missing/invalid
- OpenAI-compatible backend unreachable

### `403` from `/api/chat/eval`
- If `CHAT_EVAL_TOKEN` is configured, requests must include `x-chat-eval-token`
- Without token, endpoint still works but stays rate-limited and non-privileged

### Prompt blocked unexpectedly
- Check `src/lib/security.ts` injection patterns and message length limits

### Response quality regressions
- Run `./scripts/run-chat-eval.sh --include-responses`
- Review failing checks in output and adjust:
  - `src/lib/chat-config.ts`
  - `src/lib/knowledge.ts`
  - `src/lib/rag.ts`

## Relevant files

- `src/app/api/chat/route.ts`
- `src/app/api/chat/eval/route.ts`
- `src/lib/chat-config.ts`
- `src/lib/chat-eval.ts`
- `src/lib/security.ts`
- `src/lib/knowledge.ts`
- `src/lib/rag.ts`
