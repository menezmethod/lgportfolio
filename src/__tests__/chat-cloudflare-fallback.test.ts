import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockStreamText } = vi.hoisted(() => ({ mockStreamText: vi.fn() }));
vi.mock("ai", () => ({ streamText: mockStreamText }));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => ({ chat: vi.fn((model: string) => `model:${model}`) })),
}));

import { buildChatProviderChain, streamChatWithFallbacks } from "@/lib/chat-providers";
import { modelFamily } from "@/lib/model-label";

const M70 = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const M8 = "@cf/meta/llama-3.1-8b-instruct-fast";
const params = { system: "s", messages: [{ role: "user" as const, content: "hi" }] };

const fast = (t = "ok") => ({
  textStream: (async function* () { yield t; })(),
  toTextStreamResponse: vi.fn(),
});
const stalled = () => ({
  textStream: (async function* () { await new Promise(() => {}); })(),
  toTextStreamResponse: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CLOUDFLARE_RAG_KEY", "k");
  vi.stubEnv("CHAT_PROVIDERS", "cloudflare");
  vi.stubEnv("INFERENCIA_API_KEY", "");
  vi.stubEnv("OPENROUTER_API_KEY", "");
  vi.stubEnv("CLOUDFLARE_CHAT_MODELS", "");
  vi.stubEnv("CLOUDFLARE_CHAT_MODEL", "");
  vi.stubEnv("CLOUDFLARE_FAST_FAIL_MS", "");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

const after = (ms: number, text = "ok") => ({
  textStream: (async function* () { await new Promise((r) => setTimeout(r, ms)); yield text; })(),
  toTextStreamResponse: vi.fn(),
});

describe("Workers AI hedging", () => {
  it("70B stalls past 1.5 s: the 8B starts in parallel and answers; total about 1.5 s; the 70B is aborted", async () => {
    vi.useFakeTimers();
    mockStreamText.mockReturnValueOnce(stalled()).mockReturnValueOnce(fast("from 8b"));
    const t0 = Date.now();
    const p = streamChatWithFallbacks(params);
    await vi.advanceTimersByTimeAsync(1_500);
    const r = await p;
    expect(Date.now() - t0).toBeLessThan(1_800);
    expect(r.model).toBe(M8);
    expect(r.hedged).toBe(true);
    expect(r.fallbackDelayMs).toBeGreaterThanOrEqual(1_500);
    expect(r.attemptMs).toBeLessThan(500); // span from the hedge attempt's own start
    expect(mockStreamText).toHaveBeenCalledTimes(2);
    expect(mockStreamText.mock.calls[0][0].abortSignal.aborted).toBe(true); // loser cancelled upstream
    expect(mockStreamText.mock.calls[1][0].abortSignal.aborted).toBe(false);
  });

  it("the 70B still wins when its first token arrives after the hedge started; the 8B is aborted", async () => {
    vi.useFakeTimers();
    mockStreamText.mockReturnValueOnce(after(3_100, "from 70b")).mockReturnValueOnce(stalled());
    const p = streamChatWithFallbacks(params);
    await vi.advanceTimersByTimeAsync(3_100);
    const r = await p;
    expect(r.model).toBe(M70);
    expect(r.hedged).toBe(true); // the hedge fired even though the primary won
    expect(r.attemptMs).toBeGreaterThanOrEqual(3_100);
    expect(mockStreamText.mock.calls[1][0].abortSignal.aborted).toBe(true);
    expect(mockStreamText.mock.calls[0][0].abortSignal.aborted).toBe(false);
  });

  it("both stall: each is abandoned at its own backstop (70B 3.5 s, 8B 20 s) and the error is clean", async () => {
    vi.useFakeTimers();
    mockStreamText.mockReturnValue(stalled());
    const p = streamChatWithFallbacks(params);
    const settled = p.then(() => "ok", (e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(3_500);
    expect(mockStreamText.mock.calls[0][0].abortSignal.aborted).toBe(true); // 70B backstop
    expect(mockStreamText.mock.calls[1][0].abortSignal.aborted).toBe(false); // 8B still allowed to answer
    await vi.advanceTimersByTimeAsync(20_000);
    expect(await settled).toMatch(/^All chat providers failed: Inference timeout/);
    expect(mockStreamText.mock.calls[1][0].abortSignal.aborted).toBe(true);
    expect(mockStreamText).toHaveBeenCalledTimes(2);
  });

  it("if the 70B fails fast (before the hedge delay) the 8B runs sequentially, not hedged", async () => {
    mockStreamText
      .mockReturnValueOnce({ textStream: (async function* () { throw new Error("502"); })(), toTextStreamResponse: vi.fn() })
      .mockReturnValueOnce(fast("from 8b"));
    const r = await streamChatWithFallbacks(params);
    expect(r.model).toBe(M8);
    expect(r.hedged).toBe(false);
  });

  it("CLOUDFLARE_HEDGE_MS overrides the delay; 0 disables hedging (sequential after the 70B deadline)", async () => {
    vi.useFakeTimers();
    vi.stubEnv("CLOUDFLARE_HEDGE_MS", "500");
    mockStreamText.mockReturnValueOnce(stalled()).mockReturnValueOnce(fast("8b"));
    let p = streamChatWithFallbacks(params);
    await vi.advanceTimersByTimeAsync(500);
    expect((await p).hedged).toBe(true);

    mockStreamText.mockReset();
    vi.stubEnv("CLOUDFLARE_HEDGE_MS", "0");
    mockStreamText.mockReturnValueOnce(stalled()).mockReturnValueOnce(fast("8b"));
    p = streamChatWithFallbacks(params);
    await vi.advanceTimersByTimeAsync(1_500);
    expect(mockStreamText).toHaveBeenCalledTimes(1); // no hedge
    await vi.advanceTimersByTimeAsync(2_000);
    const r = await p;
    expect(r.model).toBe(M8);
    expect(r.hedged).toBe(false);
  });
});

describe("Workers AI ordered models with a first-token deadline", () => {
  it("default list is 70B then 8B; 70B gets 3.5 s, the last model gets 20 s", () => {
    const chain = buildChatProviderChain();
    expect(chain.map((c) => c.model)).toEqual([M70, M8]);
    expect(chain.map((c) => c.timeoutMs)).toEqual([3_500, 20_000]);
  });

  it("a fast 70B does not fire the hedge: the 8B is never started", async () => {
    mockStreamText.mockReturnValueOnce(fast());
    const r = await streamChatWithFallbacks(params);
    expect(r.model).toBe(M70);
    expect(r.hedged).toBe(false);
    expect(mockStreamText).toHaveBeenCalledTimes(1);
    expect(r.fallbackDelayMs).toBeLessThan(100);
  });

  it("all models failing gives the existing clean error", async () => {
    mockStreamText.mockImplementation(() => ({
      textStream: (async function* () { throw new Error("boom"); })(),
      toTextStreamResponse: vi.fn(),
    }));
    await expect(streamChatWithFallbacks(params)).rejects.toThrow("All chat providers failed: boom");
    expect(mockStreamText).toHaveBeenCalledTimes(2);
  });

  it("CLOUDFLARE_CHAT_MODELS, legacy CLOUDFLARE_CHAT_MODEL and CLOUDFLARE_FAST_FAIL_MS are honored", () => {
    vi.stubEnv("CLOUDFLARE_CHAT_MODELS", "@cf/a/one-1b, @cf/b/two-2b,@cf/c/three-3b");
    vi.stubEnv("CLOUDFLARE_FAST_FAIL_MS", "2500");
    let chain = buildChatProviderChain();
    expect(chain.map((c) => c.model)).toEqual(["@cf/a/one-1b", "@cf/b/two-2b", "@cf/c/three-3b"]);
    expect(chain.map((c) => c.timeoutMs)).toEqual([2_500, 2_500, 20_000]);
    vi.stubEnv("CLOUDFLARE_CHAT_MODEL", "@cf/b/two-2b");
    chain = buildChatProviderChain();
    expect(chain.map((c) => c.model)).toEqual(["@cf/b/two-2b", "@cf/a/one-1b", "@cf/c/three-3b"]);
    vi.stubEnv("CLOUDFLARE_CHAT_MODELS", "");
    vi.stubEnv("CLOUDFLARE_CHAT_MODEL", "@cf/x/legacy-9b");
    expect(buildChatProviderChain().map((c) => c.model)).toEqual(["@cf/x/legacy-9b", M70, M8]);
  });

  it("names the model family truthfully", () => {
    expect(modelFamily(M8)).toBe("llama 3.1 8B");
    expect(modelFamily(M70)).toBe("llama 3.3 70B");
  });
});
