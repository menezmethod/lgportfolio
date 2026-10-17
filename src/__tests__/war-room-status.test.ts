import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("@/lib/prometheus-client", () => ({
  isPrometheusConfigured: vi.fn(() => false),
  checkPrometheusReachable: vi.fn(),
  queryInstantBatch: vi.fn(),
  queryRange: vi.fn(),
}));

import { checkDisplay, overallDisplay } from "@/components/war-room/status";
import { getWarRoomDataAsync } from "@/lib/war-room-metrics";
import { getHealthData } from "@/lib/telemetry";

afterEach(() => vi.unstubAllEnvs());

describe("war room truth", () => {
  it("shows a check that is not configured as neutral, never UP", () => {
    expect(checkDisplay("not_configured")).toEqual({ label: "NOT CONFIGURED", tone: "neutral" });
    expect(checkDisplay("up").tone).toBe("ok");
    expect(checkDisplay("down").tone).toBe("bad");
    expect(checkDisplay("unreachable")).toEqual({ label: "CONFIGURED, UNREACHABLE", tone: "neutral" });
  });

  it("says warming up instead of HEALTHY under 50 requests", () => {
    expect(overallDisplay("healthy", 49)).toEqual({
      label: "WARMING UP",
      tone: "neutral",
      detail: "Warming up: 49 requests, SLO shown at 50",
    });
    expect(overallDisplay("healthy", 50)).toEqual({ label: "HEALTHY", tone: "ok" });
    expect(overallDisplay("unhealthy", 500).tone).toBe("bad");
  });

  it("reports Prometheus as not configured when the memory fallback is used", async () => {
    vi.stubEnv("PROMETHEUS_URL", "");
    const data = await getWarRoomDataAsync();
    expect(data.metrics_source).toBe("memory");
    expect(data.service_status.checks.prometheus.status).toBe("not_configured");
  });

  it("does not claim Prometheus in the health payload without PROMETHEUS_URL", () => {
    vi.stubEnv("PROMETHEUS_URL", "");
    expect(getHealthData().checks.prometheus.status).toBe("not_configured");
    vi.stubEnv("PROMETHEUS_URL", "http://prometheus.invalid:9090");
    expect(getHealthData().checks.prometheus.status).toBe("up");
  });

  it("counts Cloudflare Workers AI as a working chat provider (no inferencia, no OpenRouter)", () => {
    vi.stubEnv("INFERENCIA_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("CLOUDFLARE_RAG_KEY", "k");
    expect(getHealthData().checks.inference_api.status).toBe("up");
    vi.stubEnv("CLOUDFLARE_RAG_KEY", "");
    expect(getHealthData().checks.inference_api.status).toBe("degraded");
  });
});
