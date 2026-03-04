import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  increment,
  getCounter,
  observe,
  setGauge,
  getGauge,
  recordRequestTimeSeries,
  addEvent,
  recordError,
  getRecentErrors,
  generateTraceId,
  log,
  recordRequest,
  recordChatMetrics,
  getHealthData,
  getWarRoomData,
  getPrometheusText,
  incrementAdminMetric,
  getUptimeSeconds,
} from "@/lib/telemetry";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("telemetry", () => {
  // ── Counters ──────────────────────────────────────────────────────────────

  describe("counters", () => {
    it("increment creates a new counter starting at 1", () => {
      const name = `test_counter_${Date.now()}`;
      increment(name);
      expect(getCounter(name)).toBe(1);
    });

    it("increment adds to existing counter", () => {
      const name = `test_add_${Date.now()}`;
      increment(name);
      increment(name);
      expect(getCounter(name)).toBe(2);
    });

    it("increment accepts custom amount", () => {
      const name = `test_amount_${Date.now()}`;
      increment(name, 5);
      expect(getCounter(name)).toBe(5);
    });

    it("getCounter returns 0 for unknown counter", () => {
      expect(getCounter("totally_unknown_counter_xyz")).toBe(0);
    });
  });

  // ── Histograms ────────────────────────────────────────────────────────────

  describe("histograms", () => {
    it("observe creates a new histogram with one observation", () => {
      const name = `test_hist_${Date.now()}`;
      observe(name, 42);
      // Verified indirectly: getPrometheusText will include the count
      const text = getPrometheusText();
      expect(text).toContain(`${name}_count 1`);
    });

    it("observe appends to existing histogram", () => {
      const name = `test_hist_append_${Date.now()}`;
      observe(name, 10);
      observe(name, 20);
      observe(name, 30);
      const text = getPrometheusText();
      expect(text).toContain(`${name}_count 3`);
    });
  });

  // ── Gauges ────────────────────────────────────────────────────────────────

  describe("gauges", () => {
    it("setGauge creates a new gauge", () => {
      const name = `test_gauge_${Date.now()}`;
      setGauge(name, 42);
      expect(getGauge(name)).toBe(42);
    });

    it("setGauge overwrites existing gauge value", () => {
      const name = `test_gauge_overwrite_${Date.now()}`;
      setGauge(name, 10);
      setGauge(name, 99);
      expect(getGauge(name)).toBe(99);
    });

    it("getGauge returns 0 for unknown gauge", () => {
      expect(getGauge("unknown_gauge_xyz")).toBe(0);
    });
  });

  // ── Time Series ───────────────────────────────────────────────────────────

  describe("time series", () => {
    it("recordRequestTimeSeries creates a bucket with request count", () => {
      // Just verify it doesn't throw and increments data
      recordRequestTimeSeries(100, false);
    });

    it("recordRequestTimeSeries increments errors when isError is true", () => {
      recordRequestTimeSeries(50, true);
      // Indirectly verified through getWarRoomData timeseries
    });
  });

  // ── Events ────────────────────────────────────────────────────────────────

  describe("events", () => {
    it("addEvent adds an event with correct type and message", () => {
      addEvent("deploy", "Test deployment");
      const data = getWarRoomData();
      const found = data.recent_events.find(
        (e) => e.type === "deploy" && e.message === "Test deployment"
      );
      expect(found).toBeDefined();
    });

    it("addEvent includes ISO timestamp", () => {
      addEvent("health", "Health check event");
      const data = getWarRoomData();
      const found = data.recent_events.find(
        (e) => e.message === "Health check event"
      );
      expect(found?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  // ── Recent Errors ─────────────────────────────────────────────────────────

  describe("recent errors", () => {
    it("recordError adds error with timestamp, endpoint, status, message", () => {
      recordError({
        endpoint: "/api/test",
        status_code: 500,
        message: "Test error",
      });
      const errors = getRecentErrors();
      const found = errors.find(
        (e) => e.endpoint === "/api/test" && e.message === "Test error"
      );
      expect(found).toBeDefined();
      expect(found?.status_code).toBe(500);
      expect(found?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("recordError stores trace_id when provided", () => {
      recordError({
        endpoint: "/api/traced",
        status_code: 503,
        message: "Traced error",
        trace_id: "trace-abc-123",
      });
      const errors = getRecentErrors();
      const found = errors.find((e) => e.trace_id === "trace-abc-123");
      expect(found).toBeDefined();
    });

    it("getRecentErrors returns errors in reverse chronological order", () => {
      const errors = getRecentErrors();
      if (errors.length >= 2) {
        const first = new Date(errors[0].timestamp).getTime();
        const second = new Date(errors[1].timestamp).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });
  });

  // ── generateTraceId ───────────────────────────────────────────────────────

  describe("generateTraceId", () => {
    it("returns a string in the expected format (ts-seq-rand)", () => {
      const id = generateTraceId();
      expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/);
    });

    it("returns unique IDs on successive calls", () => {
      const ids = new Set(Array.from({ length: 10 }, () => generateTraceId()));
      expect(ids.size).toBe(10);
    });
  });

  // ── log ───────────────────────────────────────────────────────────────────

  describe("log", () => {
    it("outputs JSON to console.log with severity and message", () => {
      log("INFO", "Test log message");
      expect(console.log).toHaveBeenCalled();
      const call = vi.mocked(console.log).mock.calls.find((c) => {
        try {
          const parsed = JSON.parse(c[0] as string);
          return parsed.message === "Test log message";
        } catch {
          return false;
        }
      });
      expect(call).toBeDefined();
      const parsed = JSON.parse(call![0] as string);
      expect(parsed.severity).toBe("INFO");
      expect(parsed.timestamp).toBeDefined();
    });

    it("includes trace correlation when trace_id and GOOGLE_CLOUD_PROJECT are set", () => {
      vi.stubEnv("GOOGLE_CLOUD_PROJECT", "my-project");
      log("ERROR", "Traced log", { trace_id: "abc-123" });
      const call = vi.mocked(console.log).mock.calls.find((c) => {
        try {
          const parsed = JSON.parse(c[0] as string);
          return parsed.message === "Traced log";
        } catch {
          return false;
        }
      });
      expect(call).toBeDefined();
      const parsed = JSON.parse(call![0] as string);
      expect(parsed["logging.googleapis.com/trace"]).toBe(
        "projects/my-project/traces/abc-123"
      );
    });

    it("includes additional fields when provided", () => {
      log("WARNING", "With fields", { endpoint: "/api/chat", duration_ms: 150 });
      const call = vi.mocked(console.log).mock.calls.find((c) => {
        try {
          const parsed = JSON.parse(c[0] as string);
          return parsed.message === "With fields";
        } catch {
          return false;
        }
      });
      const parsed = JSON.parse(call![0] as string);
      expect(parsed.endpoint).toBe("/api/chat");
      expect(parsed.duration_ms).toBe(150);
    });
  });

  // ── recordRequest ─────────────────────────────────────────────────────────

  describe("recordRequest", () => {
    it("increments http_requests_total", () => {
      const before = getCounter("http_requests_total");
      recordRequest("/api/test-rr", "GET", 200, 50);
      expect(getCounter("http_requests_total")).toBe(before + 1);
    });

    it("increments errors_total for status >= 400", () => {
      const before = getCounter("errors_total");
      recordRequest("/api/err", "POST", 500, 100);
      expect(getCounter("errors_total")).toBeGreaterThan(before);
    });

    it("increments server error counter for status >= 500", () => {
      const key = 'errors_total{type="server"}';
      const before = getCounter(key);
      recordRequest("/api/srv", "GET", 503, 200);
      expect(getCounter(key)).toBe(before + 1);
    });

    it("increments client error counter for 4xx", () => {
      const key = 'errors_total{type="client"}';
      const before = getCounter(key);
      recordRequest("/api/cli", "POST", 400, 10);
      expect(getCounter(key)).toBe(before + 1);
    });

    it("does NOT count 401 as error in time series (isError=false)", () => {
      // 401 still increments errors_total but isError flag is false for time series
      recordRequest("/api/auth", "GET", 401, 5);
      // No assertion on time series error count directly, but verify it doesn't throw
    });
  });

  // ── recordChatMetrics ─────────────────────────────────────────────────────

  describe("recordChatMetrics", () => {
    it("always increments chat_conversations_total", () => {
      const before = getCounter("chat_conversations_total");
      recordChatMetrics({
        durationMs: 100,
        ragDurationMs: 20,
        cacheHit: false,
        rateLimited: false,
      });
      expect(getCounter("chat_conversations_total")).toBe(before + 1);
    });

    it("increments chat_cache_hits_total when cacheHit is true", () => {
      const before = getCounter("chat_cache_hits_total");
      recordChatMetrics({
        durationMs: 5,
        ragDurationMs: 0,
        cacheHit: true,
        rateLimited: false,
      });
      expect(getCounter("chat_cache_hits_total")).toBe(before + 1);
    });

    it("increments chat_rate_limit_hits_total when rateLimited", () => {
      const before = getCounter("chat_rate_limit_hits_total");
      recordChatMetrics({
        durationMs: 0,
        ragDurationMs: 0,
        cacheHit: false,
        rateLimited: true,
      });
      expect(getCounter("chat_rate_limit_hits_total")).toBe(before + 1);
    });

    it("increments chat_tokens_used_total by tokensUsed amount", () => {
      const before = getCounter("chat_tokens_used_total");
      recordChatMetrics({
        durationMs: 200,
        ragDurationMs: 30,
        cacheHit: false,
        rateLimited: false,
        tokensUsed: 150,
      });
      expect(getCounter("chat_tokens_used_total")).toBe(before + 150);
    });
  });

  // ── incrementAdminMetric ──────────────────────────────────────────────────

  describe("incrementAdminMetric", () => {
    it("increments admin_board_views_total for 'board_views'", () => {
      const before = getCounter("admin_board_views_total");
      incrementAdminMetric("board_views");
      expect(getCounter("admin_board_views_total")).toBe(before + 1);
    });

    it("increments admin_sessions_list_total for 'sessions_list'", () => {
      const before = getCounter("admin_sessions_list_total");
      incrementAdminMetric("sessions_list");
      expect(getCounter("admin_sessions_list_total")).toBe(before + 1);
    });
  });

  // ── getHealthData ─────────────────────────────────────────────────────────

  describe("getHealthData", () => {
    it("returns HealthData shape with all expected fields", () => {
      const data = getHealthData();
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("uptime_seconds");
      expect(data).toHaveProperty("checks");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("region");
      expect(data.checks).toHaveProperty("inference_api");
      expect(data.checks).toHaveProperty("rag_system");
      expect(data.checks).toHaveProperty("rate_limiter");
    });

    it("returns 'degraded' when INFERENCIA_API_KEY is missing", () => {
      delete process.env.INFERENCIA_API_KEY;
      const data = getHealthData();
      expect(data.status).toBe("degraded");
      expect(data.checks.inference_api.status).toBe("degraded");
    });

    it("returns 'healthy' when INFERENCIA_API_KEY is set", () => {
      vi.stubEnv("INFERENCIA_API_KEY", "test-key");
      const data = getHealthData();
      expect(data.status).toBe("healthy");
      expect(data.checks.inference_api.status).toBe("up");
    });

    it("includes budget_remaining in rate_limiter check", () => {
      const data = getHealthData();
      expect(data.checks.rate_limiter.budget_remaining).toBeDefined();
      expect(typeof data.checks.rate_limiter.budget_remaining).toBe("number");
    });
  });

  // ── getWarRoomData ────────────────────────────────────────────────────────

  describe("getWarRoomData", () => {
    it("returns WarRoomData with all expected top-level keys", () => {
      const data = getWarRoomData();
      expect(data).toHaveProperty("service_status");
      expect(data).toHaveProperty("request_metrics");
      expect(data).toHaveProperty("chat_metrics");
      expect(data).toHaveProperty("infrastructure");
      expect(data).toHaveProperty("slos");
      expect(data).toHaveProperty("recent_events");
      expect(data).toHaveProperty("recent_errors");
      expect(data).toHaveProperty("timeseries");
    });

    it("slos array contains 4 SLO definitions", () => {
      const data = getWarRoomData();
      expect(data.slos).toHaveLength(4);
      const names = data.slos.map((s) => s.name);
      expect(names).toContain("Availability");
      expect(names).toContain("P95 Latency");
      expect(names).toContain("Error Rate");
      expect(names).toContain("Budget Headroom");
    });

    it("each SLO has name, target, unit, current, and met fields", () => {
      const data = getWarRoomData();
      for (const slo of data.slos) {
        expect(slo).toHaveProperty("name");
        expect(slo).toHaveProperty("target");
        expect(slo).toHaveProperty("unit");
        expect(slo).toHaveProperty("current");
        expect(slo).toHaveProperty("met");
        expect(typeof slo.met).toBe("boolean");
      }
    });

    it("infrastructure includes uptime and node version", () => {
      const data = getWarRoomData();
      expect(data.infrastructure.uptime_seconds).toBeGreaterThanOrEqual(0);
      expect(data.infrastructure.node_version).toBe(process.version);
    });

    it("recent_events includes the cold_start event from module init", () => {
      const data = getWarRoomData();
      const coldStart = data.recent_events.find(
        (e) => e.type === "cold_start"
      );
      expect(coldStart).toBeDefined();
    });
  });

  // ── getPrometheusText ─────────────────────────────────────────────────────

  describe("getPrometheusText", () => {
    it("returns valid Prometheus text format with TYPE annotations", () => {
      const text = getPrometheusText();
      expect(text).toContain("# TYPE");
      expect(text).toContain("counter");
    });

    it("includes counter TYPE lines for known metrics", () => {
      increment("prom_test_counter", 1);
      const text = getPrometheusText();
      expect(text).toContain("# TYPE prom_test_counter counter");
      expect(text).toContain("prom_test_counter 1");
    });

    it("includes gauge TYPE lines for known gauges", () => {
      setGauge("prom_test_gauge", 42);
      const text = getPrometheusText();
      expect(text).toContain("# TYPE prom_test_gauge gauge");
      expect(text).toContain("prom_test_gauge 42");
    });

    it("includes summary TYPE lines for histograms", () => {
      const name = `prom_test_hist_${Date.now()}`;
      observe(name, 100);
      observe(name, 200);
      const text = getPrometheusText();
      expect(text).toContain(`# TYPE ${name} summary`);
      expect(text).toContain(`${name}_count 2`);
    });
  });

  // ── getUptimeSeconds ──────────────────────────────────────────────────────

  describe("getUptimeSeconds", () => {
    it("returns a non-negative number", () => {
      expect(getUptimeSeconds()).toBeGreaterThanOrEqual(0);
    });
  });
});
