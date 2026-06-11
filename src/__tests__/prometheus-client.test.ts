import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPrometheusConfigured,
  queryInstant,
  queryInstantBatch,
  checkPrometheusReachable,
} from "@/lib/prometheus-client";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  delete process.env.PROMETHEUS_URL;
  delete process.env.PROMETHEUS_BEARER_TOKEN;
});

describe("prometheus-client", () => {
  describe("isPrometheusConfigured", () => {
    it("returns false when PROMETHEUS_URL is unset", () => {
      expect(isPrometheusConfigured()).toBe(false);
    });

    it("returns true when PROMETHEUS_URL is set", () => {
      vi.stubEnv("PROMETHEUS_URL", "http://localhost:9090");
      expect(isPrometheusConfigured()).toBe(true);
    });
  });

  describe("queryInstant", () => {
    it("parses a successful vector response", async () => {
      vi.stubEnv("PROMETHEUS_URL", "http://localhost:9090");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          data: { result: [{ value: [1700000000, "42.5"] }] },
        }),
      });

      const value = await queryInstant("up");
      expect(value).toBe(42.5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/query?"),
        expect.objectContaining({ cache: "no-store" })
      );
    });

    it("returns null for empty results", async () => {
      vi.stubEnv("PROMETHEUS_URL", "http://localhost:9090");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "success", data: { result: [] } }),
      });

      expect(await queryInstant("missing_metric")).toBeNull();
    });
  });

  describe("queryInstantBatch", () => {
    it("runs queries in parallel and maps keys", async () => {
      vi.stubEnv("PROMETHEUS_URL", "http://localhost:9090");
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "success",
            data: { result: [{ value: [1, "10"] }] },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: "success",
            data: { result: [{ value: [1, "3"] }] },
          }),
        });

      const result = await queryInstantBatch({
        a: "metric_a",
        b: "metric_b",
      });
      expect(result).toEqual({ a: 10, b: 3 });
    });
  });

  describe("checkPrometheusReachable", () => {
    it("returns false when not configured", async () => {
      expect(await checkPrometheusReachable()).toBe(false);
    });

    it("returns true when Prometheus responds to scalar probe (vector form)", async () => {
      vi.stubEnv("PROMETHEUS_URL", "http://localhost:9090");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          data: { resultType: "vector", result: [{ value: [1, "1"] }] },
        }),
      });
      expect(await checkPrometheusReachable()).toBe(true);
    });

    it("returns true when Prometheus responds to scalar probe (scalar form)", async () => {
      vi.stubEnv("PROMETHEUS_URL", "http://localhost:9090");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          data: { resultType: "scalar", result: [1, "1"] },
        }),
      });
      expect(await checkPrometheusReachable()).toBe(true);
    });

    it("returns false when scalar probe does not return 1", async () => {
      vi.stubEnv("PROMETHEUS_URL", "http://localhost:9090");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "success",
          data: { result: [{ value: [1, "0"] }] },
        }),
      });
      expect(await checkPrometheusReachable()).toBe(false);
    });
  });
});
