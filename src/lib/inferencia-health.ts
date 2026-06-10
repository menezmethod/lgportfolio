/**
 * Lightweight Inferencia connectivity probe for /api/health.
 * Caches results briefly to avoid hammering the inference gateway on uptime checks.
 */

const CACHE_TTL_MS = 30_000;

let cached:
  | { status: "up" | "down" | "degraded"; latency_ms?: number; checked_at: number }
  | null = null;

function inferenciaHealthUrl(): string | null {
  const baseURL = process.env.INFERENCIA_BASE_URL?.trim();
  if (!baseURL) return null;
  const origin = baseURL.replace(/\/v1\/?$/, "");
  return `${origin}/health`;
}

export async function probeInferenciaHealth(): Promise<{
  status: "up" | "down" | "degraded";
  latency_ms?: number;
}> {
  if (cached && Date.now() - cached.checked_at < CACHE_TTL_MS) {
    return { status: cached.status, latency_ms: cached.latency_ms };
  }

  const apiKey = process.env.INFERENCIA_API_KEY;
  const healthUrl = inferenciaHealthUrl();

  if (!apiKey) {
    const result = { status: "degraded" as const };
    cached = { ...result, checked_at: Date.now() };
    return result;
  }

  if (!healthUrl) {
    const result = { status: "degraded" as const };
    cached = { ...result, checked_at: Date.now() };
    return result;
  }

  const start = Date.now();
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
    const latency_ms = Date.now() - start;
    const body = (await res.json().catch(() => null)) as { status?: string } | null;
    const backendHealthy = res.ok && body?.status === "healthy";
    const result = { status: backendHealthy ? ("up" as const) : ("down" as const), latency_ms };
    cached = { ...result, checked_at: Date.now() };
    return result;
  } catch {
    const latency_ms = Date.now() - start;
    const result = { status: "down" as const, latency_ms };
    cached = { ...result, checked_at: Date.now() };
    return result;
  }
}

/** Reset cache between tests. */
export function resetInferenciaHealthCache(): void {
  cached = null;
}
