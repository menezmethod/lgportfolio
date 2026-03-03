import { getSessionWithMemory } from "@/lib/firestore";
import { incrementAdminMetric, recordRequest } from "@/lib/telemetry";
import { NextResponse } from "next/server";

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === secret;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const start = Date.now();
  if (!isAdmin(req)) {
    recordRequest("/api/admin/sessions/[id]", "GET", 401, Date.now() - start);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  incrementAdminMetric("conversation_detail");
  const { id } = await params;
  const data = await getSessionWithMemory(id);
  recordRequest("/api/admin/sessions/[id]", "GET", 200, Date.now() - start);
  return NextResponse.json(data);
}
