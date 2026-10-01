import { getPrometheusText, recordRequest } from "@/lib/telemetry";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  const start = Date.now();
  if (!isAdminRequest(req)) {
    recordRequest("/api/metrics", "GET", 401, Date.now() - start);
    return new Response("Unauthorized", { status: 401, headers: { "Content-Type": "text/plain" } });
  }

  const text = getPrometheusText();
  recordRequest("/api/metrics", "GET", 200, Date.now() - start);

  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
