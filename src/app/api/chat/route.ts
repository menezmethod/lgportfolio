import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { checkRateLimit, incrementDailyCount, getCachedResponse, isDailyBudgetExhausted } from "@/lib/rate-limit";
import { retrieveContext } from "@/lib/rag";

export const runtime = "edge";
export const maxDuration = 30;

type ModelConfig = {
  provider: "openai";
  model: string;
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
};

// Local MLX only. Localhost first (for local dev); tunnel second (for Vercel). No Gemini.
function getChatModels(): ModelConfig[] {
  const tunnel: ModelConfig = {
    provider: "openai",
    model: "gpt-oss-20b-MXFP4-Q8",
    baseURL: process.env.LOCAL_LLM_TUNNEL_URL || "https://63d4-47-203-87-233.ngrok-free.app/v1",
    apiKey: process.env.LOCAL_LLM_API_KEY || "dummy",
    headers: { "ngrok-skip-browser-warning": "true" },
  };
  const local: ModelConfig = {
    provider: "openai",
    model: "gpt-oss-20b-MXFP4-Q8",
    baseURL: process.env.LOCAL_LLM_URL || "http://localhost:11973/v1",
    apiKey: process.env.LOCAL_LLM_API_KEY || "dummy",
  };
  // On Vercel, tunnel is the only option; locally, try localhost first so we don't hit dead tunnel.
  return process.env.VERCEL ? [tunnel, local] : [local, tunnel];
}

const MAX_RETRIES_PER_MODEL = 1;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  const value = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
  return Math.min(value, MAX_BACKOFF_MS);
}

/** Returns true if we should try the next model (rate limit, 404, offline, overload). */
function isRetryableProviderError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: string; name?: string; status?: number; code?: string; statusCode?: number };
  if (e.name === "AI_RetryError" || e.name === "AI_APICallError") return true;
  const status = e.status ?? e.statusCode;
  if (status === 404 || status === 429 || status === 503) return true;
  const code = String(e.code ?? "").toLowerCase();
  if (code === "enotfound" || code === "econnrefused" || code === "econnreset") return true;
  const msg = String(e.message ?? "").toLowerCase();
  const retryablePhrases = [
    "rate",
    "quota",
    "resource exhausted",
    "resource_exhausted",
    "overloaded",
    "unavailable",
    "too many requests",
    "429",
    "503",
    "exceeded your current quota",
    "offline",
    "err_ngrok",
    "not found",
    "404",
    "parse",
    "html",
    "doctype",
  ];
  return retryablePhrases.some((p) => msg.includes(p));
}

