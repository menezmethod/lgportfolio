import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { buildChatProviderChain, streamChatWithFallbacks } = vi.hoisted(() => ({
  buildChatProviderChain: vi.fn(),
  streamChatWithFallbacks: vi.fn(),
}));
vi.mock("@/lib/chat-providers", () => ({ buildChatProviderChain, streamChatWithFallbacks }));

import { POST as explainError } from "@/app/api/war-room/explain-error/route";
import { GET as getWarRoomData } from "@/app/api/war-room/data/route";
import { checkRateLimit, isDailyBudgetExhausted } from "@/lib/rate-limit";

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    checkRateLimit: vi.fn(actual.checkRateLimit),
    isDailyBudgetExhausted: vi.fn(actual.isDailyBudgetExhausted),
    incrementDailyCount: vi.fn(actual.incrementDailyCount),
  };
});

beforeEach(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  buildChatProviderChain.mockReset().mockReturnValue([{ id: "cloudflare" }]);
  streamChatWithFallbacks.mockReset().mockResolvedValue({
    result: { toTextStreamResponse: () => new Response("Mock explanation of the error") },
    provider: "cloudflare",
    model: "m",
  });
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");
  vi.mocked(checkRateLimit).mockReturnValue({
    allowed: true,
    remaining: 5,
    resetAt: Date.now() + 60_000,
  });
  vi.mocked(isDailyBudgetExhausted).mockImplementation(actual.isDailyBudgetExhausted);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function makeExplainRequest(body: unknown) {
  return new Request("https://localhost:3000/api/war-room/explain-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── War Room Data ───────────────────────────────────────────────────────────

describe("/api/war-room/data", () => {
  it("returns 200 with WarRoomData JSON", async () => {
    const req = new Request("https://localhost:3000/api/war-room/data");
    const response = await getWarRoomData(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("service_status");
    expect(body).toHaveProperty("request_metrics");
    expect(body).toHaveProperty("slos");
  });

  it("includes all expected top-level keys", async () => {
    const req = new Request("https://localhost:3000/api/war-room/data");
    const body = await (await getWarRoomData(req)).json();
    const keys = [
      "service_status",
      "request_metrics",
      "chat_metrics",
      "infrastructure",
      "slos",
      "recent_events",
      "recent_errors",
      "timeseries",
    ];
    for (const key of keys) {
      expect(body).toHaveProperty(key);
    }
  });

  it("returns Cache-Control: public, max-age=60 (low-traffic cache TTL)", async () => {
    const req = new Request("https://localhost:3000/api/war-room/data");
    const response = await getWarRoomData(req);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
  });

  it("includes X-Content-Type-Options: nosniff", async () => {
    const req = new Request("https://localhost:3000/api/war-room/data");
    const response = await getWarRoomData(req);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

// ── Explain Error (same provider chain as chat) ─────────────────────────────

describe("/api/war-room/explain-error", () => {
  it("returns 503 when no chat provider is configured", async () => {
    buildChatProviderChain.mockReturnValue([]);
    const response = await explainError(makeExplainRequest({ error_text: "Some error" }));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("not configured");
    expect(streamChatWithFallbacks).not.toHaveBeenCalled();
  });

  it("uses the shared provider chain with the SRE system prompt, temperature 0.3, 300 tokens", async () => {
    await explainError(makeExplainRequest({ error_text: "test error" }));
    expect(streamChatWithFallbacks).toHaveBeenCalledWith(
      expect.objectContaining({ system: expect.stringContaining("DevOps/SRE"), temperature: 0.3, maxOutputTokens: 300 })
    );
  });

  it("returns 429 when the IP rate limit is exceeded", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000, message: "Rate limit reached." });
    const response = await explainError(makeExplainRequest({ error_text: "NullPointerException" }));
    expect(response.status).toBe(429);
    expect(streamChatWithFallbacks).not.toHaveBeenCalled();
  });

  it("returns 429 when the daily budget is exhausted", async () => {
    vi.mocked(isDailyBudgetExhausted).mockReturnValueOnce(true);
    const response = await explainError(makeExplainRequest({ error_text: "NullPointerException" }));
    expect(response.status).toBe(429);
    expect(streamChatWithFallbacks).not.toHaveBeenCalled();
  });

  it("returns 400 when error_text is missing or empty", async () => {
    expect((await explainError(makeExplainRequest({}))).status).toBe(400);
    expect((await explainError(makeExplainRequest({ error_text: "" }))).status).toBe(400);
  });

  it("truncates error_text to 2000 chars before sending to the model", async () => {
    await explainError(makeExplainRequest({ error_text: "x".repeat(5000) }));
    const arg = streamChatWithFallbacks.mock.calls[0][0] as { messages: Array<{ content: string }> };
    expect(arg.messages[0].content).not.toContain("x".repeat(2001));
  });

  it("returns { explanation } on success and 503 when the provider chain fails", async () => {
    const ok = await explainError(makeExplainRequest({ error_text: "NullPointerException" }));
    expect(ok.status).toBe(200);
    expect((await ok.json()).explanation).toBe("Mock explanation of the error");
    streamChatWithFallbacks.mockRejectedValueOnce(new Error("All chat providers failed"));
    const bad = await explainError(makeExplainRequest({ error_text: "some error" }));
    expect(bad.status).toBe(503);
    expect((await bad.json()).error).toBe("Explain failed");
  });
});
