import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Cloud Logging
vi.mock("@google-cloud/logging", () => ({
  Logging: vi.fn(() => ({
    getEntries: vi.fn().mockResolvedValue([
      [
        {
          metadata: {
            timestamp: "2026-03-03T00:00:00Z",
            severity: "INFO",
            jsonPayload: { message: "test log", endpoint: "/api/chat" },
          },
        },
      ],
    ]),
  })),
}));

// Mock Firestore
vi.mock("@/lib/firestore", () => ({
  listSessions: vi.fn().mockResolvedValue([]),
  getSessionWithMemory: vi.fn().mockResolvedValue({ session: null, messages: [] }),
  getBoardStats: vi.fn().mockResolvedValue({ sessions_last_n_days: 0, sessions_with_email: 0 }),
}));

import { GET as getAdminLogs } from "@/app/api/admin/logs/route";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.stubEnv("ADMIN_SECRET", "test-secret-123");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function makeAdminRequest(url: string, secret?: string) {
  const headers: Record<string, string> = {};
  if (secret) headers["x-admin-secret"] = secret;
  return new Request(url, { headers });
}

describe("admin auth", () => {
  it("returns 401 when x-admin-secret header is missing", async () => {
    const response = await getAdminLogs(
      makeAdminRequest("https://localhost:3000/api/admin/logs")
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 when x-admin-secret header has wrong value", async () => {
    const response = await getAdminLogs(
      makeAdminRequest("https://localhost:3000/api/admin/logs", "wrong-secret")
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 when ADMIN_SECRET env var is not set", async () => {
    delete process.env.ADMIN_SECRET;
    const response = await getAdminLogs(
      makeAdminRequest("https://localhost:3000/api/admin/logs", "any-secret")
    );
    expect(response.status).toBe(401);
  });

  it("accepts valid x-admin-secret header", async () => {
    const response = await getAdminLogs(
      makeAdminRequest("https://localhost:3000/api/admin/logs", "test-secret-123")
    );
    // Should NOT be 401 (either 200 or other status depending on config)
    expect(response.status).not.toBe(401);
  });

  it("accepts valid Bearer token in Authorization header", async () => {
    const req = new Request("https://localhost:3000/api/admin/logs", {
      headers: { Authorization: "Bearer test-secret-123" },
    });
    const response = await getAdminLogs(req);
    expect(response.status).not.toBe(401);
  });
});

describe("/api/admin/logs", () => {
  it("returns entries array on valid auth", async () => {
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project");
    const response = await getAdminLogs(
      makeAdminRequest("https://localhost:3000/api/admin/logs", "test-secret-123")
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("entries");
    expect(Array.isArray(body.entries)).toBe(true);
  });

  it("returns { error, entries: [] } when GOOGLE_CLOUD_PROJECT is not set", async () => {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    const response = await getAdminLogs(
      makeAdminRequest("https://localhost:3000/api/admin/logs", "test-secret-123")
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.error).toContain("not configured");
    expect(body.entries).toEqual([]);
  });

  it("extracts message from entries", async () => {
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project");
    const response = await getAdminLogs(
      makeAdminRequest("https://localhost:3000/api/admin/logs", "test-secret-123")
    );
    const body = await response.json();
    if (body.entries.length > 0) {
      expect(body.entries[0]).toHaveProperty("message");
      expect(body.entries[0]).toHaveProperty("timestamp");
      expect(body.entries[0]).toHaveProperty("severity");
    }
  });
});
