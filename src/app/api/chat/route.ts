import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { checkRateLimit, incrementDailyCount, getCachedResponse, isDailyBudgetExhausted } from "@/lib/rate-limit";
import { retrieveContext } from "@/lib/rag";

// Edge runtime for better performance
export const runtime = "edge";
export const maxDuration = 30;

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

    // Increment daily counter
    incrementDailyCount();

    const result = streamText({
      // Gemini 2.0 Flash — free tier: 10 RPM, 250K TPM, 1000 RPD
      model: google("gemini-2.0-flash"),
      system: `You are the AI assistant for Luis Gimenez's professional portfolio.

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
${context}`,
      messages,
      // Note: maxTokens isn't directly supported by streamText
      // The system prompt limits response size through instruction
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal error",
        message: "Something went wrong. Please try again or contact Luis directly.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
