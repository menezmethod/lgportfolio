import { getWarRoomData, log } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

let cachedData: string | null = null;
let cachedAt = 0;
const CACHE_TTL = 10_000; // 10 seconds

export async function GET() {
  const now = Date.now();
  if (cachedData && now - cachedAt < CACHE_TTL) {
    return new Response(cachedData, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=10",
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
  });

  cachedData = JSON.stringify(data);
  cachedAt = now;

  return new Response(cachedData, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=10",
      "X-Cache": "MISS",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
