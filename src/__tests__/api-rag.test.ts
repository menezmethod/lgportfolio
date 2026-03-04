import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock rag module before importing route
vi.mock("@/lib/rag", () => ({
  retrieveContext: vi.fn().mockResolvedValue("Mock RAG context about Luis Gimenez's experience"),
}));

import { POST } from "@/app/api/rag/route";
import { retrieveContext } from "@/lib/rag";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  // Re-establish the mock return value after clearAllMocks
  vi.mocked(retrieveContext).mockResolvedValue("Mock RAG context about Luis Gimenez's experience");
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(body: unknown) {
  return new NextRequest("https://localhost:3000/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/rag", () => {
  it("returns 400 when query is missing from body", async () => {
    const response = await POST(makeRequest({}));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("required");
  });

  it("returns 200 with context and source on valid query", async () => {
    const response = await POST(makeRequest({ query: "What does Luis do?" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("context");
    expect(body).toHaveProperty("source");
    expect(retrieveContext).toHaveBeenCalledWith("What does Luis do?", 5);
  });

  it("returns source: 'fallback' when CLOUD_SQL_CONNECTION_NAME is not set", async () => {
    delete process.env.CLOUD_SQL_CONNECTION_NAME;
    const response = await POST(makeRequest({ query: "test query" }));
    const body = await response.json();
    expect(body.source).toBe("fallback");
  });

  it("returns X-Cache: MISS on first request for a query", async () => {
    const uniqueQuery = `unique-query-${Date.now()}`;
    const response = await POST(makeRequest({ query: uniqueQuery }));
    expect(response.headers.get("X-Cache")).toBe("MISS");
  });

  it("returns X-Cache: HIT on second request for same query within TTL", async () => {
    const uniqueQuery = `cache-test-${Date.now()}`;
    await POST(makeRequest({ query: uniqueQuery }));

    // Second request should hit cache
    const response2 = await POST(makeRequest({ query: uniqueQuery }));
    expect(response2.headers.get("X-Cache")).toBe("HIT");
  });

  it("returns 500 when retrieveContext throws", async () => {
    vi.mocked(retrieveContext).mockRejectedValueOnce(new Error("DB error"));
    const response = await POST(makeRequest({ query: "error query" }));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain("Failed");
  });
});
