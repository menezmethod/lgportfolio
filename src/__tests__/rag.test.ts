import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock pg Pool before importing rag module
const mockQuery = vi.fn();
vi.mock("pg", () => ({
  Pool: vi.fn(() => ({
    query: mockQuery,
  })),
}));

// Save original fetch
const originalFetch = global.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

// Import AFTER mocks — rag.ts reads env vars at module scope
// Since env vars are read at module load time, Cloud SQL path requires resetModules
import { generateEmbedding } from "@/lib/rag";

describe("rag", () => {
  describe("generateEmbedding", () => {
    it("calls Google Generative Language API with correct URL and body", async () => {
      vi.stubEnv("GOOGLE_API_KEY", "test-api-key");

      const mockResponse = {
        ok: true,
        json: async () => ({
          embedding: { values: Array(768).fill(0.1) },
        }),
      };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      await generateEmbedding("test query");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("text-embedding-004:embedContent?key=test-api-key"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("test query"),
        })
      );
    });

    it("returns embedding values array on success", async () => {
      vi.stubEnv("GOOGLE_API_KEY", "test-api-key");

      const values = Array(768).fill(0.5);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ embedding: { values } }),
      } as Response);

      const result = await generateEmbedding("test");
      expect(result).toEqual(values);
      expect(result).toHaveLength(768);
    });

    it("throws when GOOGLE_API_KEY is not set", async () => {
      delete process.env.GOOGLE_API_KEY;

      await expect(generateEmbedding("test")).rejects.toThrow(
        "GOOGLE_API_KEY not configured"
      );
    });

    it("throws when API returns non-OK response", async () => {
      vi.stubEnv("GOOGLE_API_KEY", "test-api-key");

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        statusText: "Bad Request",
      } as Response);

      await expect(generateEmbedding("test")).rejects.toThrow(
        "Embedding generation failed"
      );
    });

    it("returns empty array when embedding.values is missing", async () => {
      vi.stubEnv("GOOGLE_API_KEY", "test-api-key");

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ embedding: {} }),
      } as Response);

      const result = await generateEmbedding("test");
      expect(result).toEqual([]);
    });
  });

  // Test retrieveContext in a separate describe that uses dynamic import
  // so we can control the Cloud SQL env vars before module loads
  describe("retrieveContext", () => {
    it("returns a focused file context when Cloud SQL env vars are missing", async () => {
      const { retrieveContext, retrieveFileContext } = await import("@/lib/rag");
      const full = retrieveFileContext("payments observability grafana", 5);
      const result = await retrieveContext("payments observability grafana");
      expect(result.length).toBeGreaterThan(100);
      expect(result.length).toBeLessThan(35000);
      expect(result).toBe(full);
    });

    it("returns a smaller greeting context for low-signal queries", async () => {
      const { retrieveFileContext } = await import("@/lib/rag");
      const { KNOWLEDGE_BASE } = await import("@/lib/knowledge");
      const greeting = retrieveFileContext("hi there", 3);
      const broad = retrieveFileContext("payments observability grafana card broker", 3);
      expect(greeting.length).toBeGreaterThan(500);
      expect(greeting.length).toBeLessThan(KNOWLEDGE_BASE.length);
      expect(greeting.length).toBeLessThan(broad.length);
      expect(greeting).toMatch(/SECTION 1/i);
      expect(greeting).toMatch(/SECTION 9/i);
      expect(greeting).toMatch(/Who Is Luis Gimenez/i);
    });
  });
});
