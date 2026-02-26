import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  checkRateLimit,
  incrementDailyCount,
  getCachedResponse,
  isDailyBudgetExhausted,
} from "@/lib/rate-limit";
import { retrieveContext } from "@/lib/rag";
import { sanitizeInput, validateMessages } from "@/lib/security";
import {
  buildSystemPrompt,
  getChatProviderConfig,
  validateProviderConfig,
} from "@/lib/chat-config";
import {
  log,
  generateTraceId,
  recordRequest,
  recordChatMetrics,
  increment,
  addEvent,
} from "@/lib/telemetry";

export const runtime = "nodejs";
export const maxDuration = 30;

const SECURITY_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function jsonError(status: number, error: string, message: string, traceId?: string) {
  if (traceId) {
    log(status >= 500 ? "ERROR" : "WARNING", message, {
      trace_id: traceId,
      status_code: status,
      error,
    });
  }
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      ...(traceId ? { "X-Trace-Id": traceId } : {}),
    },
  });
}

export async function POST(req: Request) {
  const requestStart = Date.now();
  const traceId = generateTraceId();

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      recordRequest("/api/chat", "POST", 429, Date.now() - requestStart);
      recordChatMetrics({ durationMs: 0, ragDurationMs: 0, cacheHit: false, rateLimited: true });
      return jsonError(429, "Rate limited", rateLimitResult.message || "Rate limit hit.", traceId);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      recordRequest("/api/chat", "POST", 400, Date.now() - requestStart);
      return jsonError(400, "Bad request", "Invalid JSON body.", traceId);
    }

    const { messages: rawMessages } = body as { messages: unknown };
    const validation = validateMessages(rawMessages);
    if (!validation.safe || !validation.parsed) {
      recordRequest("/api/chat", "POST", 400, Date.now() - requestStart);
      return jsonError(400, "Bad request", validation.reason || "Invalid messages.", traceId);
    }

    const lastUserContent = validation.parsed.filter((m) => m.role === "user").pop()?.content || "";
    const inputCheck = sanitizeInput(lastUserContent);
    if (!inputCheck.safe) {
      increment("chat_injection_blocked_total");
      addEvent("rate_limit", `Prompt injection blocked: ${lastUserContent.substring(0, 50)}...`);
      recordRequest("/api/chat", "POST", 400, Date.now() - requestStart);
      log("WARNING", "Prompt injection attempt blocked", {
        trace_id: traceId,
        ip,
        content_preview: lastUserContent.substring(0, 100),
      });
      return new Response(
        JSON.stringify({ error: "Content filtered", message: inputCheck.reason }),
        {
          status: 400,
          headers: {
            ...SECURITY_HEADERS,
            "X-Trace-Id": traceId,
          },
        }
      );
    }

    const sanitizedContent = inputCheck.sanitized || lastUserContent;

    const cached = await getCachedResponse(sanitizedContent);
    if (cached) {
      const duration = Date.now() - requestStart;
      recordRequest("/api/chat", "POST", 200, duration);
      recordChatMetrics({ durationMs: duration, ragDurationMs: 0, cacheHit: true, rateLimited: false });
      log("INFO", "Chat response (cache hit)", {
        trace_id: traceId,
        endpoint: "/api/chat",
        latency_ms: duration,
        cache_hit: true,
      });
      return new Response(cached, {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-store",
          "X-Cache": "HIT",
          "X-Content-Type-Options": "nosniff",
          "X-Trace-Id": traceId,
        },
      });
    }

    if (isDailyBudgetExhausted()) {
      recordRequest("/api/chat", "POST", 429, Date.now() - requestStart);
      return jsonError(429, "Daily limit exhausted", "Budget exhausted.", traceId);
    }

    const providerConfig = getChatProviderConfig();
    const providerValidation = validateProviderConfig(providerConfig);
    if (!providerValidation.ok) {
      recordRequest("/api/chat", "POST", 503, Date.now() - requestStart);
      return jsonError(503, "Service unavailable", providerValidation.reason, traceId);
    }

    // RAG retrieval span
    const ragStart = Date.now();
    const context = await retrieveContext(sanitizedContent);
    const ragDurationMs = Date.now() - ragStart;
    incrementDailyCount();

    const systemPrompt = buildSystemPrompt(context);
    const openai = createOpenAI({
      baseURL: providerConfig.baseURL,
      apiKey: providerConfig.apiKey,
    });

    const safeMessages = validation.parsed.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Inference span
    const inferenceStart = Date.now();
    const result = await streamText({
      model: openai.chat(providerConfig.model),
      system: systemPrompt,
      messages: safeMessages,
      maxRetries: 1,
      maxOutputTokens: 500,
      temperature: 0.5,
    });

    const response = result.toTextStreamResponse();
    if (!response.body) throw new Error("No response body");

    const totalDuration = Date.now() - requestStart;
    const inferenceDuration = Date.now() - inferenceStart;

    recordRequest("/api/chat", "POST", 200, totalDuration);
    recordChatMetrics({
      durationMs: inferenceDuration,
      ragDurationMs,
      cacheHit: false,
      rateLimited: false,
    });

    log("INFO", "Chat response (inference)", {
      trace_id: traceId,
      endpoint: "/api/chat",
      latency_ms: totalDuration,
      rag_duration_ms: ragDurationMs,
      inference_duration_ms: inferenceDuration,
      cache_hit: false,
    });

    return new Response(response.body, {
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Trace-Id": traceId,
      },
    });
  } catch (error) {
    const duration = Date.now() - requestStart;
    const msg = error instanceof Error ? error.message : "unknown";
    recordRequest("/api/chat", "POST", 503, duration);
    increment("errors_total{type=\"inference\"}");
    addEvent("error", `Chat API error: ${msg}`);
    log("ERROR", "Chat API error", { trace_id: traceId, error: msg, latency_ms: duration });
    return jsonError(
      503,
      "Service unavailable",
      "The AI is temporarily unavailable. Try again later or email luisgimenezdev@gmail.com.",
      traceId
    );
  }
}
