import { getTraceIdFromRequest } from "@/lib/trace-context";
import { getChatSpans, log, recordRequest } from "@/lib/telemetry";
import { getWarRoomDataAsync } from "@/lib/war-room-metrics";
import { getProbeState, maybeRunProbes } from "@/lib/probe";

export const dynamic = "force-dynamic";

let cachedData: string | null = null;
let cachedAt = 0;
// 60s server cache (low-traffic cost; client polls at 60s; reduce to 30s when job hunting)
const CACHE_TTL = 60_000;

export async function GET(req: Request) {
  const start = Date.now();
  const traceId = getTraceIdFromRequest(req);
  const now = Date.now();
  if (cachedData && now - cachedAt < CACHE_TTL) {
    recordRequest("/api/war-room/data", "GET", 200, Date.now() - start);
    // The cached payload is up to 60 s old, but the trace spans and probe samples are cheap and stay live.
    maybeRunProbes();
    const live = JSON.parse(cachedData) as Record<string, unknown>;
    live.chat_spans = { ...getChatSpans(), probe: getProbeState() };
    return new Response(JSON.stringify(live), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
        "X-Cache": "HIT",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // Visitor paths and user agents stay out of the public payload (privacy).
  const data = await getWarRoomDataAsync();
  delete (data as { recent_visitors?: unknown }).recent_visitors;

  // Start any due timing probes in the background and report what exists now. Never waits.
  maybeRunProbes();
  (data as { chat_spans: unknown }).chat_spans = { ...data.chat_spans, probe: getProbeState() };

  log("INFO", "War room data request", {
    endpoint: "/api/war-room/data",
    total_requests: data.request_metrics.total_24h,
    uptime: data.infrastructure.uptime_seconds,
    ...(traceId && { trace_id: traceId }),
  });

  cachedData = JSON.stringify(data);
  cachedAt = now;
  recordRequest("/api/war-room/data", "GET", 200, Date.now() - start);

  return new Response(cachedData, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
      "X-Cache": "MISS",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
