import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock AI SDK
const mockChat = vi.fn(() => "mock-model-ref");
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn(() => ({
    chat: mockChat,
  })),
}));

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({ text: "Mock explanation of the error" }),
}));

import { POST as explainError } from "@/app/api/war-room/explain-error/route";
import { GET as getWarRoomData } from "@/app/api/war-room/data/route";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.mocked(generateText).mockResolvedValue({ text: "Mock explanation of the error" } as Awaited<ReturnType<typeof generateText>>);
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

// ── Explain Error (Inferencia) ──────────────────────────────────────────────

describe("/api/war-room/explain-error", () => {
  describe("Inferencia configuration", () => {
    it("returns 503 when INFERENCIA_API_KEY is missing", async () => {
      delete process.env.INFERENCIA_API_KEY;
      const response = await explainError(
        makeExplainRequest({ error_text: "Some error" })
      );
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.error).toContain("not configured");
    });

    it("creates OpenAI client with correct baseURL and apiKey", async () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-inference-key");
      vi.stubEnv("INFERENCIA_BASE_URL", "https://inference.example.com/v1");

      await explainError(makeExplainRequest({ error_text: "test error" }));

      expect(createOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "https://inference.example.com/v1",
          apiKey: "test-inference-key",
        })
      );
    });

    it("calls generateText with temperature 0.3 and maxOutputTokens 300", async () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-key");

      await explainError(makeExplainRequest({ error_text: "test error" }));

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          maxOutputTokens: 300,
          maxRetries: 1,
        })
      );
    });

    it("calls generateText with system prompt containing SRE context", async () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-key");

      await explainError(makeExplainRequest({ error_text: "test error" }));

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining("DevOps/SRE"),
        })
      );
    });
  });

  describe("input validation", () => {
    it("returns 400 when error_text is missing", async () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-key");
      const response = await explainError(makeExplainRequest({}));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("error_text");
    });

    it("returns 400 when error_text is empty string", async () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-key");
      const response = await explainError(makeExplainRequest({ error_text: "" }));
      expect(response.status).toBe(400);
    });

    it("truncates error_text to 2000 chars before sending to model", async () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-key");
      const longError = "x".repeat(5000);

      await explainError(makeExplainRequest({ error_text: longError }));

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.not.stringContaining("x".repeat(2001)),
            }),
          ]),
        })
      );
    });
  });

  describe("success and error", () => {
    it("returns { explanation: string } on success", async () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-key");
      const response = await explainError(
        makeExplainRequest({ error_text: "NullPointerException at line 42" })
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty("explanation");
      expect(typeof body.explanation).toBe("string");
    });

    it("returns 503 when generateText throws", async () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-key");
      vi.mocked(generateText).mockRejectedValueOnce(new Error("Inference timeout"));

      const response = await explainError(
        makeExplainRequest({ error_text: "some error" })
      );
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.error).toBe("Explain failed");
    });
  });
});