export async function POST(req: Request) {
  console.log("[chat] POST /api/chat received");
  try {
    // Rate limiting — enforce free tier budget
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimitResult = checkRateLimit(ip);
    console.log("[chat] rateLimit check", { allowed: rateLimitResult.allowed, ip });

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limited",
          message:
            rateLimitResult.message ||
            "Chat is temporarily unavailable. Email luisgimenezdev@gmail.com for questions.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check daily budget
    if (isDailyBudgetExhausted()) {
      return new Response(
        JSON.stringify({
          error: "Daily limit exhausted",
          message:
            "Chat will be back tomorrow. Email luisgimenezdev@gmail.com for urgent questions.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";
    console.log("[chat] lastMessage length", lastMessage?.length ?? 0, "messages count", messages?.length ?? 0);

    // Check cache first — don't burn API calls on common questions
    const cached = await getCachedResponse(lastMessage);
    if (cached) {
      console.log("[chat] cache HIT, returning cached response");
      return new Response(cached, {
        headers: { "Content-Type": "text/plain", "X-Cache": "HIT", "X-Chat-Source": "cache" },
      });
    }

    // Get context from RAG
    const context = await retrieveContext(lastMessage);

    // Increment daily counter (once per request)
    incrementDailyCount();

    const systemPrompt = `You are the AI assistant for Luis Gimenez's professional portfolio.

Luis is a Software Engineer II at The Home Depot specializing in enterprise payment systems (Go, Java, GCP). He holds the GCP Professional Cloud Architect certification and is seeking GCP Cloud Architect and AI Architecture roles.

BEHAVIOR RULES:
- Only answer based on the provided context. If you don't have info, say so honestly.
- Frame responses to highlight architecture thinking and system design skills.
- When discussing projects, emphasize trade-offs, scale, and GCP-relevant patterns.
- If asked about role fit, map Luis's skills against the role requirements.
- Be professional, technical, clear, and solution-oriented.
- Include links to relevant portfolio pages when applicable (e.g., /projects/churnistic).
- Keep responses concise but thorough. Use code blocks for technical examples.
- KEEP RESPONSES UNDER 500 TOKENS to conserve free tier TPM budget.
- If asked to generate a "skills brief" for a job description, produce a structured comparison table: Required Skill → Luis's Evidence → Strength Rating (Strong/Good/Growth Area).

CONTEXT FROM KNOWLEDGE BASE:
${context}`;

    let lastError: unknown = null;
    let wasRateLimitOrOverload = false;
    const models = getChatModels();
    console.log("[chat] models order", models.map((m) => (m.baseURL.includes("localhost") ? "local" : "tunnel")));

    for (const config of models) {
      const label = config.baseURL.includes("localhost") ? "local" : "tunnel";
      for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
        console.log("[chat] trying provider", label, "baseURL", config.baseURL, "attempt", attempt + 1);
        try {
          const customOpenAI = createOpenAI({
            baseURL: config.baseURL,
            apiKey: config.apiKey ?? "dummy",
            ...(config.headers && { headers: config.headers }),
          });
          const result = await streamText({
            model: customOpenAI.chat(config.model),
            system: systemPrompt,
            messages,
            maxRetries: 0,
          });
          const response = result.toTextStreamResponse();
          if (!response.body) {
            throw new Error("No response body");
          }
          // Force the stream to start so the fetch runs here; if provider returns 404/HTML we throw and try next.
          const reader = response.body.getReader();
          const first = await reader.read();
          console.log("[chat] first chunk received", { done: first.done, size: first.value?.byteLength ?? 0 });
          if (first.done) {
            reader.releaseLock();
            console.log("[chat] stream ended immediately (empty), returning");
            return new Response(new ReadableStream(), { headers: response.headers });
          }
          const firstText = new TextDecoder().decode(first.value);
          const looksLikeErrorPage =
            firstText.includes("<!DOCTYPE") ||
            firstText.includes("<html") ||
            firstText.toLowerCase().includes("ngrok") ||
            firstText.toLowerCase().includes("offline");
          if (looksLikeErrorPage) {
            console.log("[chat] provider returned error page, first 120 chars:", firstText.slice(0, 120));
            reader.releaseLock();
            throw new Error(`Provider returned error page: ${firstText.slice(0, 80)}`);
          }
          const source = config.baseURL.includes("localhost") ? "local" : "tunnel";
          console.log(`[chat] response from: ${source} (baseURL: ${config.baseURL})`);
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(first.value);
              (async () => {
                try {
                  for (;;) {
                    const next = await reader.read();
                    if (next.done) break;
                    controller.enqueue(next.value);
                  }
                  controller.close();
                } catch (e) {
                  controller.error(e);
                }
              })();
            },
          });
          const headers = new Headers(response.headers);
          headers.set("X-Chat-Source", source);
          return new Response(stream, { headers });
        } catch (err) {
          lastError = err;
          const errName = err && typeof err === "object" && "name" in err ? (err as { name: string }).name : "";
          const errMsg = err instanceof Error ? err.message : String(err);
          wasRateLimitOrOverload = isRetryableProviderError(err);
          console.warn("[chat] provider error", {
            label,
            name: errName,
            message: errMsg.slice(0, 200),
            isRetryable: wasRateLimitOrOverload,
          });
          if (!wasRateLimitOrOverload) {
            console.error("[chat] non-retryable, failing fast");
            throw err;
          }
          if (attempt < MAX_RETRIES_PER_MODEL - 1) {
            const delay = backoffMs(attempt);
            console.warn(`[chat] retrying ${label} in ${delay}ms`);
            await sleep(delay);
          } else {
            console.warn(`[chat] ${label} failed, trying next model`);
          }
        }
      }
    }

    // All models and retries exhausted (e.g. tunnel offline, local not running)
    console.error("[chat] all models exhausted", {
      lastErrorName: lastError && typeof lastError === "object" && "name" in lastError ? (lastError as { name: string }).name : "",
      lastErrorMessage: lastError instanceof Error ? lastError.message : String(lastError).slice(0, 200),
      wasRateLimitOrOverload,
    });
    const status = wasRateLimitOrOverload ? 429 : 503;
    const body = {
      error: wasRateLimitOrOverload ? "All models busy" : "Service unavailable",
      message:
        "The AI model is temporarily unavailable. If you're running locally, make sure the local model server is running. Otherwise try again later or email luisgimenezdev@gmail.com.",
    };
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const isRetryable = isRetryableProviderError(error);
    const status = isRetryable ? 429 : 503;
    const message =
      "The AI model is temporarily unavailable. If you're running locally, start the local model server. Otherwise try again later or email luisgimenezdev@gmail.com.";
    return new Response(
      JSON.stringify({ error: isRetryable ? "Rate limit" : "Service unavailable", message }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
}
