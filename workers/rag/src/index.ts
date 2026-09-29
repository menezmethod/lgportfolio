/**
 * lgportfolio RAG + chat fallback worker.
 *
 * Holds the Cloudflare AI and Vectorize bindings so the Next.js app never
 * needs a Cloudflare account API token. Protected by a shared secret
 * (RAG_KEY, set with `wrangler secret put RAG_KEY`).
 *
 * Routes:
 *   POST /retrieve            { query, topK }        -> { matches: [{score, source, content}] }
 *   POST /seed                { chunks: [...] }      -> embed + upsert (idempotent by id)
 *   POST /v1/chat/completions OpenAI-compatible SSE  -> Workers AI chat fallback
 */

interface Env {
  AI: Ai;
  VECTORIZE: Vectorize;
  RAG_KEY: string;
  EMBEDDING_MODEL: string;
  CHAT_MODEL: string;
}

interface SeedChunk {
  id: string;
  content: string;
  source?: string;
}

const EMBED_BATCH_SIZE = 10;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function authorized(request: Request, env: Env): boolean {
  const header =
    request.headers.get("x-rag-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(env.RAG_KEY) && header === env.RAG_KEY;
}

async function embed(env: Env, texts: string[]): Promise<number[][]> {
  const result = (await env.AI.run(env.EMBEDDING_MODEL, { text: texts })) as {
    data?: number[][];
  };
  const vectors = result?.data;
  if (!Array.isArray(vectors) || vectors.length !== texts.length) {
    throw new Error(`Embedding batch mismatch: got ${vectors?.length}, expected ${texts.length}`);
  }
  return vectors;
}

async function handleRetrieve(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { query?: string; topK?: number };
  if (!body.query || typeof body.query !== "string") {
    return json({ error: "query is required" }, 400);
  }
  const topK = typeof body.topK === "number" ? body.topK : 5;

  const [vector] = await embed(env, [body.query]);
  const result = await env.VECTORIZE.query(vector, {
    topK,
    returnMetadata: "all",
    returnValues: false,
  });

  return json({
    matches: (result.matches ?? []).map((match) => ({
      score: match.score,
      source: (match.metadata?.source as string) ?? "unknown",
      content: (match.metadata?.content as string) ?? "",
    })),
  });
}

async function handleSeed(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { chunks?: SeedChunk[] };
  if (!Array.isArray(body.chunks) || body.chunks.length === 0) {
    return json({ error: "chunks is required" }, 400);
  }

  const vectors: VectorizeVector[] = [];
  for (let i = 0; i < body.chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = body.chunks.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embed(env, batch.map((chunk) => chunk.content));
    batch.forEach((chunk, j) => {
      vectors.push({
        id: chunk.id,
        values: embeddings[j],
        metadata: { content: chunk.content, source: chunk.source ?? "knowledge" },
      });
    });
  }

  const result = await env.VECTORIZE.upsert(vectors);
  return json({ upserted: vectors.length, mutationId: result.mutationId ?? null });
}

/** Workers AI streams `data: {"response": "..."}`; the AI SDK expects OpenAI chunks. */
async function handleChat(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    model?: string;
    messages?: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  };

  const model = body.model || env.CHAT_MODEL;
  const stream = (await env.AI.run(model as keyof AiModels, {
    messages: body.messages ?? [],
    stream: true,
    max_tokens: body.max_tokens ?? 800,
    temperature: body.temperature ?? 0.5,
  })) as ReadableStream;

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  (async () => {
    const reader = stream.getReader();
    let buffer = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const parsed = JSON.parse(payload) as { response?: string };
            const text = parsed.response ?? "";
            if (!text) continue;
            const chunk = {
              id: "chatcmpl-cf",
              object: "chat.completion.chunk",
              created: Math.floor(Date.now() / 1000),
              model,
              choices: [{ index: 0, delta: { content: text }, finish_reason: null }],
            };
            await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          } catch {
            /* skip malformed upstream line */
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "stream error";
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
    } finally {
      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return json({ error: "method not allowed" }, 405);
    }
    if (!authorized(request, env)) {
      return json({ error: "unauthorized" }, 401);
    }

    const path = new URL(request.url).pathname;
    try {
      if (path === "/retrieve") return await handleRetrieve(request, env);
      if (path === "/seed") return await handleSeed(request, env);
      if (path === "/v1/chat/completions") return await handleChat(request, env);
      return json({ error: "not found" }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : "internal error";
      return json({ error: message }, 502);
    }
  },
} satisfies ExportedHandler<Env>;
