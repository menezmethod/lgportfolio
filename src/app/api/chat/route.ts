import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { checkRateLimit, incrementDailyCount, getCachedResponse, isDailyBudgetExhausted } from "@/lib/rate-limit";
import { retrieveContext } from "@/lib/rag";

// Edge runtime for better performance
export const runtime = "edge";
export const maxDuration = 30;

// Model fallbacks: try primary first, then alternatives on rate limit / overload
const CHAT_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"] as const;

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
            "Chat is resting. Try again tomorrow or email Luis at luisgimenezdev@gmail.com",
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

    for (const modelId of CHAT_MODELS) {
      for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
        try {
          const result = await streamText({
            model: google(modelId),
            system: systemPrompt,
            messages,
          });
          return result.toTextStreamResponse();
        } catch (err) {
          lastError = err;
          wasRateLimitOrOverload = isRetryableProviderError(err);
          if (!wasRateLimitOrOverload) {
            // Non-retryable (auth, bad request, etc.) — fail fast
            throw err;
          }
          if (attempt < MAX_RETRIES_PER_MODEL - 1) {
            const delay = backoffMs(attempt);
            console.warn(`Chat provider rate limit/overload (model=${modelId}, attempt=${attempt + 1}), retrying in ${delay}ms`);
            await sleep(delay);
          } else {
            console.warn(`Chat provider failed after ${MAX_RETRIES_PER_MODEL} attempts for model=${modelId}, trying next model`);
          }
        }
      }
    }

    // All models and retries exhausted
    console.error("Chat API: all models exhausted", lastError);
    const status = wasRateLimitOrOverload ? 429 : 500;
    const body = wasRateLimitOrOverload
      ? {
          error: "Provider rate limit",
          message:
            "All chat models are temporarily busy or over limit. Please wait a minute and try again, or email luisgimenezdev@gmail.com.",
        }
      : {
          error: "Service unavailable",
          message: "The AI service couldn’t respond. Please try again in a moment or contact Luis at luisgimenezdev@gmail.com.",
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
      ? "The AI service is temporarily overloaded. Please wait a moment and try again."
      : "Something went wrong. Please try again or contact Luis at luisgimenezdev@gmail.com.";
    return new Response(
      JSON.stringify({ error: isRetryable ? "Rate limit" : "Internal error", message }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
}
