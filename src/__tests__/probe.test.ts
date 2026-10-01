import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { probeWorkerRetrieval, isCloudflareRagConfigured, streamChatWithFallbacks, buildChatProviderChain, getDailyBudgetStats, incrementDailyCount } = vi.hoisted(() => ({
  probeWorkerRetrieval: vi.fn(),
  isCloudflareRagConfigured: vi.fn(),
  streamChatWithFallbacks: vi.fn(),
  buildChatProviderChain: vi.fn(),
  getDailyBudgetStats: vi.fn(),
  incrementDailyCount: vi.fn(),
}));

vi.mock("@/lib/rag", () => ({ probeWorkerRetrieval, isCloudflareRagConfigured }));
vi.mock("@/lib/chat-providers", () => ({ buildChatProviderChain, streamChatWithFallbacks }));
vi.mock("@/lib/rate-limit", () => ({ getDailyBudgetStats, incrementDailyCount }));

import { getProbeState, maybeRunProbes, resetProbes } from "@/lib/probe";

const tick = () => new Promise((r) => setTimeout(r, 10));

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  resetProbes();
  probeWorkerRetrieval.mockReset().mockResolvedValue(123);
  isCloudflareRagConfigured.mockReset().mockReturnValue(true);
  buildChatProviderChain.mockReset().mockReturnValue([{ id: "cloudflare" }]);
  getDailyBudgetStats.mockReset().mockReturnValue({ used: 0, remaining: 150, max: 150 });
  incrementDailyCount.mockReset();
  streamChatWithFallbacks.mockReset().mockResolvedValue({
    result: { toTextStreamResponse: () => new Response("ok") },
    provider: "cloudflare",
    model: "m",
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("trace probes", () => {
  it("runs one retrieval probe and one inference probe, records real samples, counts the budget", async () => {
    maybeRunProbes();
    await tick();
    const s = getProbeState();
    expect(s.rag?.ms).toBe(123);
    expect(s.inference?.ms).toBeGreaterThanOrEqual(0);
    expect(probeWorkerRetrieval).toHaveBeenCalledTimes(1);
    expect(streamChatWithFallbacks).toHaveBeenCalledTimes(1);
    expect(incrementDailyCount).toHaveBeenCalledTimes(1);
    expect(streamChatWithFallbacks.mock.calls[0][0].maxOutputTokens).toBeLessThanOrEqual(8);
  });

  it("does not loop: a second call right away starts nothing", async () => {
    maybeRunProbes();
    await tick();
    maybeRunProbes();
    await tick();
    expect(probeWorkerRetrieval).toHaveBeenCalledTimes(1);
    expect(streamChatWithFallbacks).toHaveBeenCalledTimes(1);
  });

  it("does nothing when providers are not configured", async () => {
    isCloudflareRagConfigured.mockReturnValue(false);
    buildChatProviderChain.mockReturnValue([]);
    maybeRunProbes();
    await tick();
    expect(probeWorkerRetrieval).not.toHaveBeenCalled();
    expect(streamChatWithFallbacks).not.toHaveBeenCalled();
    expect(getProbeState().rag).toBeNull();
  });

  it("skips the inference probe when the daily budget is low", async () => {
    getDailyBudgetStats.mockReturnValue({ used: 140, remaining: 10, max: 150 });
    maybeRunProbes();
    await tick();
    expect(streamChatWithFallbacks).not.toHaveBeenCalled();
    expect(incrementDailyCount).not.toHaveBeenCalled();
  });

  it("fails silently and records no invented sample", async () => {
    probeWorkerRetrieval.mockResolvedValue(null);
    streamChatWithFallbacks.mockRejectedValue(new Error("provider down"));
    expect(() => maybeRunProbes()).not.toThrow();
    await tick();
    const s = getProbeState();
    expect(s.rag).toBeNull();
    expect(s.inference).toBeNull();
  });
});
