import { incrementAdminMetric, recordRequest } from "@/lib/telemetry";
import { isAdminRequest } from "@/lib/admin-auth";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  const start = Date.now();
  if (!isAdminRequest(req)) {
    recordRequest("/api/admin/board/view", "GET", 401, Date.now() - start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  incrementAdminMetric("board_views");
  recordRequest("/api/admin/board/view", "GET", 200, Date.now() - start);
  return NextResponse.json({ ok: true });
}
