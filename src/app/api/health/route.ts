import { getHealthData, log } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = getHealthData();

  log("INFO", "Health check", {
    endpoint: "/api/health",
    status: health.status,
    uptime_seconds: health.uptime_seconds,
  });

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

  return new Response(JSON.stringify(health, null, 2), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
