/**
 * Visitor-presence pings to an owner-controlled webhook.
 *
 * Called from /api/analytics/page-view for likely-human visitors only
 * (category "person" | "recruiter"; bots and crawlers never reach here).
 * Deduped: one ping per visitor per 30 minutes. Visits from OWNER_IPS never ping.
 *
 * The site POSTs a signed JSON payload (HMAC-SHA256 in X-Hub-Signature-256, key
 * VISITOR_WEBHOOK_SECRET) to VISITOR_WEBHOOK_URL. The body is:
 *   { event_type: "visitor-pageview", category, path, referrer, uaSummary, ip,
 *     country (when the CDN header is present), timestamp }
 * Set VISITOR_PING_OMIT_IP=1 to leave ip out of the body.
 *
 * The visitor IP is also hashed (sha256, truncated) into the in-memory dedupe key.
 * Never throws. Never logs the IP, the payload, or any secret.
 */

import { createHash, createHmac } from "node:crypto";
import { log } from "./telemetry";

const DEDUPE_WINDOW_MS = 30 * 60 * 1000;
const MAX_DEDUPE_ENTRIES = 1000;
const FETCH_TIMEOUT_MS = 8000;

const seen = new Map<string, number>();

/** Test hook: clear the in-memory dedupe cache. */
export function clearVisitorNotifyCache(): void {
  seen.clear();
}

function getOwnerIps(): string[] {
  return (process.env.OWNER_IPS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface VisitorPing {
  category: string;
  path: string;
  referrer: string;
  uaSummary: string;
  ip: string;
  /** Country code from the CDN header, if present. */
  country?: string;
}

function dedupeKey(ping: VisitorPing): string {
  return createHash("sha256")
    .update(`${ping.ip}|${ping.category}|${ping.uaSummary}`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Send a visitor-presence ping. Returns true when a ping was attempted.
 * No-op (false) when unconfigured, owner-excluded, or deduped. Never throws.
 */
export async function notifyVisitor(ping: VisitorPing): Promise<boolean> {
  try {
    // Owner exclusion: the owner's own IPs never ping.
    if (ping.ip && getOwnerIps().includes(ping.ip)) return false;

    const webhookUrl = process.env.VISITOR_WEBHOOK_URL?.trim();
    if (!webhookUrl) return false;

    // Dedupe: one ping per visitor per 30 min.
    const now = Date.now();
    for (const [k, t] of seen) {
      if (now - t > DEDUPE_WINDOW_MS) seen.delete(k);
    }
    const key = dedupeKey(ping);
    const last = seen.get(key);
    if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;
    seen.set(key, now);
    if (seen.size > MAX_DEDUPE_ENTRIES) {
      let oldestKey: string | undefined;
      let oldestTs = Infinity;
      for (const [k, t] of seen) {
        if (t < oldestTs) {
          oldestTs = t;
          oldestKey = k;
        }
      }
      if (oldestKey) seen.delete(oldestKey);
    }

    const omitIp = process.env.VISITOR_PING_OMIT_IP === "1";
    const body = JSON.stringify({
      event_type: "visitor-pageview",
      category: ping.category,
      path: ping.path,
      referrer: ping.referrer,
      uaSummary: ping.uaSummary,
      ...(!omitIp && { ip: ping.ip }),
      ...(ping.country && { country: ping.country }),
      timestamp: new Date().toISOString(),
    });
    const secret = process.env.VISITOR_WEBHOOK_SECRET?.trim();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (secret) {
      headers["X-Hub-Signature-256"] =
        "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    }
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      log("WARNING", "Visitor webhook ping failed", { status: res.status });
    }
    return true;
  } catch {
    log("WARNING", "Visitor ping failed", { path: ping.path });
    return false;
  }
}
