import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { probeInferenciaHealth, resetInferenciaHealthCache } from "@/lib/inferencia-health";

const originalFetch = global.fetch;

beforeEach(() => {
  resetInferenciaHealthCache();
  vi.stubEnv("INFERENCIA_API_KEY", "test-key");
  vi.stubEnv("INFERENCIA_BASE_URL", "https://llm.example.com/v1");
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
  resetInferenciaHealthCache();
});

describe("probeInferenciaHealth", () => {
  it("returns degraded when INFERENCIA_API_KEY is missing", async () => {
    delete process.env.INFERENCIA_API_KEY;
    const result = await probeInferenciaHealth();
    expect(result.status).toBe("degraded");
  });

  it("returns up when Inferencia /health responds healthy", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "healthy" }),
    } as Response);

    const result = await probeInferenciaHealth();
    expect(result.status).toBe("up");
    expect(result.latency_ms).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://llm.example.com/health",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("returns down when Inferencia /health is unreachable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const result = await probeInferenciaHealth();
    expect(result.status).toBe("down");
  });
});
