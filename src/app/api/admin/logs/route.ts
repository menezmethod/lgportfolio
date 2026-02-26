import { Logging } from "@google-cloud/logging";
import { NextResponse } from "next/server";

function isAdmin(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return header === secret;
}

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    return NextResponse.json(
      { error: "GOOGLE_CLOUD_PROJECT not set", entries: [] },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const url = new URL(req.url);
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));
  const minutes = Math.min(1440, Math.max(1, parseInt(url.searchParams.get("minutes") || "60", 10)));
  const severity = url.searchParams.get("severity") || "";

  try {
    const logging = new Logging({ projectId });
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    let filter = `resource.type="cloud_run_revision" AND resource.labels.service_name="lgportfolio" AND timestamp >= "${cutoff.toISOString()}"`;
    if (severity) {
      filter += ` AND severity=${severity}`;
    }
    const [entries] = await logging.getEntries({
      filter,
      orderBy: "timestamp desc",
      maxResults: limit,
    });

    const out = (entries || []).map((e: { metadata?: Record<string, unknown> }) => {
      const meta = (e?.metadata || {}) as Record<string, unknown>;
      const json = meta.jsonPayload as Record<string, unknown> | undefined;
      const trace = meta["logging.googleapis.com/trace"] as string | undefined;
      const traceId = typeof trace === "string" ? trace.split("/").pop() : "";
      return {
        timestamp: meta.timestamp,
        severity: meta.severity,
        message: (meta.message as string) || (json?.message as string) || "",
        trace_id: (json?.trace_id as string) || traceId || "",
        endpoint: (json?.endpoint as string) || "",
        ...(json && typeof json === "object" ? { fields: json } : {}),
      };
    });

    return NextResponse.json({ entries: out, project_id: projectId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to fetch logs", message: msg, entries: [] },
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
