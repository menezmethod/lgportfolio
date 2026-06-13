import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { probeInferenciaHealth, resetInferenciaHealthCache } from "@/lib/inferencia-health";

const originalFetch = global.fetch;

beforeEach(() => {
  resetInferenciaHealthCache();
  vi.stubEnv("INFERENCIA_API_KEY", "test-key");
  vi.stubEnv("INFERENCIA_BASE_URL", "https://llm.example.com/v1");
  vi.stubEnv("INFERENCIA_CHAT_MODEL", "gemma4:12b");
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

  it("returns up when /health and authenticated /v1/models succeed", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).endsWith("/health")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "healthy",
            services: { ollama: { models: [{ id: "gemma4:12b" }] } },
          }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) } as Response);
    });

    const result = await probeInferenciaHealth();
    expect(result.status).toBe("up");
    expect(result.model).toBe("gemma4:12b");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns down when API key is rejected on /v1/models", async () => {
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (String(url).endsWith("/health")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: "healthy",
            services: { ollama: { models: [{ id: "gemma4:12b" }] } },
          }),
        } as Response);
      }
      expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
      return Promise.resolve({ ok: false, json: async () => ({}) } as Response);
    });

    const result = await probeInferenciaHealth();
    expect(result.status).toBe("down");
  });

  it("returns down when configured model is not loaded in Ollama", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "healthy",
        services: { ollama: { models: [{ id: "gemma4:e4b" }] } },
      }),
    } as Response);

    const result = await probeInferenciaHealth();
    expect(result.status).toBe("down");
  });

  it("returns down when Inferencia /health is unreachable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network error"));

    const result = await probeInferenciaHealth();
    expect(result.status).toBe("down");
  });
});
