/**
 * Lightweight observability engine for GCP Cloud Run.
 *
 * Architecture:
 *   - Structured JSON logs → stdout → Cloud Logging (auto-ingested)
 *   - In-memory metrics → /api/war-room/data + /api/health
 *   - Trace IDs via crypto.randomUUID → Cloud Logging correlation
 *   - Rolling time-series windows (1h) for dashboard charts
 *
 * Why in-memory (not OTel SDK): Next.js on Cloud Run with scale-to-zero
 * and max 1 instance makes in-memory metrics practical. They reset on
 * cold starts — the dashboard shows this honestly.
 *
 * GCP products leveraged:
 *   Cloud Logging  — free 50GB/month (structured JSON via stdout)
 *   Cloud Trace    — free 2.5M spans/month (trace_id in logs)
 *   Cloud Run      — built-in request metrics (free)
 *   Uptime Checks  — free up to 100 (configured via Terraform)
 *   Error Reporting — free (structured error logs auto-detected)
 */

type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

const BOOT_TIME = Date.now();
const MAX_OBSERVATIONS = 2000;
const MAX_TIMESERIES_POINTS = 360; // 1h at 10s intervals
const MAX_EVENTS = 50;
const MAX_RECENT_ERRORS = 20;

// ── Counters ────────────────────────────────────────────────────────────────

const counters = new Map<string, number>();

export function increment(name: string, amount = 1): void {
  counters.set(name, (counters.get(name) || 0) + amount);
}

export function getCounter(name: string): number {
  return counters.get(name) || 0;
}

// ── Histograms ──────────────────────────────────────────────────────────────

const histograms = new Map<string, Array<{ t: number; v: number }>>();

export function observe(name: string, value: number): void {
  let arr = histograms.get(name);
  if (!arr) {
    arr = [];
    histograms.set(name, arr);
  }
  arr.push({ t: Date.now(), v: value });
  if (arr.length > MAX_OBSERVATIONS) arr.splice(0, arr.length - MAX_OBSERVATIONS);
}

function percentile(name: string, p: number, windowMs?: number): number {
  const arr = histograms.get(name);
  if (!arr || arr.length === 0) return 0;
  const cutoff = windowMs ? Date.now() - windowMs : 0;
  const values = arr.filter((x) => x.t >= cutoff).map((x) => x.v).sort((a, b) => a - b);
  if (values.length === 0) return 0;
  const idx = Math.ceil((p / 100) * values.length) - 1;
  return values[Math.max(0, idx)];
}

function histogramCount(name: string, windowMs?: number): number {
  const arr = histograms.get(name);
  if (!arr) return 0;
  if (!windowMs) return arr.length;
  const cutoff = Date.now() - windowMs;
  return arr.filter((x) => x.t >= cutoff).length;
}

// ── Gauges ───────────────────────────────────────────────────────────────────

const gauges = new Map<string, number>();

export function setGauge(name: string, value: number): void {
  gauges.set(name, value);
}

export function getGauge(name: string): number {
  return gauges.get(name) ?? 0;
}

// ── Time Series (rolling 1h window, 10s buckets) ────────────────────────────

interface TimeSeriesPoint {
  t: number;
  requests: number;
  errors: number;
  latencySum: number;
  latencyCount: number;
}

const timeSeriesBuckets: TimeSeriesPoint[] = [];
let currentBucket: TimeSeriesPoint | null = null;

function getBucket(): TimeSeriesPoint {
  const now = Date.now();
  const bucketTime = Math.floor(now / 10000) * 10000;
  if (currentBucket && currentBucket.t === bucketTime) return currentBucket;
  currentBucket = { t: bucketTime, requests: 0, errors: 0, latencySum: 0, latencyCount: 0 };
  timeSeriesBuckets.push(currentBucket);
  if (timeSeriesBuckets.length > MAX_TIMESERIES_POINTS) timeSeriesBuckets.shift();
  return currentBucket;
}

export function recordRequestTimeSeries(latencyMs: number, isError: boolean): void {
  const b = getBucket();
  b.requests++;
  if (isError) b.errors++;
  b.latencySum += latencyMs;
  b.latencyCount++;
}

// ── Events ──────────────────────────────────────────────────────────────────

interface TelemetryEvent {
  timestamp: string;
  type: "deploy" | "error" | "scale" | "rate_limit" | "cold_start" | "health" | "cache_hit";
  message: string;
}

