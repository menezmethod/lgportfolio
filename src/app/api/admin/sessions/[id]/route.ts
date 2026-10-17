import { getSessionWithMemory } from "@/lib/firestore";
import { isAdminRequest } from "@/lib/admin-auth";
import { incrementAdminMetric, recordRequest } from "@/lib/telemetry";
import { NextResponse } from "next/server";


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  if (!isAdminRequest(req)) {
    recordRequest("/api/admin/sessions/[id]", "GET", 401, Date.now() - start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  incrementAdminMetric("conversation_detail");
  const { id } = await params;
  const data = await getSessionWithMemory(id);
  recordRequest("/api/admin/sessions/[id]", "GET", 200, Date.now() - start);
  return NextResponse.json(data);
}
