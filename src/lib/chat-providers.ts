import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { modelFamily } from "@/lib/model-label";
import { activeChatProviderIds, type ChatProviderId } from "@/lib/chat-provider-env";
import {
  getInferenciaApiKey,
  getInferenciaBaseUrl,
  getInferenciaChatModel,
  isInferenciaEnvConfigured,
} from "@/lib/inferencia-config";

/** OpenRouter free chat models (scanned 2026-06-10). Non-chat (audio/VL/safety) excluded. */
export const OPENROUTER_FREE_FALLBACK_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.2-3b-instruct:free",
] as const;

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
/** How long the primary provider gets to produce a first token before we fall back. Override with INFERENCIA_FAST_FAIL_MS. */
function inferenciaFastFailMs(): number {
  const n = Number(process.env.INFERENCIA_FAST_FAIL_MS);
  return Number.isFinite(n) && n >= 500 ? n : 6_000;
}
const OPENROUTER_PER_MODEL_MS = 35_000;
const CLOUDFLARE_LAST_MODEL_MS = 20_000;
const CLOUDFLARE_DEFAULT_MODELS = [
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.1-8b-instruct-fast",
];

/** First-token deadline for every Workers AI model except the last. Override with CLOUDFLARE_FAST_FAIL_MS. */
function cloudflareFastFailMs(): number {
  const n = Number(process.env.CLOUDFLARE_FAST_FAIL_MS);
  return Number.isFinite(n) && n >= 500 ? n : 3_500;
}

