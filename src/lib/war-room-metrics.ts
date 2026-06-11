import {
  checkPrometheusReachable,
  isPrometheusConfigured,
  queryInstantBatch,
  queryRange,
} from "./prometheus-client";
import { type SLODefinition, type WarRoomData, getWarRoomData } from "./telemetry";

export type MetricsSource = "prometheus" | "memory" | "hybrid";

export interface WarRoomDataWithSource extends WarRoomData {
  metrics_source: MetricsSource;
  platform: "vercel" | "cloud-run" | "coolify" | "local";
}

function detectPlatform(): WarRoomDataWithSource["platform"] {
  if (process.env.VERCEL) return "vercel";
  if (process.env.GOOGLE_CLOUD_PROJECT) return "cloud-run";
  if (process.env.COOLIFY === "1") return "coolify";
  return "local";
}

function roundMs(seconds: number | null): number {
  if (seconds == null || !Number.isFinite(seconds)) return 0;
  return Math.round(seconds * 1000);
}

function roundPct(value: number | null): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return parseFloat(value.toFixed(2));
}

function buildSLOsFromPrometheus(values: {
  availability: number | null;
  p95Ms: number | null;
  errorRate: number | null;
  budgetHeadroom: number | null;
}): SLODefinition[] {
  const p95 = values.p95Ms ?? 0;
  const errorRate = values.errorRate ?? 0;
  const availability = values.availability ?? 100;
  const budgetPct = values.budgetHeadroom ?? 100;

  return [
    {
      name: "Availability",
      target: 99.5,
      unit: "%",
      current: roundPct(availability),
      met: availability >= 99.5,
    },
    {
      name: "P95 Latency",
      target: 500,
      unit: "ms",
      current: p95,
      met: p95 <= 500 || p95 === 0,
    },
    {
      name: "Error Rate",
      target: 5,
      unit: "% max",
      current: roundPct(errorRate),
      met: errorRate <= 5,
    },
    {
      name: "Budget Headroom",
      target: 10,
      unit: "% min",
      current: roundPct(budgetPct),
      met: budgetPct >= 10,
    },
  ];
}

async function fetchPrometheusWarRoomSlice(budgetMax: number): Promise<Partial<WarRoomData> | null> {
  const instant = await queryInstantBatch({
    total24h: "sum(increase(http_requests_total[24h]))",
    rpm: "sum(rate(http_requests_total[1m])) * 60",
    errors1h: "sum(increase(errors_total[1h]))",
    reqs1h: "sum(increase(http_requests_total[1h]))",
    p50: 'max(http_request_duration_seconds{quantile="0.5"})',
    p90: 'max(http_request_duration_seconds{quantile="0.9"})',
    p99: 'max(http_request_duration_seconds{quantile="0.99"})',
    chat24h: "sum(increase(chat_conversations_total[24h]))",
    cacheHits24h: "sum(increase(chat_cache_hits_total[24h]))",
    rateLimits24h: "sum(increase(chat_rate_limit_hits_total[24h]))",
    chatInferenceP50: 'avg(chat_inference_duration_seconds{quantile="0.5"})',
    coldStarts24h: "sum(increase(app_cold_starts_total[24h]))",
    availability24h:
      "100 * (1 - sum(increase(errors_total[24h])) / clamp_min(sum(increase(http_requests_total[24h])), 1))",
  });

  const now = Date.now();
  const oneHourAgo = now - 3_600_000;
  const [latencyP50Series, latencyP90Series, requestSeries, errorSeries] = await Promise.all([
    queryRange('max(http_request_duration_seconds{quantile="0.5"})', oneHourAgo, now, 60).catch(() => []),
    queryRange('max(http_request_duration_seconds{quantile="0.9"})', oneHourAgo, now, 60).catch(() => []),
    queryRange("sum(increase(http_requests_total[1m]))", oneHourAgo, now, 60).catch(() => []),
    queryRange("sum(increase(errors_total[1m]))", oneHourAgo, now, 60).catch(() => []),
  ]);

  const reqs1h = instant.reqs1h ?? 0;
  const errors1h = instant.errors1h ?? 0;
  const chat24h = Math.round(instant.chat24h ?? 0);
  const cacheHits24h = instant.cacheHits24h ?? 0;
  const budgetUsed = chat24h;
  const budgetRemaining = Math.max(0, budgetMax - budgetUsed);
  const budgetHeadroom = budgetMax > 0 ? ((budgetMax - budgetUsed) / budgetMax) * 100 : 100;

  const errorByTime = new Map(errorSeries.map((p) => [p.t, p.value]));
  const requests_1h = requestSeries.map((p) => ({
    t: p.t,
    count: Math.round(p.value),
    errors: Math.round(errorByTime.get(p.t) ?? 0),
  }));

  const p90ByTime = new Map(latencyP90Series.map((p) => [p.t, p.value]));
  const latency_1h = latencyP50Series.map((p) => ({
    t: p.t,
    p50: roundMs(p.value),
    p95: roundMs(p90ByTime.get(p.t) ?? instant.p90),
  }));

  return {
    request_metrics: {
      total_24h: Math.round(instant.total24h ?? 0),
      rpm_current: Math.round(instant.rpm ?? 0),
      error_rate_1h: reqs1h > 0 ? (errors1h / reqs1h) * 100 : 0,
      latency_p50: roundMs(instant.p50),
      latency_p95: roundMs(instant.p90),
      latency_p99: roundMs(instant.p99),
    },
    chat_metrics: {
      conversations_24h: chat24h,
      avg_inference_ms: roundMs(instant.chatInferenceP50),
      cache_hit_rate: chat24h > 0 ? Math.round((cacheHits24h / chat24h) * 100) : 0,
      rate_limit_hits_24h: Math.round(instant.rateLimits24h ?? 0),
      budget_used: budgetUsed,
      budget_remaining: budgetRemaining,
    },
    infrastructure: {
      uptime_seconds: 0,
      cold_starts: Math.round(instant.coldStarts24h ?? 0),
      node_version: process.version,
      boot_time: new Date().toISOString(),
    },
    slos: buildSLOsFromPrometheus({
      availability: instant.availability24h,
      p95Ms: roundMs(instant.p90),
      errorRate: reqs1h > 0 ? (errors1h / reqs1h) * 100 : 0,
      budgetHeadroom,
    }),
    timeseries: { latency_1h, requests_1h },
  };
}

