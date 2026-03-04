import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock firestore before importing route
vi.mock("@/lib/firestore", () => ({
  setRecruiterEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/chat/save-email/route";
import { setRecruiterEmail } from "@/lib/firestore";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("https://localhost:3000/api/chat/save-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/chat/save-email", () => {
  it("returns 400 when session_id is missing", async () => {
    const response = await POST(makeRequest({ email: "test@example.com" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("session_id");
  });

  it("returns 400 when session_id is empty string", async () => {
    const response = await POST(makeRequest({ session_id: "", email: "test@example.com" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const response = await POST(makeRequest({ session_id: "abc-123" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("email");
  });

  it("returns 400 when email is invalid format (no @)", async () => {
    const response = await POST(makeRequest({ session_id: "abc-123", email: "not-an-email" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when email is invalid format (no domain)", async () => {
    const response = await POST(makeRequest({ session_id: "abc-123", email: "user@" }));
    expect(response.status).toBe(400);
  });

  it("returns 200 and calls setRecruiterEmail on valid input", async () => {
    const response = await POST(
      makeRequest({ session_id: "session-123", email: "recruiter@company.com" })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(setRecruiterEmail).toHaveBeenCalledWith("session-123", "recruiter@company.com");
  });

  it("trims whitespace from email before saving", async () => {
    await POST(
      makeRequest({ session_id: "session-456", email: "  spaced@email.com  " })
    );
    expect(setRecruiterEmail).toHaveBeenCalledWith("session-456", "spaced@email.com");
  });

  it("returns 503 when setRecruiterEmail throws", async () => {
    vi.mocked(setRecruiterEmail).mockRejectedValueOnce(new Error("Firestore error"));
    const response = await POST(
      makeRequest({ session_id: "session-789", email: "test@example.com" })
    );
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toContain("Failed");
  });
});
