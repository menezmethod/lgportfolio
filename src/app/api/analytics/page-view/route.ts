/**
 * Analytics endpoint for client-side page view tracking.
 *
 * Called by the browser on every page navigation. Records the visitor
 * into in-memory telemetry (counters + recent visitors) so it shows up
 * in War Room and Prometheus metrics.
 *
 * For likely-human visitors (person/recruiter) it also saves a durable page view
 * and adds the page to the visitor's visit; src/lib/visits.ts sends one digest per
 * visit. Bots, crawlers and owner browsers are skipped. Failures are swallowed and
 * the route always returns 200.
 */
import {
  classifyVisitor,
  externalReferrer,
  siteHost,
  recordVisitor,
  recordRequest,
  visitContext,
} from "@/lib/telemetry";
import { recordPageVisit } from "@/lib/visits";
import { recordSiteEvent } from "@/lib/chat-store";
import { isOwnerRequest } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const start = Date.now();
  const userAgent = req.headers.get("user-agent") || "";
  if (isOwnerRequest(req)) {
    recordRequest("/api/analytics/page-view", "POST", 204, Date.now() - start);
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as {
      path?: string;
      src?: string;
      ref?: string;
    };
    const path = body.path || "/";
    const referrer = externalReferrer(body.ref, siteHost(req));

    recordVisitor(path, userAgent, referrer);

    const category = classifyVisitor(userAgent);
    if (category === "person" || category === "recruiter") {
      // Durable page view (path and optional ?src= tag only); the in-memory counters reset on restart.
      const src = typeof body.src === "string" && /^[a-z0-9-]{1,40}$/.test(body.src) ? body.src : null;
      await recordSiteEvent("page_view", path, src).catch(() => {});
      // Visit grouping: one digest after 30 idle minutes (src/lib/visits.ts).
      await recordPageVisit(visitContext(req), path, referrer, src).catch(() => {});
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
