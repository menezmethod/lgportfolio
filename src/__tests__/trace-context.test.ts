import { describe, it, expect } from "vitest";
import { getTraceIdFromRequest } from "@/lib/trace-context";

describe("trace-context", () => {
  describe("getTraceIdFromRequest", () => {
    it("extracts trace ID from X-Cloud-Trace-Context header", () => {
      const req = new Request("https://test.com", {
        headers: { "x-cloud-trace-context": "abc123def456/1234567890;o=1" },
      });
      expect(getTraceIdFromRequest(req)).toBe("abc123def456");
    });

    it("extracts trace ID when X-Cloud-Trace-Context has no span or options", () => {
      const req = new Request("https://test.com", {
        headers: { "x-cloud-trace-context": "trace-id-only" },
      });
      expect(getTraceIdFromRequest(req)).toBe("trace-id-only");
    });

    it("extracts trace ID from W3C traceparent header", () => {
      const req = new Request("https://test.com", {
        headers: { traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" },
      });
      expect(getTraceIdFromRequest(req)).toBe("4bf92f3577b34da6a3ce929d0e0e4736");
    });

    it("prefers X-Cloud-Trace-Context over traceparent when both present", () => {
      const req = new Request("https://test.com", {
        headers: {
          "x-cloud-trace-context": "cloud-trace-id/span;o=1",
          traceparent: "00-w3c-trace-id-span-01",
        },
      });
      expect(getTraceIdFromRequest(req)).toBe("cloud-trace-id");
    });

    it("returns null when no trace headers are present", () => {
      const req = new Request("https://test.com");
      expect(getTraceIdFromRequest(req)).toBeNull();
    });

    it("returns null for empty X-Cloud-Trace-Context value", () => {
      const req = new Request("https://test.com", {
        headers: { "x-cloud-trace-context": "" },
      });
      expect(getTraceIdFromRequest(req)).toBeNull();
    });

    it("handles traceparent with only version and trace ID", () => {
      const req = new Request("https://test.com", {
        headers: { traceparent: "00-abcdef1234567890" },
      });
      expect(getTraceIdFromRequest(req)).toBe("abcdef1234567890");
    });

    it("trims whitespace from extracted trace ID", () => {
      const req = new Request("https://test.com", {
        headers: { "x-cloud-trace-context": "  trace-with-spaces  /span;o=1" },
      });
      expect(getTraceIdFromRequest(req)).toBe("trace-with-spaces");
    });
  });
});
