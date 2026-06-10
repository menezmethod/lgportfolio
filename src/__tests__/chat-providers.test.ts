import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockStreamText } = vi.hoisted(() => ({
  mockStreamText: vi.fn(),
}));

vi.mock("ai", () => ({
  streamText: mockStreamText,
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => ({ chat: vi.fn((model: string) => `model:${model}`) })),
}));

import {
  OPENROUTER_FREE_FALLBACK_MODELS,
  buildChatProviderChain,
  isChatConfigured,
  isInferenciaConfigured,
  isOpenRouterConfigured,
  streamChatWithFallbacks,
} from "@/lib/chat-providers";

beforeEach(() => {
  vi.clearAllMocks();
  mockStreamText.mockResolvedValue({ toTextStreamResponse: vi.fn() });
  vi.stubEnv("INFERENCIA_API_KEY", "inf-key");
  vi.stubEnv("INFERENCIA_BASE_URL", "https://inferencia.test/v1");
  vi.stubEnv("INFERENCIA_CHAT_MODEL", "gemma4:e4b");
  vi.stubEnv("OPENROUTER_API_KEY", "or-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("chat-providers", () => {
  it("detects configured providers", () => {
    expect(isInferenciaConfigured()).toBe(true);
    expect(isOpenRouterConfigured()).toBe(true);
    expect(isChatConfigured()).toBe(true);
  });

  it("builds inferencia first then openrouter fallbacks", () => {
    const chain = buildChatProviderChain();
    expect(chain[0].id).toBe("inferencia");
    expect(chain[0].model).toBe("gemma4:e4b");
    expect(chain[1].id).toBe("openrouter");
    expect(chain[1].model).toBe(OPENROUTER_FREE_FALLBACK_MODELS[0]);
    expect(chain.length).toBe(1 + OPENROUTER_FREE_FALLBACK_MODELS.length);
  });

  it("uses only openrouter when inferencia is unset", () => {
    delete process.env.INFERENCIA_API_KEY;
    const chain = buildChatProviderChain();
    expect(chain.every((p) => p.id === "openrouter")).toBe(true);
    expect(isChatConfigured()).toBe(true);
  });

  it("falls back to openrouter when inferencia fails", async () => {
    mockStreamText
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce({ toTextStreamResponse: vi.fn() });

    const fallbacks: string[] = [];
    const result = await streamChatWithFallbacks(
      { system: "sys", messages: [{ role: "user", content: "hi" }] },
      { onFallback: (p) => fallbacks.push(p.model) }
    );

    expect(mockStreamText).toHaveBeenCalledTimes(2);
    expect(fallbacks).toContain("gemma4:e4b");
    expect(result.provider).toBe("openrouter");
  });

  it("throws when all providers fail", async () => {
    mockStreamText.mockRejectedValue(new Error("down"));
    await expect(
      streamChatWithFallbacks({ system: "sys", messages: [{ role: "user", content: "hi" }] })
    ).rejects.toThrow(/All chat providers failed/);
  });
});
