import { getBoardStats } from "@/lib/firestore";
import { isAdminRequest } from "@/lib/admin-auth";
import { recordRequest } from "@/lib/telemetry";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  const start = Date.now();
  if (!isAdminRequest(req)) {
    recordRequest("/api/admin/board/stats", "GET", 401, Date.now() - start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const days = Math.min(30, Math.max(1, parseInt(url.searchParams.get("days") || "7", 10)));
  const stats = await getBoardStats(days);
  recordRequest("/api/admin/board/stats", "GET", 200, Date.now() - start);
  return NextResponse.json(stats);
}