/**
 * Build War Room payload. When PROMETHEUS_URL is set, request/chat/SLO/chart
 * metrics come from Prometheus (aggregated across Vercel instances). Events and
 * recent errors stay in-memory on the serving instance.
 */
export async function getWarRoomDataAsync(): Promise<WarRoomDataWithSource> {
  const base = getWarRoomData();
  const platform = detectPlatform();
  const budgetMax = parseInt(process.env.CHAT_DAILY_BUDGET || "150", 10);

  if (!isPrometheusConfigured()) {
    return {
      ...base,
      metrics_source: "memory",
      platform,
      service_status: {
        ...base.service_status,
        region: process.env.VERCEL_REGION || base.service_status.region,
      },
    };
  }

  const promUp = await checkPrometheusReachable();
  if (!promUp) {
    return {
      ...base,
      metrics_source: "memory",
      platform,
      service_status: {
        ...base.service_status,
        checks: {
          ...base.service_status.checks,
          prometheus: { status: "down" },
        },
        region: process.env.VERCEL_REGION || base.service_status.region,
      },
    };
  }

  try {
    const promSlice = await fetchPrometheusWarRoomSlice(budgetMax);
    if (!promSlice?.request_metrics) {
      return { ...base, metrics_source: "memory", platform };
    }

    return {
      ...base,
      ...promSlice,
      service_status: {
        ...base.service_status,
        checks: {
          ...base.service_status.checks,
          prometheus: { status: "up" },
        },
        region: process.env.VERCEL_REGION || base.service_status.region,
      },
      infrastructure: {
        ...base.infrastructure,
        ...promSlice.infrastructure,
        node_version: base.infrastructure.node_version,
        uptime_seconds: base.infrastructure.uptime_seconds,
        boot_time: base.infrastructure.boot_time,
      },
      recent_events: base.recent_events,
      recent_errors: base.recent_errors,
      metrics_source: "prometheus",
      platform,
    };
  } catch {
    return {
      ...base,
      metrics_source: "memory",
      platform,
      service_status: {
        ...base.service_status,
        checks: {
          ...base.service_status.checks,
          prometheus: { status: "degraded" },
        },
        region: process.env.VERCEL_REGION || base.service_status.region,
      },
    };
  }
}