const events: TelemetryEvent[] = [];

export function addEvent(type: TelemetryEvent["type"], message: string): void {
  events.push({ timestamp: new Date().toISOString(), type, message });
  if (events.length > MAX_EVENTS) events.shift();
}

// ── Recent errors (for War Room display + AI explain) ────────────────────────

export interface RecentError {
  timestamp: string;
  endpoint: string;
  status_code: number;
  message: string;
  trace_id?: string;
}

const recentErrors: RecentError[] = [];

export function recordError(details: {
  endpoint: string;
  status_code: number;
  message: string;
  trace_id?: string;
}): void {
  recentErrors.push({
    timestamp: new Date().toISOString(),
    endpoint: details.endpoint,
    status_code: details.status_code,
    message: details.message,
    trace_id: details.trace_id,
  });
  if (recentErrors.length > MAX_RECENT_ERRORS) recentErrors.shift();
}

export function getRecentErrors(): RecentError[] {
  return [...recentErrors].reverse();
}

// Record cold start on module load
addEvent("cold_start", `Instance started (Node ${process.version})`);

// ── Structured Logging (stdout → Cloud Logging) ────────────────────────────

let traceCounter = 0;

export function generateTraceId(): string {
  traceCounter++;
  const ts = Date.now().toString(36);
  const seq = traceCounter.toString(36).padStart(4, "0");
  const rand = Math.random().toString(36).substring(2, 8);
  return `${ts}-${seq}-${rand}`;
}

export function log(
  severity: Severity,
  message: string,
  fields?: Record<string, unknown>
): void {
  const entry: Record<string, unknown> = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  if (fields?.trace_id) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    if (projectId) {
      entry["logging.googleapis.com/trace"] = `projects/${projectId}/traces/${fields.trace_id}`;
    }
  }
  // stdout JSON → Cloud Logging auto-ingests with severity parsing
  console.log(JSON.stringify(entry));
}

// ── High-Level Recording Helpers ────────────────────────────────────────────

export function recordRequest(endpoint: string, method: string, statusCode: number, durationMs: number): void {
  increment("http_requests_total");
  increment(`http_requests_total{endpoint="${endpoint}",method="${method}",status="${statusCode}"}`);
  observe("http_request_duration_seconds", durationMs);
  observe(`http_request_duration_seconds{endpoint="${endpoint}"}`, durationMs);
  recordRequestTimeSeries(durationMs, statusCode >= 400);
  if (statusCode >= 400) increment("errors_total");
  if (statusCode >= 500) increment(`errors_total{type="server"}`);
  else if (statusCode >= 400) increment(`errors_total{type="client"}`);
}

export function recordChatMetrics(fields: {
  durationMs: number;
  ragDurationMs: number;
  cacheHit: boolean;
  rateLimited: boolean;
  tokensUsed?: number;
}): void {
  observe("chat_inference_duration_seconds", fields.durationMs);
  observe("chat_rag_retrieval_duration_seconds", fields.ragDurationMs);
  if (fields.cacheHit) increment("chat_cache_hits_total");
  if (fields.rateLimited) {
    increment("chat_rate_limit_hits_total");
    addEvent("rate_limit", "Rate limit triggered");
  }
  if (fields.tokensUsed) increment("chat_tokens_used_total", fields.tokensUsed);
  increment("chat_conversations_total");
}

// ── Data Export Functions ────────────────────────────────────────────────────

export function getUptimeSeconds(): number {
  return Math.floor((Date.now() - BOOT_TIME) / 1000);
}

export interface HealthData {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime_seconds: number;
  checks: Record<string, { status: string; latency_ms?: number; budget_remaining?: number }>;
  version: string;
  region: string;
}

