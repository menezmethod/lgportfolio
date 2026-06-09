/**
 * Thin Prometheus HTTP API client for War Room aggregated metrics.
 * Prometheus scrapes GET /api/metrics (with X-Admin-Secret) so counters
 * reflect traffic across all Vercel serverless instances.
 */

export interface PrometheusInstantResult {
  value: number;
  timestamp: number;
}

export interface PrometheusRangePoint {
  t: number;
  value: number;
}

interface PromVectorResponse {
  status: string;
  data?: {
    resultType: string;
    result: Array<{ value?: [number, string]; values?: Array<[number, string]> }>;
  };
}

const QUERY_TIMEOUT_MS = 8_000;

export function isPrometheusConfigured(): boolean {
  return Boolean(process.env.PROMETHEUS_URL?.trim());
}

function prometheusBaseUrl(): string {
  const url = process.env.PROMETHEUS_URL?.trim();
  if (!url) throw new Error("PROMETHEUS_URL is not set");
  return url.replace(/\/$/, "");
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.PROMETHEUS_BEARER_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    return headers;
  }
  const basic = process.env.PROMETHEUS_BASIC_AUTH?.trim();
  if (basic) {
    headers.Authorization = `Basic ${Buffer.from(basic).toString("base64")}`;
  }
  return headers;
}

async function promFetch(path: string, params: URLSearchParams): Promise<PromVectorResponse> {
  const url = `${prometheusBaseUrl()}${path}?${params.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: authHeaders(), signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`Prometheus ${res.status}: ${await res.text()}`);
    return (await res.json()) as PromVectorResponse;
  } finally {
    clearTimeout(timer);
  }
}

function parseInstant(data: PromVectorResponse): PrometheusInstantResult | null {
  if (data.status !== "success" || !data.data?.result?.length) return null;
  const first = data.data.result[0];
  if (!first.value) return null;
  const [ts, val] = first.value;
  const num = parseFloat(val);
  return Number.isFinite(num) ? { timestamp: ts * 1000, value: num } : null;
}

function parseRangeSum(data: PromVectorResponse): PrometheusRangePoint[] {
  if (data.status !== "success" || !data.data?.result?.length) return [];
  const bucket = new Map<number, number>();
  for (const series of data.data.result) {
    for (const [ts, val] of series.values ?? []) {
      const t = ts * 1000;
      const n = parseFloat(val);
      if (!Number.isFinite(n)) continue;
      bucket.set(t, (bucket.get(t) ?? 0) + n);
    }
  }
  return [...bucket.entries()]
    .map(([t, value]) => ({ t, value }))
    .sort((a, b) => a.t - b.t);
}

export async function queryInstant(promql: string): Promise<number | null> {
  const params = new URLSearchParams({ query: promql });
  const data = await promFetch("/api/v1/query", params);
  const parsed = parseInstant(data);
  return parsed?.value ?? null;
}

export async function queryRange(
  promql: string,
  startMs: number,
  endMs: number,
  stepSec: number
): Promise<PrometheusRangePoint[]> {
  const params = new URLSearchParams({
    query: promql,
    start: String(Math.floor(startMs / 1000)),
    end: String(Math.floor(endMs / 1000)),
    step: String(stepSec),
  });
  const data = await promFetch("/api/v1/query_range", params);
  return parseRangeSum(data);
}

/** Run a batch of instant queries in parallel. */
export async function queryInstantBatch(
  queries: Record<string, string>
): Promise<Record<string, number | null>> {
  const entries = Object.entries(queries);
  const results = await Promise.all(entries.map(([, q]) => queryInstant(q).catch(() => null)));
  return Object.fromEntries(entries.map(([key], i) => [key, results[i]]));
}

export async function checkPrometheusReachable(): Promise<boolean> {
  if (!isPrometheusConfigured()) return false;
  try {
    const ok = await queryInstant("1");
    return ok === 1;
  } catch {
    return false;
  }
}
