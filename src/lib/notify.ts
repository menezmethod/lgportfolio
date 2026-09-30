/**
 * Visitor ping: Telegram message and/or JSON webhook. Fire-and-forget, deduped per visitor.
 * Env: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID, and/or VISITOR_WEBHOOK_URL (JSON POST).
 *
 * Privacy: a ping carries only a coarse category, the page path, and the country code from the
 * CDN header. It never includes an IP address, a user-agent string, or the referrer.
 */
const seen = new Map<string, number>(); // in-memory, resets on restart; fine for pings
const DEDUPE_MS = 30 * 60 * 1000;

export function notifyVisitor(v: {
  /** Dedupe key only. Never sent anywhere. */
  key: string;
  category: string;
  path: string;
  country?: string;
}): void {
  const now = Date.now();
  for (const [k, t] of seen) if (now - t > DEDUPE_MS) seen.delete(k);
  if (seen.has(v.key)) return;
  seen.set(v.key, now);

  const payload = { category: v.category, path: v.path, ...(v.country && { country: v.country }) };
  const text = `Visit on gimenez.dev (${payload.category}): ${payload.path}${payload.country ? `, ${payload.country}` : ""}`;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (token && chat) {
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    }).catch(() => {});
  }
  const hook = process.env.VISITOR_WEBHOOK_URL;
  if (hook) {
    fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, ...payload }),
    }).catch(() => {});
  }
}