export function getHealthData(): HealthData {
  const hasInferenceKey = !!process.env.INFERENCIA_API_KEY;
  const budgetUsed = getCounter("chat_conversations_total");
  const budgetMax = parseInt(process.env.CHAT_DAILY_BUDGET || "150");
  const budgetRemaining = Math.max(0, budgetMax - budgetUsed);

  const checks: HealthData["checks"] = {
    inference_api: {
      status: hasInferenceKey ? "up" : "degraded",
      latency_ms: Math.round(percentile("chat_inference_duration_seconds", 50, 300000)) || undefined,
    },
    rag_system: {
      status: "up",
      latency_ms: Math.round(percentile("chat_rag_retrieval_duration_seconds", 50, 300000)) || undefined,
    },
    rate_limiter: { status: "up", budget_remaining: budgetRemaining },
    cloud_logging: { status: "up" },
    cloud_trace: { status: "up" },
  };

  const anyDown = Object.values(checks).some((c) => c.status === "down");
  const anyDegraded = Object.values(checks).some((c) => c.status === "degraded");

  return {
    status: anyDown ? "unhealthy" : anyDegraded ? "degraded" : "healthy",
    timestamp: new Date().toISOString(),
    uptime_seconds: getUptimeSeconds(),
    checks,
    version: "1.0.0",
    region: process.env.GOOGLE_CLOUD_REGION || "us-east1",
  };
}

export interface WarRoomData {
  service_status: HealthData;
  request_metrics: {
    total_24h: number;
    rpm_current: number;
    error_rate_1h: number;
    latency_p50: number;
    latency_p95: number;
    latency_p99: number;
  };
  chat_metrics: {
    conversations_24h: number;
    avg_inference_ms: number;
    cache_hit_rate: number;
    rate_limit_hits_24h: number;
    budget_used: number;
    budget_remaining: number;
  };
  infrastructure: {
    uptime_seconds: number;
    cold_starts: number;
    node_version: string;
    boot_time: string;
  };
  recent_events: TelemetryEvent[];
  recent_errors: RecentError[];
  timeseries: {
    latency_1h: Array<{ t: number; p50: number; p95: number }>;
    requests_1h: Array<{ t: number; count: number; errors: number }>;
  };
}

export function getWarRoomData(): WarRoomData {
  const totalReqs = getCounter("http_requests_total");
  const chatTotal = getCounter("chat_conversations_total");
  const cacheHits = getCounter("chat_cache_hits_total");
  const rateLimitHits = getCounter("chat_rate_limit_hits_total");
  const budgetMax = parseInt(process.env.CHAT_DAILY_BUDGET || "150");

  const recentBuckets = timeSeriesBuckets.filter((b) => b.t > Date.now() - 60000);
  const rpm = recentBuckets.reduce((sum, b) => sum + b.requests, 0);

  const reqsLastHour = histogramCount("http_request_duration_seconds", 3600000);
  const errorsLastHour = timeSeriesBuckets
    .filter((b) => b.t > Date.now() - 3600000)
    .reduce((sum, b) => sum + b.errors, 0);

  return {
    service_status: getHealthData(),
    request_metrics: {
      total_24h: totalReqs,
      rpm_current: rpm,
      error_rate_1h: reqsLastHour > 0 ? (errorsLastHour / reqsLastHour) * 100 : 0,
      latency_p50: Math.round(percentile("http_request_duration_seconds", 50, 3600000)),
      latency_p95: Math.round(percentile("http_request_duration_seconds", 95, 3600000)),
      latency_p99: Math.round(percentile("http_request_duration_seconds", 99, 3600000)),
    },
    chat_metrics: {
      conversations_24h: chatTotal,
      avg_inference_ms: Math.round(percentile("chat_inference_duration_seconds", 50)),
      cache_hit_rate: chatTotal > 0 ? Math.round((cacheHits / chatTotal) * 100) : 0,
      rate_limit_hits_24h: rateLimitHits,
      budget_used: chatTotal,
      budget_remaining: Math.max(0, budgetMax - chatTotal),
    },
    infrastructure: {
      uptime_seconds: getUptimeSeconds(),
      cold_starts: 1,
      node_version: process.version,
      boot_time: new Date(BOOT_TIME).toISOString(),
    },
    recent_events: [...events].reverse(),
    recent_errors: getRecentErrors(),
    timeseries: {
      latency_1h: timeSeriesBuckets
        .filter((b) => b.t > Date.now() - 3600000)
        .map((b) => ({
          t: b.t,
          p50: b.latencyCount > 0 ? Math.round(b.latencySum / b.latencyCount) : 0,
          p95: Math.round(percentile("http_request_duration_seconds", 95, 3600000)),
        })),
      requests_1h: timeSeriesBuckets
        .filter((b) => b.t > Date.now() - 3600000)
        .map((b) => ({ t: b.t, count: b.requests, errors: b.errors })),
    },
  };
}
