import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("/api/health", () => {
  it("returns 200 with JSON body", async () => {
    const req = new Request("https://localhost:3000/api/health");
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toBeDefined();
  });

  it("response matches HealthData shape", async () => {
    const req = new Request("https://localhost:3000/api/health");
    const response = await GET(req);
    const body = await response.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("uptime_seconds");
    expect(body).toHaveProperty("checks");
    expect(body).toHaveProperty("version");
    expect(body).toHaveProperty("region");
  });

  it("returns 'healthy' status when INFERENCIA_API_KEY is set", async () => {
    vi.stubEnv("INFERENCIA_API_KEY", "test-key");
    const req = new Request("https://localhost:3000/api/health");
    const response = await GET(req);
    const body = await response.json();
    expect(body.status).toBe("healthy");
  });

  it("returns 'degraded' status when INFERENCIA_API_KEY is missing", async () => {
    delete process.env.INFERENCIA_API_KEY;
    const req = new Request("https://localhost:3000/api/health");
    const response = await GET(req);
    const body = await response.json();
    expect(body.status).toBe("degraded");
  });

  it("includes Cache-Control: no-store header", async () => {
    const req = new Request("https://localhost:3000/api/health");
    const response = await GET(req);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("includes X-Content-Type-Options: nosniff header", async () => {
    const req = new Request("https://localhost:3000/api/health");
    const response = await GET(req);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
