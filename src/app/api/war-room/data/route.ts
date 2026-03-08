import { getTraceIdFromRequest } from "@/lib/trace-context";
import { getWarRoomData, log, recordRequest } from "@/lib/telemetry";

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
    return new Response(cachedData, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
        "X-Cache": "HIT",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const data = getWarRoomData();

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
