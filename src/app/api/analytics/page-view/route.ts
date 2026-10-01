/**
 * Analytics endpoint for client-side page view tracking.
 *
 * Called by the browser on every page navigation. Records the visitor
 * into in-memory telemetry (counters + recent visitors) so it shows up
 * in War Room and Prometheus metrics.
 *
 * For likely-human visitors (person/recruiter), fires one signed webhook ping
 * (deduped 30 min per visitor) with only category, path and country. Bots and
 * crawlers never ping.
 * The ping must never break the endpoint: failures are swallowed and the
 * route always returns 200.
 */
import {
  classifyVisitor,
  recordVisitor,
  recordRequest,
  summarizeUA,
} from "@/lib/telemetry";
import { notifyVisitor } from "@/lib/notify";

export const dynamic = "force-dynamic";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "";
}

export async function POST(req: Request) {
  const start = Date.now();
  const userAgent = req.headers.get("user-agent") || "";
  const referrer = req.headers.get("referer") || "";
  try {
    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
    };
    const path = body.path || "/";

    recordVisitor(path, userAgent, referrer);

    const category = classifyVisitor(userAgent);
    if (category === "person" || category === "recruiter") {
      // Fire-and-forget within the request: notifyVisitor never throws,
      // but a defensive catch keeps the endpoint 200 even if it does.
      await notifyVisitor({
        category,
        path,
        country: req.headers.get("cf-ipcountry") || undefined,
        uaSummary: summarizeUA(userAgent),
        ip: getClientIp(req),
      }).catch(() => {});
    }

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
