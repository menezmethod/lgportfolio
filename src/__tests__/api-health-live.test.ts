import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/live/route";

describe("/api/health/live", () => {
  it("returns 200 without probing external dependencies", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });
});
