import { getPrometheusText, recordRequest } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === secret;
}

export async function GET(req: Request) {
  const start = Date.now();
  if (!isAdmin(req)) {
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
