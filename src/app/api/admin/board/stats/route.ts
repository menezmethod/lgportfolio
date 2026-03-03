import { getBoardStats } from "@/lib/firestore";
import { recordRequest } from "@/lib/telemetry";
import { NextResponse } from "next/server";

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === secret;
}

export async function GET(req: Request) {
  const start = Date.now();
  if (!isAdmin(req)) {
    recordRequest("/api/admin/board/stats", "GET", 401, Date.now() - start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const days = Math.min(30, Math.max(1, parseInt(url.searchParams.get("days") || "7", 10)));
  const stats = await getBoardStats(days);
  recordRequest("/api/admin/board/stats", "GET", 200, Date.now() - start);
  return NextResponse.json(stats);
}
