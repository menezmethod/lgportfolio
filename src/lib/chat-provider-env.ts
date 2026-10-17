/**
 * Which chat providers are active, from env only (no SDK imports, safe anywhere).
 * CHAT_PROVIDERS="cloudflare" (comma list of inferencia, openrouter, cloudflare) restricts chat to
 * exactly those providers, in that order; a listed provider that is not configured is skipped.
 * Unset keeps the legacy order: inferencia, openrouter, cloudflare, whichever are configured.
 */
import { isInferenciaEnvConfigured } from "@/lib/inferencia-config";

export type ChatProviderId = "inferencia" | "openrouter" | "cloudflare";
const ALL: ChatProviderId[] = ["inferencia", "openrouter", "cloudflare"];

export function isConfigured(id: ChatProviderId): boolean {
  if (id === "inferencia") return isInferenciaEnvConfigured();
  if (id === "openrouter") return Boolean(process.env.OPENROUTER_API_KEY?.trim());
  return Boolean(process.env.CLOUDFLARE_RAG_KEY?.trim());
}

/** The allowlist when CHAT_PROVIDERS is set (unknown names ignored, duplicates dropped), else null. */
export function chatProviderAllowlist(): ChatProviderId[] | null {
  const raw = process.env.CHAT_PROVIDERS?.trim();
  if (!raw) return null;
  const out: ChatProviderId[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase() as ChatProviderId;
    if (ALL.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

/** Providers that will actually be tried, in order. */
export function activeChatProviderIds(): ChatProviderId[] {
  return (chatProviderAllowlist() ?? ALL).filter(isConfigured);
}
