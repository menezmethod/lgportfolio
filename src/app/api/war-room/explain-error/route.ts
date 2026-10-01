import { buildChatProviderChain, streamChatWithFallbacks } from "@/lib/chat-providers";
import {
  checkRateLimit,
  incrementDailyCount,
  isDailyBudgetExhausted,
} from "@/lib/rate-limit";
import { publishDailyBudgetGauge, recordRequest } from "@/lib/telemetry";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a DevOps/SRE assistant. The user will paste an error message or log line from their application.
Your job: explain what the error means in plain language and suggest one to three concrete fixes. Be concise (under 150 words).
Do not make up stack traces or code. If the error is unclear, say so and suggest how to get more context (e.g. check logs, trace_id).`;

const JSON_HEADERS = { "Content-Type": "application/json", "X-Content-Type-Options": "nosniff" };

/** Explains a War Room error with the same provider chain as the chat (Workers AI in production). */
export async function POST(req: Request) {
  const start = Date.now();
  if (buildChatProviderChain().length === 0) {
    recordRequest("/api/war-room/explain-error", "POST", 503, Date.now() - start);
    return new Response(JSON.stringify({ error: "Inference API not configured" }), { status: 503, headers: JSON_HEADERS });
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      recordRequest("/api/war-room/explain-error", "POST", 429, Date.now() - start);
      return new Response(JSON.stringify({ error: "Rate limited", message: rateLimitResult.message }), { status: 429, headers: JSON_HEADERS });
    }

    if (isDailyBudgetExhausted()) {
      recordRequest("/api/war-room/explain-error", "POST", 429, Date.now() - start);
      return new Response(JSON.stringify({ error: "Daily limit exhausted", message: "Budget exhausted." }), { status: 429, headers: JSON_HEADERS });
    }

    const body = await req.json().catch(() => ({}));
    const errorText = (body as { error_text?: string }).error_text?.trim() || "";
    if (!errorText) {
      recordRequest("/api/war-room/explain-error", "POST", 400, Date.now() - start);
      return new Response(JSON.stringify({ error: "Missing error_text" }), { status: 400, headers: JSON_HEADERS });
    }

    const { result } = await streamChatWithFallbacks({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Explain this error and suggest fixes:\n\n${errorText.slice(0, 2000)}` }],
      maxOutputTokens: 300,
      temperature: 0.3,
    });
    const text = await result.toTextStreamResponse().text();
    incrementDailyCount();
    publishDailyBudgetGauge();

    recordRequest("/api/war-room/explain-error", "POST", 200, Date.now() - start);
    return new Response(JSON.stringify({ explanation: text }), { status: 200, headers: JSON_HEADERS });
  } catch {
    recordRequest("/api/war-room/explain-error", "POST", 503, Date.now() - start);
    return new Response(JSON.stringify({ error: "Explain failed" }), { status: 503, headers: JSON_HEADERS });
  }
}
