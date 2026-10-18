/**
 * Time on page: the browser sends { path, ms } with navigator.sendBeacon when a page
 * is hidden or closed (text/plain body). Feeds the visit digest only; nothing is saved.
 * Always returns 204.
 */
import { recordRequest, visitContext } from "@/lib/telemetry";
import { recordLeave } from "@/lib/visits";
import { isOwnerRequest } from "@/lib/owner";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const start = Date.now();
  const ctx = visitContext(req);
  if (!isOwnerRequest(req) && (ctx.category === "person" || ctx.category === "recruiter")) {
    try {
      const body = JSON.parse((await req.text()).slice(0, 500)) as { path?: unknown; ms?: unknown };
      if (typeof body.path === "string" && body.path.startsWith("/") && typeof body.ms === "number") {
        recordLeave(ctx, body.path.slice(0, 200), body.ms);
      }
    } catch {
      /* malformed beacon: ignore */
    }
  }
  recordRequest("/api/analytics/leave", "POST", 204, Date.now() - start);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
