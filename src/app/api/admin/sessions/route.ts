import { listSessions } from "@/lib/firestore";
import { isAdminRequest } from "@/lib/admin-auth";
import { incrementAdminMetric, recordRequest } from "@/lib/telemetry";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  const start = Date.now();
  if (!isAdminRequest(req)) {
    recordRequest("/api/admin/sessions", "GET", 401, Date.now() - start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  incrementAdminMetric("sessions_list");
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  const sessions = await listSessions(limit);
  recordRequest("/api/admin/sessions", "GET", 200, Date.now() - start);
  return NextResponse.json({ sessions });
}
