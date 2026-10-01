import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getWarRoomDataAsync } from "@/lib/war-room-metrics";

beforeEach(() => vi.spyOn(console, "log").mockImplementation(() => {}));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("PROMETHEUS_URL set but the host does not resolve", () => {
  it("falls back to memory fast, with a neutral 'unreachable' tile and a populated page", async () => {
    vi.stubEnv("PROMETHEUS_URL", "http://prometheus.does-not-exist.invalid:9090");
    const t0 = Date.now();
    const data = await getWarRoomDataAsync();
    expect(Date.now() - t0).toBeLessThan(2500);
    expect(data.metrics_source).toBe("memory");
    expect(data.service_status.checks.prometheus.status).toBe("unreachable");
    expect(data.request_metrics).toBeDefined();
    expect(data.slos.length).toBe(4);
    expect(JSON.stringify(data)).not.toMatch(/ENOTFOUND|getaddrinfo|at .*\.js|stack/i);
  });
});
