import { setRecruiterEmail } from "@/lib/firestore";
import { log } from "@/lib/telemetry";

const SECURITY_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_id: sessionId, email } = body as { session_id?: string; email?: string };

    if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), { status: 400, headers: SECURITY_HEADERS });
    }
    const trimmed = (email ?? "").toString().trim();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      return new Response(JSON.stringify({ error: "Valid email required" }), { status: 400, headers: SECURITY_HEADERS });
    }

    await setRecruiterEmail(sessionId, trimmed);
    log("INFO", "Chat session email captured", { session_id: sessionId });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: SECURITY_HEADERS });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to save email" }),
      { status: 503, headers: SECURITY_HEADERS }
    );
  }
}
