import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { checkRateLimit, incrementDailyCount, getCachedResponse, isDailyBudgetExhausted } from "@/lib/rate-limit";
import { retrieveContext } from "@/lib/rag";

// Edge runtime for better performance
export const runtime = "edge";
export const maxDuration = 30;

// Model configurations with provider info
type ModelConfig = {
  provider: "google" | "anthropic" | "openai";
  model: string;
  baseURL?: string; // For custom endpoints like local LLMs
  apiKey?: string;  // For local LLMs (can be "dummy" if no auth needed)
  headers?: Record<string, string>; // e.g. ngrok-skip-browser-warning for tunnel
};

const CHAT_MODELS: ModelConfig[] = [
  { provider: "google", model: "gemini-2.0-flash" },
  { provider: "google", model: "gemini-1.5-flash" },
  { provider: "anthropic", model: "claude-3-haiku-20240307" },
  // Local LLM fallback (MLX server) when main AI returns 429 — OpenAI-compatible /v1/chat/completions
  {
    provider: "openai",
    model: "gpt-oss-20b-MXFP4-Q8",
    baseURL: process.env.LOCAL_LLM_URL || "http://localhost:11973/v1",
    apiKey: process.env.LOCAL_LLM_API_KEY || "dummy",
  },
  // Tunnel fallback (ngrok) — same local MLX server, reachable from deployed app or other machines
  {
    provider: "openai",
    model: "gpt-oss-20b-MXFP4-Q8",
    baseURL: process.env.LOCAL_LLM_TUNNEL_URL || "https://63d4-47-203-87-233.ngrok-free.app/v1",
    apiKey: process.env.LOCAL_LLM_API_KEY || "dummy",
    headers: { "ngrok-skip-browser-warning": "true" },
  },
];

const MAX_RETRIES_PER_MODEL = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  const value = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
  return Math.min(value, MAX_BACKOFF_MS);
}

/** Returns true if the error is rate limit, quota, or temporary overload (retry or switch model). */
function isRetryableProviderError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const msg = String((error as { message?: string }).message ?? "").toLowerCase();
  const status = (error as { status?: number }).status;
  const code = (error as { code?: number }).code;
  if (status === 429 || status === 503 || code === 429 || code === 503) return true;
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
  ];
  return retryablePhrases.some((p) => msg.includes(p));
}

export async function POST(req: Request) {
  try {
    // Rate limiting — enforce free tier budget
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimitResult = checkRateLimit(ip);

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

    // Check cache first — don't burn API calls on common questions
    const cached = await getCachedResponse(lastMessage);
    if (cached) {
      return new Response(cached, {
        headers: { "Content-Type": "text/plain", "X-Cache": "HIT" },
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

    for (const config of CHAT_MODELS) {
      for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
        try {
          let result;
          
          if (config.provider === "google") {
            result = await streamText({
              model: google(config.model),
              system: systemPrompt,
              messages,
            });
          } else if (config.provider === "anthropic") {
            // Convert messages format for Anthropic
            const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
              role: m.role === "model" ? "assistant" : m.role,
              content: m.content,
            }));
            
            result = await streamText({
              model: anthropic(config.model),
              system: systemPrompt,
              messages: anthropicMessages,
            });
          } else if (config.provider === "openai" && config.baseURL) {
            // For local LLM fallback - using OpenAI-compatible /v1/chat/completions
            const customOpenAI = createOpenAI({
              baseURL: config.baseURL,
              apiKey: config.apiKey ?? "dummy",
              ...(config.headers && { headers: config.headers }),
            });
            result = await streamText({
              model: customOpenAI.chat(config.model),
              system: systemPrompt,
              messages,
            });
          }
          
          return result!.toTextStreamResponse();
        } catch (err) {
          lastError = err;
          wasRateLimitOrOverload = isRetryableProviderError(err);
          if (!wasRateLimitOrOverload) {
            // Non-retryable (auth, bad request, etc.) — fail fast
            throw err;
          }
          if (attempt < MAX_RETRIES_PER_MODEL - 1) {
            const delay = backoffMs(attempt);
            console.warn(`Chat provider rate limit/overload (provider=${config.provider}, model=${config.model}, attempt=${attempt + 1}), retrying in ${delay}ms`);
            await sleep(delay);
          } else {
            console.warn(`Chat provider failed after ${MAX_RETRIES_PER_MODEL} attempts for ${config.provider}/${config.model}, trying next model`);
          }
        }
      }
    }

    // All models and retries exhausted
    console.error("Chat API: all models exhausted", lastError);
    const status = wasRateLimitOrOverload ? 429 : 500;
    const body = wasRateLimitOrOverload
      ? {
          error: "All models busy",
          message: "Chat will be back soon. Please try again in a minute.",
        }
      : {
          error: "Service unavailable",
          message: "Chat will be back soon. Try again or email luisgimenezdev@gmail.com.",
        };
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const isRetryable = isRetryableProviderError(error);
    const status = isRetryable ? 429 : 500;
    const message = isRetryable
      ? "Chat will be back soon. Please try again in a moment."
      : "Chat will be back soon. Try again or email luisgimenezdev@gmail.com.";
    return new Response(
      JSON.stringify({ error: isRetryable ? "Rate limit" : "Internal error", message }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
}
