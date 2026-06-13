/**
 * Inferencia connectivity probe for /api/health.
 * Verifies /health AND authenticated /v1/models (catches API key mismatch).
 */

import {
  getInferenciaApiKey,
  getInferenciaChatModel,
  inferenciaHealthUrl,
  inferenciaModelsUrl,
} from "@/lib/inferencia-config";

const CACHE_TTL_MS = 30_000;

let cached:
  | {
      status: "up" | "down" | "degraded";
      latency_ms?: number;
      model?: string;
      checked_at: number;
    }
  | null = null;

type HealthBody = {
  status?: string;
  services?: { ollama?: { models?: Array<{ id: string }> } };
};

export async function probeInferenciaHealth(): Promise<{
  status: "up" | "down" | "degraded";
  latency_ms?: number;
  model?: string;
}> {
  if (cached && Date.now() - cached.checked_at < CACHE_TTL_MS) {
    const { status, latency_ms, model } = cached;
    return { status, latency_ms, model };
  }

  const apiKey = getInferenciaApiKey();
  const healthUrl = inferenciaHealthUrl();
  const modelsUrl = inferenciaModelsUrl();
  const model = getInferenciaChatModel();

  if (!apiKey) {
    const result = { status: "degraded" as const, model };
    cached = { ...result, checked_at: Date.now() };
    return result;
  }

  if (!healthUrl || !modelsUrl) {
    const result = { status: "degraded" as const, model };
    cached = { ...result, checked_at: Date.now() };
    return result;
  }

  const start = Date.now();
  try {
    const healthRes = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
    const healthBody = (await healthRes.json().catch(() => null)) as HealthBody | null;
    const gatewayUp = healthRes.ok && healthBody?.status === "healthy";

    if (!gatewayUp) {
      const latency_ms = Date.now() - start;
      const result = { status: "down" as const, latency_ms, model };
      cached = { ...result, checked_at: Date.now() };
      return result;
    }

    const ollamaModels = healthBody?.services?.ollama?.models?.map((m) => m.id) ?? [];
    if (ollamaModels.length > 0 && !ollamaModels.includes(model)) {
      const latency_ms = Date.now() - start;
      const result = { status: "down" as const, latency_ms, model };
      cached = { ...result, checked_at: Date.now() };
      return result;
    }

    const authRes = await fetch(modelsUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const latency_ms = Date.now() - start;
    const result = {
      status: authRes.ok ? ("up" as const) : ("down" as const),
      latency_ms,
      model,
    };
    cached = { ...result, checked_at: Date.now() };
    return result;
  } catch {
    const latency_ms = Date.now() - start;
    const result = { status: "down" as const, latency_ms, model };
    cached = { ...result, checked_at: Date.now() };
    return result;
  }
}

/** Reset cache between tests. */
export function resetInferenciaHealthCache(): void {
  cached = null;
}
