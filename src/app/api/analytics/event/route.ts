/**
 * Durable click events: resume download, GitHub, LinkedIn, and email clicks.
 * Saved only for likely-human visitors (person or recruiter); bots and crawlers are ignored.
 * Stores the event name, page path, and time. No IP, user-agent, or session ID.
 * Always returns 204 so analytics never breaks the page.
 */
import { classifyVisitor, recordRequest } from "@/lib/telemetry";
import { recordSiteEvent, SITE_EVENTS, type SiteEvent } from "@/lib/chat-store";

export const dynamic = "force-dynamic";

const CLICK_EVENTS = SITE_EVENTS.filter((e) => e !== "page_view") as SiteEvent[];

export async function POST(req: Request) {
  const start = Date.now();
  const body = (await req.json().catch(() => ({}))) as { name?: unknown; path?: unknown };
  const name = body.name as SiteEvent;
  const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path : null;
  const category = classifyVisitor(req.headers.get("user-agent") || "");

  if (CLICK_EVENTS.includes(name) && path && (category === "person" || category === "recruiter")) {
    await recordSiteEvent(name, path).catch(() => {});
  }
  recordRequest("/api/analytics/event", "POST", 204, Date.now() - start);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
