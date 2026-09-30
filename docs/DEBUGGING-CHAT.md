# Chat debugging guide

The chat path is: browser, `POST /api/chat`, retrieval (`src/lib/rag.ts`, through the Cloudflare RAG worker and Vectorize, with file-based retrieval as the fallback), then generation through the provider chain in `src/lib/chat-providers.ts`. In production the active provider is Cloudflare Workers AI through the same worker. Other providers are tried only when their environment variables are set.

## Quick API test

```bash
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What is Luis good at?"}]}'
```

Expect a 200 with plain text or streamed chunks. A 429 means a rate limit (per IP, per session, or the daily budget in `src/lib/rate-limit.ts`). A 503 means no provider is configured or every provider failed.

## Where to look

1. **War Room** (`/war-room`): the Recent errors section lists server-recorded errors with endpoint, status, message and `trace_id`.
2. **Server logs**: the app writes structured JSON to stdout. Chat events include `Chat inference attempt`, `Chat provider failed, trying fallback`, `Chat response (inference)` and `Chat API error`. Every chat response carries an `X-Trace-Id` header, and the same `trace_id` appears in the log lines for that request.
3. **Provider chain**: `buildChatProviderChain()` orders Inferencia (if `INFERENCIA_API_KEY` and a base URL are set), OpenRouter (if `OPENROUTER_API_KEY` is set), then Cloudflare Workers AI (if `CLOUDFLARE_RAG_KEY` is set). Each provider gets a timeout, and a failure falls through to the next.
4. **Retrieval**: if `CLOUDFLARE_RAG_KEY` is unset or the worker fails, retrieval falls back to the file-based knowledge base in `src/lib/knowledge.ts`.
5. **Health**: `GET /api/health/live` only checks that the process is up. `GET /api/health` also reports the state of the chat providers.

## Browser console

Open the console (F12) and send a message. Client-side messages are prefixed `[chat:client]` and show the request, the response status and content type, and whether the stream parsed.

## Checklist

1. **No reply at all**: check the browser console for the response status, then the server logs for the `trace_id` from the `X-Trace-Id` header.
2. **429**: wait a minute, or use a different IP. The limits are constants in `src/lib/rate-limit.ts`.
3. **503**: confirm at least one provider is configured (see the chain above) and that `CLOUDFLARE_RAG_WORKER_URL` and `CLOUDFLARE_RAG_KEY` match the deployed worker in `workers/rag`.
