/**
 * GET /api/owner?key=<OWNER_KEY> marks this browser as the owner's (no pings, no saved events).
 * GET /api/owner?off=1 removes the mark. Wrong or missing key: 404, nothing set.
 */
import { isOwnerKey, ownerCookieValue, OWNER_COOKIE } from "@/lib/owner";

export const dynamic = "force-dynamic";

const HTML = (msg: string) =>
  `<!doctype html><meta name="viewport" content="width=device-width"><title>Owner</title><p style="font:16px system-ui;padding:24px">${msg}</p>`;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const headers = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };
  if (url.searchParams.get("off") === "1") {
    return new Response(HTML("This browser is no longer marked as the owner."), {
      headers: { ...headers, "Set-Cookie": `${OWNER_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` },
    });
  }
  const value = ownerCookieValue();
  if (!value || !isOwnerKey(url.searchParams.get("key"))) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  // 400 days is the longest cookie lifetime browsers accept.
  return new Response(HTML("This browser is marked as the owner. Visits from it send no pings and save no events."), {
    headers: { ...headers, "Set-Cookie": `${OWNER_COOKIE}=${value}; Path=/; Max-Age=34560000; HttpOnly; Secure; SameSite=Lax` },
  });
}
