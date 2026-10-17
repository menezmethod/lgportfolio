import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { KNOWLEDGE_BASE } from "@/lib/knowledge";
import { isCurrentChunk, resetRetrievalCache } from "@/lib/rag";

/** A real sentence from the current knowledge base. */
const CURRENT = KNOWLEDGE_BASE.split("\n").find((l) => l.startsWith("- Alert quality:"))!.trim();

const originalFetch = global.fetch;

function workerResponse(matches: unknown[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ matches }),
  } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  resetRetrievalCache();
  vi.stubEnv("CLOUDFLARE_RAG_KEY", "test-key");
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

import { isCloudflareRagConfigured, retrieveContext, retrieveFileContext } from "@/lib/rag";

describe("rag", () => {
  describe("configuration", () => {
    it("is configured when the worker key is set", () => {
      expect(isCloudflareRagConfigured()).toBe(true);
    });

    it("is not configured without the worker key", () => {
      vi.unstubAllEnvs();
      expect(isCloudflareRagConfigured()).toBe(false);
    });
  });

  describe("retrieveContext", () => {
    it("returns worker matches (plus behavior rules) when configured", async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        workerResponse([
          { score: 0.62, source: "knowledge", content: CURRENT },
          { score: 0.3, source: "knowledge", content: "below-threshold chunk" },
        ])
      );

      const result = await retrieveContext("What does Luis do at Home Depot?");

      expect(result).toContain(CURRENT);
      expect(result).toContain("SECTION 9");
      expect(result).not.toContain("below-threshold");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/retrieve"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "x-rag-key": "test-key" }),
          body: expect.stringContaining("What does Luis do at Home Depot?"),
        })
      );
    });

    it("uses file context for low-signal queries even when Cloudflare is configured", async () => {
      const result = await retrieveContext("hi there");
      expect(result).toBe(retrieveFileContext("hi there", 5));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("falls back to file context when no matches clear the threshold", async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        workerResponse([{ score: 0.3, source: "knowledge", content: "weak match" }])
      );

      const result = await retrieveContext("payments observability grafana");
      expect(result).toBe(retrieveFileContext("payments observability grafana", 5));
    });

    it("falls back to file context when the worker call fails", async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

      const result = await retrieveContext("payments observability grafana");
      expect(result).toBe(retrieveFileContext("payments observability grafana", 5));
    });

    it("falls back to file context when Cloudflare is not configured", async () => {
      vi.unstubAllEnvs();

      const result = await retrieveContext("payments observability grafana");
      expect(result).toBe(retrieveFileContext("payments observability grafana", 5));
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("retrieveFileContext", () => {
    it("returns a smaller greeting context for low-signal queries", async () => {
      const { KNOWLEDGE_BASE } = await import("@/lib/knowledge");
      const greeting = retrieveFileContext("hi there", 3);
      const broad = retrieveFileContext("payments observability grafana broker", 3);
      expect(greeting.length).toBeGreaterThan(500);
      expect(greeting.length).toBeLessThan(KNOWLEDGE_BASE.length);
      expect(greeting.length).toBeLessThan(broad.length);
      expect(greeting).toMatch(/SECTION 1/i);
      expect(greeting).toMatch(/SECTION 9/i);
      expect(greeting).toMatch(/Who Is Luis Gimenez/i);
    });
  });

  describe("stale vector chunks", () => {
    it("treats text still in the knowledge base as current and old text as stale", () => {
      expect(isCurrentChunk(CURRENT)).toBe(true);
      expect(isCurrentChunk("  " + CURRENT.replace(/ /g, "  ") + "\n")).toBe(true);
      expect(isCurrentChunk("A sentence that was removed from the knowledge base long ago.")).toBe(false);
    });

    it("falls back to file retrieval when every vector match is stale", async () => {
      vi.mocked(global.fetch).mockResolvedValue(
        workerResponse([{ score: 0.9, source: "knowledge", content: "Old removed claim about something else entirely." }])
      );
      const result = await retrieveContext("What does Luis do at Home Depot?");
      expect(result).not.toContain("Old removed claim");
      expect(result).toContain("SECTION");
    });
  });
});
