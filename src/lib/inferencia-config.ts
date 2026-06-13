/**
 * Single source of truth for Inferencia chat settings.
 * Import from here — do not hardcode model/base URL in routes.
 */

/** Production default: gemma4:12b on Pi Ollama (see Inferencia /health models list). */
export const DEFAULT_INFERENCIA_CHAT_MODEL = "gemma4:12b";

/** Coolify / homelab: inferencia container on Docker network. */
export const DEFAULT_INFERENCIA_BASE_URL_COOLIFY = "http://inferencia:8080/v1"; // pragma: allowlist secret

/** Public tunnel fallback (local dev / external probes only). */
export const DEFAULT_INFERENCIA_BASE_URL_PUBLIC = "https://llm.menezmethod.com/v1"; // pragma: allowlist secret

export function getInferenciaChatModel(): string {
  const fromEnv = process.env.INFERENCIA_CHAT_MODEL?.trim();
  return fromEnv || DEFAULT_INFERENCIA_CHAT_MODEL;
}

export function getInferenciaBaseUrl(): string | null {
  const fromEnv = process.env.INFERENCIA_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.COOLIFY === "1" || process.env.COOLIFY === "true") {
    return DEFAULT_INFERENCIA_BASE_URL_COOLIFY;
  }
  return null;
}

export function getInferenciaApiKey(): string | null {
  const key = process.env.INFERENCIA_API_KEY?.trim();
  return key || null;
}

export function isInferenciaEnvConfigured(): boolean {
  return Boolean(getInferenciaApiKey() && getInferenciaBaseUrl());
}

/** OpenAI-compatible models list URL from base URL. */
export function inferenciaModelsUrl(baseURL?: string | null): string | null {
  const base = (baseURL ?? getInferenciaBaseUrl())?.replace(/\/v1\/?$/, "");
  if (!base) return null;
  return `${base}/v1/models`;
}

/** Inferencia gateway /health (no auth). */
export function inferenciaHealthUrl(baseURL?: string | null): string | null {
  const base = (baseURL ?? getInferenciaBaseUrl())?.replace(/\/v1\/?$/, "");
  if (!base) return null;
  return `${base}/health`;
}
