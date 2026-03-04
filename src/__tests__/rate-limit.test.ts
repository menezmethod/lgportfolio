import { describe, it, expect } from "vitest";
import {
  checkRateLimit,
  getCachedResponse,
  isDailyBudgetExhausted,
  incrementDailyCount,
  isSessionLimitReached,
} from "@/lib/rate-limit";

describe("rate-limit", () => {
  describe("checkRateLimit", () => {
    it("allows first request and decrements remaining", () => {
      const r = checkRateLimit("1.2.3.4");
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBeLessThanOrEqual(1);
    });

    it("allows then denies when window exhausted", () => {
      const ip = "10.0.0.1";
      checkRateLimit(ip);
      const second = checkRateLimit(ip);
      expect(second.allowed).toBe(true);
      // Exhaust the window
      for (let i = 0; i < 5; i++) checkRateLimit(ip);
      const denied = checkRateLimit(ip);
      expect(denied.allowed).toBe(false);
      expect(denied.message).toBeDefined();
    });
  });

  describe("getCachedResponse", () => {
    it("returns cached response for known query", async () => {
      const out = await getCachedResponse("tell me about luis");
      expect(out).toBeTruthy();
      expect(out).toContain("Luis Gimenez");
      expect(out).toContain("Software Engineer II");
    });

    it("returns null for unknown query", async () => {
      const out = await getCachedResponse("xyznonexistent123");
      expect(out).toBeNull();
    });

    it("normalizes query (trim, lowercase)", async () => {
      const out = await getCachedResponse("  TELL ME ABOUT LUIS  ");
      expect(out).toBeTruthy();
    });
  });

  describe("isDailyBudgetExhausted", () => {
    it("returns false when no count yet (new day)", () => {
      expect(isDailyBudgetExhausted()).toBe(false);
    });
  });

  describe("incrementDailyCount + isDailyBudgetExhausted", () => {
    it("exhausts after budget (150 default)", () => {
      // Increment 150 times (same calendar day in test)
      for (let i = 0; i < 150; i++) incrementDailyCount();
      expect(isDailyBudgetExhausted()).toBe(true);
    });
  });

  describe("isSessionLimitReached", () => {
    it("returns boolean", () => {
      const r = isSessionLimitReached();
      expect(typeof r).toBe("boolean");
    });
  });
});
