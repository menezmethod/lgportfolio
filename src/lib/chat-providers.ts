import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

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
const INFERENCIA_FAST_FAIL_MS = 18_000;
const OPENROUTER_PER_MODEL_MS = 35_000;
const TOTAL_INFERENCE_BUDGET_MS = 52_000;

export type ChatProviderId = "inferencia" | "openrouter";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: { toTextStreamResponse: () => Response };
  provider: ChatProviderId;
  model: string;
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
  return Boolean(process.env.INFERENCIA_API_KEY?.trim() && process.env.INFERENCIA_BASE_URL?.trim());
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function isChatConfigured(): boolean {
  return isInferenciaConfigured() || isOpenRouterConfigured();
}

export function buildChatProviderChain(): ChatProviderSpec[] {
  const chain: ChatProviderSpec[] = [];

  if (isInferenciaConfigured()) {
    chain.push({
      id: "inferencia",
      label: "Inferencia",
      model: process.env.INFERENCIA_CHAT_MODEL || "gemma4:e4b",
      timeoutMs: INFERENCIA_FAST_FAIL_MS,
      createClient: () =>
        createOpenAI({
          baseURL: process.env.INFERENCIA_BASE_URL!,
          apiKey: process.env.INFERENCIA_API_KEY!,
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
      chain.push({
        id: "openrouter",
        label: `OpenRouter (${model})`,
        model,
        timeoutMs: OPENROUTER_PER_MODEL_MS,
        createClient: createOpenRouter,
      });
    }
  }

  return chain;
}

function remainingBudgetMs(startedAt: number): number {
  return Math.max(0, TOTAL_INFERENCE_BUDGET_MS - (Date.now() - startedAt));
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

    try {
      const client = provider.createClient();
      const result = await streamText({
        model: client.chat(provider.model),
        system: params.system,
        messages: params.messages,
        maxRetries: 0,
        maxOutputTokens: params.maxOutputTokens ?? 800,
        temperature: params.temperature ?? 0.5,
        abortSignal: AbortSignal.timeout(timeoutMs),
      });
      return { result, provider: provider.id, model: provider.model };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      options?.onFallback?.(provider, lastError);
    }
  }

  throw new Error(`All chat providers failed: ${lastError}`);
}