/** Ordered Workers AI models: CLOUDFLARE_CHAT_MODELS (comma list), with legacy CLOUDFLARE_CHAT_MODEL as the first entry. */
function cloudflareChatModels(): string[] {
  const list = (process.env.CLOUDFLARE_CHAT_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const base = list.length > 0 ? list : [...CLOUDFLARE_DEFAULT_MODELS];
  const legacy = process.env.CLOUDFLARE_CHAT_MODEL?.trim();
  return legacy ? [legacy, ...base.filter((m) => m !== legacy)] : base;
}
const TOTAL_INFERENCE_BUDGET_MS = 52_000;

export type { ChatProviderId };

export interface ChatProviderSpec {
  id: ChatProviderId;
  label: string;
  model: string;
  timeoutMs: number;
  createClient: () => ReturnType<typeof createOpenAI>;
}

export interface StreamChatParams {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface StreamChatResult {
   
  result: { toTextStreamResponse: () => Response };
  provider: ChatProviderId;
  model: string;
  /** Time to first token of the attempt that succeeded (excludes earlier failed attempts). */
  attemptMs?: number;
  /** Time spent on failed attempts before the successful one started. */
  fallbackDelayMs?: number;
}

function parseOpenRouterModels(): string[] {
  const raw = process.env.OPENROUTER_FALLBACK_MODELS?.trim();
  if (!raw) return [...OPENROUTER_FREE_FALLBACK_MODELS];
  return raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

export function isInferenciaConfigured(): boolean {
  return isInferenciaEnvConfigured();
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

/** Workers AI last-resort fallback via the RAG worker (free 10k neurons/day; hard cap, then fails). */
export function isCloudflareConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_RAG_KEY?.trim());
}

/** True when at least one provider in the active chain (CHAT_PROVIDERS allowlist applied) can serve chat. */
export function isChatConfigured(): boolean {
  return activeChatProviderIds().length > 0;
}

function buildSpecs(): Record<ChatProviderId, ChatProviderSpec[]> {
  const specs: Record<ChatProviderId, ChatProviderSpec[]> = { inferencia: [], openrouter: [], cloudflare: [] };

  if (isInferenciaConfigured()) {
    const baseURL = getInferenciaBaseUrl()!;
    const apiKey = getInferenciaApiKey()!;
    const model = getInferenciaChatModel();
    specs.inferencia.push({
      id: "inferencia",
      label: "Inferencia",
      model,
      timeoutMs: inferenciaFastFailMs(),
      createClient: () =>
        createOpenAI({
          baseURL,
          apiKey,
        }),
    });
  }

  if (isOpenRouterConfigured()) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gimenez.dev";
    const headers = {
      "HTTP-Referer": siteUrl,
      "X-Title": "gimenez.dev Portfolio Chat",
    };
    const createOpenRouter = () =>
      createOpenAI({
        baseURL: OPENROUTER_BASE_URL,
        apiKey: process.env.OPENROUTER_API_KEY!,
        headers,
      });

    for (const model of parseOpenRouterModels()) {
      specs.openrouter.push({
        id: "openrouter",
        label: `OpenRouter (${model})`,
        model,
        timeoutMs: OPENROUTER_PER_MODEL_MS,
        createClient: createOpenRouter,
      });
    }
  }

  if (isCloudflareConfigured()) {
    const workerUrl = (
      process.env.CLOUDFLARE_RAG_WORKER_URL?.trim() ||
      "https://lgportfolio-rag.luisgimenezdev.workers.dev"
    ).replace(/\/$/, "");
    const models = cloudflareChatModels();
    const failMs = cloudflareFastFailMs();
    // Every model but the last gets a short first-token deadline so a stalled call falls through quickly;
    // the last one gets a long deadline so a total failure still resolves.
    models.forEach((model, i) => {
      specs.cloudflare.push({
        id: "cloudflare",
        label: `Workers AI (${modelFamily(model)})`,
        model,
        timeoutMs: i < models.length - 1 ? failMs : CLOUDFLARE_LAST_MODEL_MS,
        createClient: () =>
          createOpenAI({
            baseURL: `${workerUrl}/v1`,
            apiKey: process.env.CLOUDFLARE_RAG_KEY!.trim(),
          }),
      });
    });
  }

  return specs;
}

/** Providers in effective order: CHAT_PROVIDERS allowlist when set, else inferencia, openrouter, cloudflare. */
export function buildChatProviderChain(): ChatProviderSpec[] {
  const specs = buildSpecs();
  return activeChatProviderIds().flatMap((id) => specs[id]);

}

function remainingBudgetMs(startedAt: number): number {
  return Math.max(0, TOTAL_INFERENCE_BUDGET_MS - (Date.now() - startedAt));
}

function formatProviderError(error: unknown): string {
  if (error instanceof Error) {
    const retry = error as Error & { reason?: string; lastError?: Error };
    if (retry.reason === "maxRetriesExceeded" && retry.lastError) {
      return retry.lastError.message;
    }
    return error.message;
  }
  return String(error);
}

/** streamText() returns immediately; gate on first token so 502s reach the fallback loop. */
async function awaitFirstTextDelta(
  result: { textStream: AsyncIterable<string> },
  timeoutMs: number
): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Inference timeout")), timeoutMs);
  });

  const firstDelta = (async () => {
    for await (const delta of result.textStream) {
      if (delta.length > 0) return;
    }
    throw new Error("Empty inference stream");
  })();

  firstDelta.catch(() => {}); // a late rejection after the deadline (abort) must not become an unhandled rejection
  try {
    await Promise.race([firstDelta, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function streamChatWithFallbacks(
  params: StreamChatParams,
  options?: { onAttempt?: (provider: ChatProviderSpec) => void; onFallback?: (from: ChatProviderSpec, error: string) => void }
): Promise<StreamChatResult> {
  const chain = buildChatProviderChain();
  if (chain.length === 0) {
    throw new Error("No chat providers configured");
  }

  const startedAt = Date.now();
  let lastError = "unknown";

  for (const provider of chain) {
    const budget = remainingBudgetMs(startedAt);
    if (budget < 3_000) break;

    const timeoutMs = Math.min(provider.timeoutMs, budget);
    options?.onAttempt?.(provider);

    const attemptStart = Date.now();
    // Aborting on failure cancels the upstream request, so a stalled call stops consuming the provider.
    const controller = new AbortController();
    try {
      const client = provider.createClient();
      // First-token gate uses provider.timeoutMs; full stream uses remaining budget.
      // Do not pass AbortSignal.timeout(timeoutMs) — it caps the entire response at the
      // fast-fail window and truncates answers after the first token arrives.
      const result = streamText({
        model: client.chat(provider.model),
        system: params.system,
        messages: params.messages,
        maxRetries: 0,
        maxOutputTokens: params.maxOutputTokens ?? 800,
        temperature: params.temperature ?? 0.5,
        timeout: budget,
        abortSignal: controller.signal,
      });
      await awaitFirstTextDelta(result, timeoutMs);
      return {
        result,
        provider: provider.id,
        model: provider.model,
        attemptMs: Date.now() - attemptStart,
        fallbackDelayMs: attemptStart - startedAt,
      };
    } catch (error) {
      controller.abort();
      lastError = formatProviderError(error);
      options?.onFallback?.(provider, lastError);
    }
  }

  throw new Error(`All chat providers failed: ${lastError}`);
}
