/**
 * Visitor-presence pings (Telegram + optional webhook).
 *
 * Called from /api/analytics/page-view for likely-human visitors only
 * (category "person" | "recruiter" — bots/crawlers never reach here).
 * Deduped: one ping per visitor per 30 minutes.
 *
 * Never throws and never logs secrets (token / chat id stay out of logs).
 */

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

function pingText(ping: VisitorPing): string {
  const ref = ping.referrer ? ` (ref: ${ping.referrer.slice(0, 80)})` : "";
  return `Visitor [${ping.category}]: ${ping.path.slice(0, 120)} — ${ping.uaSummary.slice(0, 60)}${ref}`;
}

async function sendTelegram(token: string, chatId: string, text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    log("WARNING", "Visitor telegram ping failed", { status: res.status });
  }
}

async function sendWebhook(url: string, ping: VisitorPing): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...ping, timestamp: new Date().toISOString() }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    log("WARNING", "Visitor webhook ping failed", { status: res.status });
  }
}

/**
 * Send a visitor-presence ping. Returns true when a ping was attempted.
 * No-op (false) when unconfigured, owner-excluded, or deduped. Never throws.
 */
export async function notifyVisitor(ping: VisitorPing): Promise<boolean> {
  try {
    // Owner exclusion: the owner's own IPs never ping.
    if (ping.ip && getOwnerIps().includes(ping.ip)) return false;

    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    const webhookUrl = process.env.VISITOR_WEBHOOK_URL?.trim();
    const telegramConfigured = Boolean(token && chatId);
    if (!telegramConfigured && !webhookUrl) return false;

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

    const text = pingText(ping);
    const sends: Array<Promise<void>> = [];
    if (telegramConfigured) sends.push(sendTelegram(token!, chatId!, text));
    if (webhookUrl) sends.push(sendWebhook(webhookUrl, ping));
    await Promise.all(sends);
    return true;
  } catch {
    log("WARNING", "Visitor ping failed", { path: ping.path });
    return false;
  }
}
