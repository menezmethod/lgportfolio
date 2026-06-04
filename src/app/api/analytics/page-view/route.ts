/**
 * Analytics endpoint for client-side page view tracking.
 *
 * Called by the browser on every page navigation. Records the visitor
 * into in-memory telemetry (counters + recent visitors) so it shows up
 * in War Room and Prometheus metrics.
 */
import { recordVisitor, recordRequest } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const start = Date.now();
  try {
    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
    };
    const path = body.path || "/";
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";

    recordVisitor(path, userAgent, referrer);
    recordRequest("/api/analytics/page-view", "POST", 200, Date.now() - start);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    recordRequest("/api/analytics/page-view", "POST", 500, Date.now() - start);
    return new Response(JSON.stringify({ error: "Internal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
