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
  /** True when the second Workers AI model was started in parallel because the first was slow. */
  hedged?: boolean;
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

/** Delay before the second Workers AI model is started in parallel. 0 turns hedging off. Override with CLOUDFLARE_HEDGE_MS. */
function cloudflareHedgeMs(): number {
  const raw = process.env.CLOUDFLARE_HEDGE_MS;
  if (raw === undefined || raw.trim() === "") return 1_500;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 1_500;
}

interface Attempt {
  provider: ChatProviderSpec;
  start: number;
  controller: AbortController;
  /** Resolves on the first token. On failure or deadline it aborts its own upstream request and rejects. */
  done: Promise<StreamChatResult>;
}

/** Start one provider attempt. Aborting its controller cancels the upstream fetch. */
function startAttempt(
  provider: ChatProviderSpec,
  params: StreamChatParams,
  budget: number,
  startedAt: number,
  options?: { onAttempt?: (provider: ChatProviderSpec) => void }
): Attempt {
  const timeoutMs = Math.min(provider.timeoutMs, budget);
  options?.onAttempt?.(provider);
  const start = Date.now();
  const controller = new AbortController();
  const done = (async () => {
    try {
      const client = provider.createClient();
      // First-token gate uses the provider deadline; the full stream uses the remaining budget.
      // The signal only cancels a failed or losing attempt; it is not a short cap on the answering stream.
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
        attemptMs: Date.now() - start,
        fallbackDelayMs: start - startedAt,
        hedged: false,
      } as StreamChatResult;
    } catch (error) {
      controller.abort();
      throw error;
    }
  })();
  done.catch(() => {}); // a loser that fails after the winner was chosen must not become an unhandled rejection
  return { provider, start, controller, done };
}

/**
 * Workers AI hedge: run the primary; if it has no first token after hedgeMs, start the secondary in parallel
 * without cancelling the primary. The first first-token wins and the loser is aborted upstream. Each attempt
 * keeps its own hard deadline as a backstop. The caller counts the daily budget once, after this resolves.
 */
async function hedgedPair(
  primary: ChatProviderSpec,
  secondary: ChatProviderSpec,
  params: StreamChatParams,
  budget: number,
  startedAt: number,
  hedgeMs: number,
  options?: { onAttempt?: (provider: ChatProviderSpec) => void; onFallback?: (from: ChatProviderSpec, error: string) => void }
): Promise<StreamChatResult> {
  const a = startAttempt(primary, params, budget, startedAt, options);
  let hedgeTimer: ReturnType<typeof setTimeout> | undefined;
  const timer = new Promise<"hedge">((resolve) => {
    hedgeTimer = setTimeout(() => resolve("hedge"), hedgeMs);
  });
  const first = await Promise.race([
    a.done.then(
      (r) => ({ ok: true as const, r }),
      (e) => ({ ok: false as const, e })
    ),
    timer,
  ]);
  if (hedgeTimer) clearTimeout(hedgeTimer);
  if (first !== "hedge") {
    if (first.ok) return first.r; // fast primary: the secondary never starts
    options?.onFallback?.(primary, formatProviderError(first.e));
    // Primary failed before the hedge delay: plain sequential fallback, no hedge.
    const b = startAttempt(secondary, params, remainingBudgetMs(startedAt), startedAt, options);
    return await b.done.catch((e) => {
      options?.onFallback?.(secondary, formatProviderError(e));
      throw e;
    });
  }

  // Primary is slow: hedge.
  const b = startAttempt(secondary, params, remainingBudgetMs(startedAt), startedAt, options);
  const settle = (at: Attempt, other: Attempt) =>
    at.done.then(
      (r) => {
        other.controller.abort(); // cancel the loser upstream right away
        return { ...r, hedged: true };
      },
      (e) => {
        options?.onFallback?.(at.provider, formatProviderError(e));
        throw e;
      }
    );
  // The first to produce a token wins; if one fails the other can still win; both failing rejects.
  return await Promise.any([settle(a, b), settle(b, a)]).catch((agg: AggregateError) => {
    throw agg.errors?.[agg.errors.length - 1] ?? new Error("unknown");
  });
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
  const hedgeMs = cloudflareHedgeMs();

  for (let i = 0; i < chain.length; i++) {
    const provider = chain[i];
    const budget = remainingBudgetMs(startedAt);
    if (budget < 3_000) break;

    try {
      const next = chain[i + 1];
      if (provider.id === "cloudflare" && next?.id === "cloudflare" && hedgeMs > 0) {
        const r = await hedgedPair(provider, next, params, budget, startedAt, hedgeMs, options);
        return r;
      }
      const attempt = startAttempt(provider, params, budget, startedAt, options);
      return await attempt.done;
    } catch (error) {
      lastError = formatProviderError(error);
      if (!(chain[i].id === "cloudflare" && chain[i + 1]?.id === "cloudflare" && hedgeMs > 0)) options?.onFallback?.(provider, lastError);
      else i++; // the hedged pair already tried both models
    }
  }

  throw new Error(`All chat providers failed: ${lastError}`);
}
