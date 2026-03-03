import { getTraceIdFromRequest } from "@/lib/trace-context";
import { getWarRoomData, log, recordRequest } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

let cachedData: string | null = null;
let cachedAt = 0;
// 30s server cache: under traffic spike most requests hit cache, CDN can cache same
const CACHE_TTL = 30_000;

export async function GET(req: Request) {
  const start = Date.now();
  const traceId = getTraceIdFromRequest(req);
  const now = Date.now();
  if (cachedData && now - cachedAt < CACHE_TTL) {
    recordRequest("/api/war-room/data", "GET", 200, Date.now() - start);
    return new Response(cachedData, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30",
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
      "Cache-Control": "public, max-age=30",
      "X-Cache": "MISS",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
