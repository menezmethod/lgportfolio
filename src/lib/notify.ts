/**
 * Visitor messages to an owner-controlled webhook (Hermes → Telegram).
 *
 * Sent by src/lib/visits.ts: one digest per visit after 30 idle minutes, and at most
 * one alert per visit for high intent. Both use event_type "visitor-pageview" (the only
 * type the Hermes receiver accepts) with `kind` "digest" or "alert". Visits from OWNER_IPS
 * never send; owner-cookie browsers never reach visits.ts (see src/lib/owner.ts).
 *
 * The body is signed (HMAC-SHA256 in X-Hub-Signature-256, key VISITOR_WEBHOOK_SECRET)
 * and POSTed to VISITOR_WEBHOOK_URL. It always carries the older fields (category,
 * path, referrer, uaSummary, country, timestamp, ip) plus `text`, a ready-to-post
 * message. Set VISITOR_PING_OMIT_IP=1 to leave ip out of the body.
 *
 * Never throws. Never logs the IP, the payload, or any secret.
 */

import { createHmac } from "node:crypto";
import { log } from "./telemetry";

const FETCH_TIMEOUT_MS = 8000;

function getOwnerIps(): string[] {
  return (process.env.OWNER_IPS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** POST a signed visitor message. Returns true when a send was attempted. */
export async function sendVisitorWebhook(payload: Record<string, unknown>, ip: string): Promise<boolean> {
  try {
    if (ip && getOwnerIps().includes(ip)) return false;
    const webhookUrl = process.env.VISITOR_WEBHOOK_URL?.trim();
    if (!webhookUrl) return false;

    const omitIp = process.env.VISITOR_PING_OMIT_IP === "1";
    const body = JSON.stringify({ ...payload, ...(!omitIp && ip ? { ip } : {}) });
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const secret = process.env.VISITOR_WEBHOOK_SECRET?.trim();
    if (secret) {
      headers["X-Hub-Signature-256"] = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    }
    const res = await fetch(webhookUrl, { method: "POST", headers, body, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) log("WARNING", "Visitor webhook failed", { status: res.status });
    return true;
  } catch {
    log("WARNING", "Visitor webhook failed", { event_type: String(payload.event_type ?? "") });
    return false;
  }
}
