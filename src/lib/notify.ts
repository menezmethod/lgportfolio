/**
 * Visitor-presence pings via the Hermes webhook.
 *
 * Called from /api/analytics/page-view for likely-human visitors only
 * (category "person" | "recruiter" — bots/crawlers never reach here).
 * Deduped: one ping per visitor per 30 minutes.
 *
 * The site POSTs a signed JSON payload to the Hermes webhook
 * (VISITOR_WEBHOOK_URL + VISITOR_WEBHOOK_SECRET); the Hermes agent
 * formats the reply and delivers it to Telegram. The site never talks
 * to Telegram directly, so each visit yields exactly one message.
 *
 * Never throws and never logs secrets.
 */

import { createHmac } from "node:crypto";
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
}

function dedupeKey(ping: VisitorPing): string {
  return `${ping.ip}|${ping.category}|${ping.uaSummary}`;
}

/**
 * Send a visitor-presence ping to the Hermes webhook. Returns true when a
 * ping was attempted. No-op (false) when unconfigured, owner-excluded, or
 * deduped. Never throws.
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

    const body = JSON.stringify({
      event_type: "visitor-pageview",
      ...ping,
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
