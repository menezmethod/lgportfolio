import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  getEvalCases,
  evaluateCase,
  summarizeEval,
  type ChatEvalCaseResult,
} from "@/lib/chat-eval";
import {
  buildSystemPrompt,
  getChatProviderConfig,
  validateProviderConfig,
} from "@/lib/chat-config";
import { retrieveContext } from "@/lib/rag";
import { sanitizeInput } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateTraceId, log, recordRequest } from "@/lib/telemetry";

export const runtime = "nodejs";
export const maxDuration = 60;

const SECURITY_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

interface EvalRequestBody {
  caseIds?: string[];
  maxCases?: number;
  includeResponses?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
}

function parseRequestBody(value: unknown): EvalRequestBody {
  const body = (value || {}) as Record<string, unknown>;
  return {
    caseIds: Array.isArray(body.caseIds)
      ? body.caseIds.filter((id): id is string => typeof id === "string")
      : undefined,
    maxCases: typeof body.maxCases === "number" ? body.maxCases : undefined,
    includeResponses: body.includeResponses === true,
    temperature: typeof body.temperature === "number" ? body.temperature : undefined,
    maxOutputTokens: typeof body.maxOutputTokens === "number" ? body.maxOutputTokens : undefined,
  };
}

function getEvalAccess(req: Request): { authorized: boolean; privileged: boolean } {
  const token = process.env.CHAT_EVAL_TOKEN;
  if (token) {
    const provided = req.headers.get("x-chat-eval-token");
    if (provided === token) return { authorized: true, privileged: true };
    return { authorized: false, privileged: false };
  }
  return { authorized: true, privileged: false };
}

export async function POST(req: Request) {
  const requestStart = Date.now();
  const traceId = generateTraceId();

  const access = getEvalAccess(req);
  if (!access.authorized) {
    recordRequest("/api/chat/eval", "POST", 403, Date.now() - requestStart);
    return new Response(JSON.stringify({ error: "Forbidden", message: "CHAT_EVAL_TOKEN is configured; provide a valid x-chat-eval-token header." }), {
      status: 403,
      headers: {
        ...SECURITY_HEADERS,
        "X-Trace-Id": traceId,
      },
    });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = checkRateLimit(ip);
  if (!rateLimitResult.allowed) {
    recordRequest("/api/chat/eval", "POST", 429, Date.now() - requestStart);
    return new Response(JSON.stringify({ error: "Rate limited", message: rateLimitResult.message || "Rate limit hit." }), {
      status: 429,
      headers: {
        ...SECURITY_HEADERS,
        "X-Trace-Id": traceId,
      },
    });
  }

  let parsedBody: EvalRequestBody;
  try {
    parsedBody = parseRequestBody(await req.json());
  } catch {
    recordRequest("/api/chat/eval", "POST", 400, Date.now() - requestStart);
    return new Response(JSON.stringify({ error: "Bad request", message: "Invalid JSON body." }), {
      status: 400,
      headers: {
        ...SECURITY_HEADERS,
        "X-Trace-Id": traceId,
      },
    });
  }

  const maxCaseLimit = access.privileged ? 8 : 4;
  const requestedCaseCount = parsedBody.maxCases ?? 6;
  const cases = getEvalCases(parsedBody.caseIds, Math.min(requestedCaseCount, maxCaseLimit));
  if (cases.length === 0) {
    recordRequest("/api/chat/eval", "POST", 400, Date.now() - requestStart);
    return new Response(JSON.stringify({ error: "Bad request", message: "No evaluation cases selected." }), {
      status: 400,
      headers: {
        ...SECURITY_HEADERS,
        "X-Trace-Id": traceId,
      },
    });
  }

  const providerConfig = getChatProviderConfig();
  const providerValidation = validateProviderConfig(providerConfig);
  if (!providerValidation.ok) {
    recordRequest("/api/chat/eval", "POST", 503, Date.now() - requestStart);
    return new Response(JSON.stringify({ error: "Service unavailable", message: providerValidation.reason }), {
      status: 503,
      headers: {
        ...SECURITY_HEADERS,
        "X-Trace-Id": traceId,
      },
    });
  }

  const openai = createOpenAI({
    baseURL: providerConfig.baseURL,
    apiKey: providerConfig.apiKey,
  });

  const results: ChatEvalCaseResult[] = [];

  for (const evalCase of cases) {
    const started = Date.now();
    const check = sanitizeInput(evalCase.prompt);
    const promptForInference = check.sanitized || evalCase.prompt;

    if (!check.safe) {
      const blockedResponse = check.reason || "Blocked by input safety filters.";
      const verdict = evaluateCase(evalCase, blockedResponse);
      results.push({
        id: evalCase.id,
        category: evalCase.category,
        prompt: evalCase.prompt,
        response: blockedResponse,
        passed: verdict.passed,
        checks: verdict.checks,
        latencyMs: Date.now() - started,
      });
      continue;
    }

    try {
      const context = await retrieveContext(promptForInference);
      const systemPrompt = buildSystemPrompt(context);
      const generation = await generateText({
        model: openai.chat(providerConfig.model),
        system: systemPrompt,
        messages: [{ role: "user", content: promptForInference }],
        maxRetries: 1,
        maxOutputTokens: Math.max(120, Math.min(parsedBody.maxOutputTokens ?? 260, 500)),
        temperature: Math.max(0, Math.min(parsedBody.temperature ?? 0.2, 0.8)),
      });

      const responseText = generation.text.trim();
      const verdict = evaluateCase(evalCase, responseText);
      results.push({
        id: evalCase.id,
        category: evalCase.category,
        prompt: evalCase.prompt,
        response: responseText,
        passed: verdict.passed,
        checks: verdict.checks,
        latencyMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown inference error.";
      results.push({
        id: evalCase.id,
        category: evalCase.category,
        prompt: evalCase.prompt,
        response: `Inference error: ${message}`,
        passed: false,
        checks: [
          {
            name: "inference_error",
            passed: false,
            reason: message,
          },
        ],
        latencyMs: Date.now() - started,
      });
    }
  }

  const summary = summarizeEval(results);
  const duration = Date.now() - requestStart;
  recordRequest("/api/chat/eval", "POST", summary.allPassed ? 200 : 422, duration);
  log(summary.allPassed ? "INFO" : "WARNING", "Chat eval completed", {
    trace_id: traceId,
    endpoint: "/api/chat/eval",
    latency_ms: duration,
    pass_rate: summary.passRate,
    passed: summary.passed,
    failed: summary.failed,
  });

  const payload = {
    trace_id: traceId,
    generated_at: new Date().toISOString(),
    provider: {
      base_url: access.privileged ? providerConfig.baseURL : "[hidden]",
      model: providerConfig.model,
    },
    limits: {
      max_cases: maxCaseLimit,
      privileged: access.privileged,
    },
    summary,
    cases: parsedBody.includeResponses
      ? results
      : results.map(({ response, ...rest }) => ({ ...rest, response: "[hidden: set includeResponses=true]" })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: summary.allPassed ? 200 : 422,
    headers: {
      ...SECURITY_HEADERS,
      "X-Trace-Id": traceId,
    },
  });
}
