import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { checkRateLimit, incrementDailyCount, getCachedResponse, isDailyBudgetExhausted } from "@/lib/rate-limit";
import { retrieveContext } from "@/lib/rag";

export const runtime = "edge";
export const maxDuration = 30;

const DEFAULT_BASE_URL = "https://llm.menezmethod.com/v1";
const DEFAULT_CHAT_MODEL = "mlx-community/gpt-oss-20b-MXFP4-Q8";

export async function POST(req: Request) {
  console.log("[chat] POST /api/chat received");

  const baseURL = process.env.INFERENCIA_BASE_URL || DEFAULT_BASE_URL;
  const apiKey = process.env.INFERENCIA_API_KEY;
  const model = process.env.INFERENCIA_CHAT_MODEL || DEFAULT_CHAT_MODEL;

  console.log("[chat] using inferencia", { baseURL, model, hasApiKey: !!apiKey });

  if (!apiKey) {
    console.error("[chat] INFERENCIA_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "Service unavailable", message: "LLM is not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limited",
          message: rateLimitResult.message || "Chat is temporarily unavailable. Email luisgimenezdev@gmail.com for questions.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    if (isDailyBudgetExhausted()) {
      return new Response(
        JSON.stringify({
          error: "Daily limit exhausted",
          message: "Chat will be back tomorrow. Email luisgimenezdev@gmail.com for urgent questions.",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || "";

    const cached = await getCachedResponse(lastMessage);
    if (cached) {
      return new Response(cached, {
        headers: { "Content-Type": "text/plain", "X-Cache": "HIT" },
      });
    }

    const context = await retrieveContext(lastMessage);
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

    const openai = createOpenAI({ baseURL, apiKey });
    const result = await streamText({
      model: openai.chat(model),
      system: systemPrompt,
      messages,
      maxRetries: 1,
    });

    const response = result.toTextStreamResponse();
    if (!response.body) {
      throw new Error("No response body");
    }

    return new Response(response.body, { headers: response.headers });
  } catch (error) {
    console.error("[chat] error:", error);
    const message = error instanceof Error ? error.message : "Service unavailable";
    return new Response(
      JSON.stringify({ error: "Service unavailable", message: "The AI is temporarily unavailable. Try again later or email luisgimenezdev@gmail.com." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
