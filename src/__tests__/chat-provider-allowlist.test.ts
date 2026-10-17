import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("ai", () => ({ streamText: vi.fn() }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: vi.fn(() => ({ chat: vi.fn() })) }));

import { buildChatProviderChain, isChatConfigured } from "@/lib/chat-providers";
import { getHealthData } from "@/lib/telemetry";

const ids = () => [...new Set(buildChatProviderChain().map((p) => p.id))];

beforeEach(() => {
  vi.stubEnv("INFERENCIA_API_KEY", "k");
  vi.stubEnv("INFERENCIA_BASE_URL", "https://inf.test/v1");
  vi.stubEnv("OPENROUTER_API_KEY", "k");
  vi.stubEnv("CLOUDFLARE_RAG_KEY", "k");
  vi.stubEnv("CHAT_PROVIDERS", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("CHAT_PROVIDERS allowlist", () => {
  it("unset keeps the legacy order", () => {
    expect(ids()).toEqual(["inferencia", "openrouter", "cloudflare"]);
  });
  it("only listed providers are used even when others are configured", () => {
    vi.stubEnv("CHAT_PROVIDERS", "cloudflare");
    expect(ids()).toEqual(["cloudflare"]);
  });
  it("honors the listed order", () => {
    vi.stubEnv("CHAT_PROVIDERS", "cloudflare, openrouter");
    expect(ids()).toEqual(["cloudflare", "openrouter"]);
  });
  it("skips a listed provider that is not configured; unknown names ignored", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("CHAT_PROVIDERS", "openrouter,bogus,cloudflare");
    expect(ids()).toEqual(["cloudflare"]);
  });
  it("chat is unconfigured when the allowlist matches nothing configured", () => {
    vi.stubEnv("CLOUDFLARE_RAG_KEY", "");
    vi.stubEnv("CHAT_PROVIDERS", "cloudflare");
    expect(isChatConfigured()).toBe(false);
  });
  it("health reports the real chain and ignores providers outside it", () => {
    vi.stubEnv("CHAT_PROVIDERS", "cloudflare");
    expect(getHealthData(undefined, { shallow: true }).chat_providers).toEqual(["cloudflare"]);
    vi.stubEnv("CLOUDFLARE_RAG_KEY", "");
    const h = getHealthData(undefined, { shallow: true });
    expect(h.chat_providers).toEqual([]);
    expect(h.checks.inference_api.status).toBe("degraded");
  });
});
