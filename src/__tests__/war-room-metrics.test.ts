import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/prometheus-client", () => ({
  isPrometheusConfigured: vi.fn(() => false),
  checkPrometheusReachable: vi.fn(),
  queryInstantBatch: vi.fn(),
  queryRange: vi.fn(),
}));

import { getWarRoomDataAsync } from "@/lib/war-room-metrics";
import { isPrometheusConfigured } from "@/lib/prometheus-client";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getWarRoomDataAsync", () => {
  it("returns memory source when PROMETHEUS_URL is unset", async () => {
    vi.mocked(isPrometheusConfigured).mockReturnValue(false);
    const data = await getWarRoomDataAsync();
    expect(data.metrics_source).toBe("memory");
    expect(data).toHaveProperty("request_metrics");
    expect(data).toHaveProperty("recent_events");
  });

  it("includes platform when VERCEL is set", async () => {
    vi.mocked(isPrometheusConfigured).mockReturnValue(false);
    vi.stubEnv("VERCEL", "1");
    const data = await getWarRoomDataAsync();
    expect(data.platform).toBe("vercel");
  });
});
