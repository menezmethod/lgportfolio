# Chat debugging guide

## Where to look

### 1. Terminal (Next.js dev server)

When you send a message, you should see logs like:

- `[chat] POST /api/chat received`
- `[chat] rateLimit check` — `allowed` should be `true` if limits are disabled
- `[chat] lastMessage length` / `messages count`
- `[chat] cache HIT` — only if the query was cached (then no model is called)
- `[chat] models order` — e.g. `['local', 'tunnel']` (localhost first when not on Vercel)
- `[chat] trying provider local baseURL http://localhost:11973/v1 attempt 1`
- `[chat] first chunk received` — `done`, `size`; if you see this, the provider responded
- `[chat] response from: local` — success path
- Or: `[chat] provider error` — `label`, `name`, `message`, `isRetryable`; then `[chat] local failed, trying next model` and the same for tunnel
- Or: `[chat] all models exhausted` — both local and tunnel failed

If the tunnel returns an HTML error page, you’ll see either:

- `[chat] provider returned error page, first 120 chars: <!DOCTYPE...` and then try next model, or
- `[chat] provider error` with message containing "Not Found" / "offline" and then try next model.

### 2. Browser console (F12 → Console)

When you send a message:

- `[chat:client] sending request, message: <your text>`
- `[chat:client] response` — `ok`, `status`, `contentType`
  - If `ok: false`, you’ll see `[chat:client] error response` and the error message in the chat.
  - If `contentType` is `application/json`, the API returned an error (e.g. 503).
- If streaming: `[chat:client] stream done` — `chunkCount`, `length`, `usedDataStream`
- If something’s wrong: `[chat:client] got N chunks but no content parsed` or `[chat:client] catch` with the error.

### 3. Stream format fix

The client now supports **both**:

- **Data stream**: lines like `0:{"text":"Hello"}` (parsed and appended).
- **Plain text stream**: raw text chunks from `toTextStreamResponse()` (appended as-is).

So you should see a reply in the UI when the API returns either format.

## Quick checklist

1. **No reply at all**
   - Terminal: Do you see `[chat] trying provider local` then `provider error` for both local and tunnel, then `all models exhausted`? → Start the local model server (e.g. port 11973) or fix the tunnel.
   - Terminal: Do you see `[chat] first chunk received` and `[chat] response from: local` but still no reply in the UI? → Check browser console for `[chat:client] response` and `stream done`; ensure `contentType` and chunk handling look correct.
   - Browser: `[chat:client] response` has `ok: false`? → Read `errorData` and show the user the `message` (already shown in the chat bubble).

2. **Rate limit / 429**
   - In `src/lib/rate-limit.ts`, `RATE_LIMITS_DISABLED` should be `true` so `checkRateLimit` and related checks don’t block.

3. **Tunnel offline (ngrok 404)**
   - The route tries local first when not on Vercel. If the local server is not running, it then tries the tunnel; if the tunnel is offline, you get 503 and the “AI model temporarily unavailable” message in the chat.

## Remove logs later

Search for `[chat]` and `[chat:client]` in:

- `src/app/api/chat/route.ts`
- `src/app/chat/page.tsx`

Delete or comment out the `console.log` / `console.warn` / `console.error` lines when you’re done debugging.
