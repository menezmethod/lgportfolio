import { activeChatProviderIds } from "@/lib/chat-provider-env";
import { probeInferenciaHealth } from "@/lib/inferencia-health";
import { getTraceIdFromRequest } from "@/lib/trace-context";
import { getHealthData, log, recordRequest } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

/** Shallow checks (cron, watchdogs) must not cascade into Inferencia /health probes. */
function shouldSkipInferenciaProbe(req: Request): boolean {
  const url = new URL(req.url);
  return url.searchParams.get("shallow") === "1" || req.headers.get("x-hermes-watchdog") === "1";
}

export async function GET(req: Request) {
  const start = Date.now();
  const traceId = getTraceIdFromRequest(req);
  const shallow = shouldSkipInferenciaProbe(req);
  // Only probe inferencia when it is actually in the chat chain.
  const inferenciaProbe = shallow || !activeChatProviderIds().includes("inferencia") ? undefined : await probeInferenciaHealth();
  const health = getHealthData(inferenciaProbe, { shallow });

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
