import { getTraceIdFromRequest } from "@/lib/trace-context";
import { getHealthData, log, recordRequest } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const start = Date.now();
  const traceId = getTraceIdFromRequest(req);
  const health = getHealthData();

  log("INFO", "Health check", {
    endpoint: "/api/health",
    status: health.status,
    uptime_seconds: health.uptime_seconds,
    ...(traceId && { trace_id: traceId }),
  });

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
  recordRequest("/api/health", "GET", statusCode, Date.now() - start);

  return new Response(JSON.stringify(health, null, 2), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
