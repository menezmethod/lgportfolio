/**
 * Visits: group a likely-human visitor's requests and send ONE digest to the
 * owner's webhook after 30 minutes without activity, plus an instant alert for
 * high intent (resume download, or a chat question from a ?src=-tagged visit).
 *
 * The visitor key (hash of IP + user-agent) lives only in this process's memory.
 * It is never written to D1 or logs.
 *
 * ponytail: in-memory only, so a deploy or restart drops visits still in
 * progress (their digest is never sent). Persist to D1 if that becomes a problem.
 */

import { createHash } from "node:crypto";
import { sendVisitorWebhook } from "./notify";
import { lookupApplication, type Application } from "./chat-store";

export const IDLE_MS = 30 * 60 * 1000;
const MAX_VISITS = 500;
const MAX_PAGES = 25;
const MAX_QUESTIONS = 10;

export type Intent = "high" | "medium" | "low";

export interface VisitContext {
  ip: string;
  userAgent: string;
  category: string;
  country?: string;
  region?: string;
  city?: string;
  network?: string;
}

interface Page {
  path: string;
  at: number;
  ms?: number;
}

interface Visit {
  ctx: VisitContext;
  firstAt: number;
  lastAt: number;
  referrer: string;
  src: string | null;
  pages: Page[];
  clicks: string[];
  questions: string[];
  alerted: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

const visits = new Map<string, Visit>();

/** Test hook. */
export function clearVisits(): void {
  for (const v of visits.values()) clearTimeout(v.timer);
  visits.clear();
}

export function visitKey(ip: string, userAgent: string): string {
  return createHash("sha256").update(`${ip}|${userAgent}`).digest("hex").slice(0, 16);
}

/** "Safari on iPhone (iOS)", "Chrome on Mac", "Firefox on Windows". */
export function describeDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  const browser =
    ua.includes("linkedinapp") ? "LinkedIn app"
    : ua.includes("edg/") ? "Edge"
    : ua.includes("firefox/") || ua.includes("fxios/") ? "Firefox"
    : ua.includes("crios/") || ua.includes("chrome/") ? "Chrome"
    : ua.includes("safari/") ? "Safari"
    : "Browser";
  const device =
    ua.includes("iphone") ? "iPhone (iOS)"
    : ua.includes("ipad") ? "iPad"
    : ua.includes("android") ? (ua.includes("mobile") ? "Android phone" : "Android tablet")
    : ua.includes("cros") ? "Chromebook"
    : ua.includes("mac os x") || ua.includes("macintosh") ? "Mac"
    : ua.includes("windows") ? "Windows"
    : ua.includes("linux") ? "Linux"
    : "unknown device";
  return `${browser} on ${device}`;
}

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m}m${s % 60}s` : `${m}m`;
}

function hostOf(origin: string): string {
  try {
    return new URL(origin).hostname.replace(/^www\./, "");
  } catch {
    return origin;
  }
}

export function intentOf(v: Pick<Visit, "pages" | "clicks" | "questions" | "src" | "firstAt" | "lastAt">): Intent {
  if (v.clicks.includes("resume_download") || v.questions.length > 0) return "high";
  const workPages = v.pages.filter((p) => p.path.startsWith("/work/")).length;
  if (v.src && v.pages.length >= 2) return "high";
  if (workPages >= 1 || v.pages.length >= 3 || v.lastAt - v.firstAt >= 60_000) return "medium";
  return "low";
}

function locationOf(ctx: VisitContext): string {
  return [ctx.city, ctx.region, ctx.country].filter(Boolean).join(", ");
}

function appLine(app: Application | null, src: string | null): string {
  if (app) return `${app.company}${app.role ? `, ${app.role}` : ""} (applied ${app.applied_at}, ${app.status})`;
  return src ? `src=${src} (no matching application)` : "";
}

/** Plain-text digest, kept under Telegram's 4096-character limit. */
export function digestText(v: Visit, app: Application | null): string {
  const intent = intentOf(v);
  const lines = [
    `${intent.toUpperCase()} intent visit, ${fmtDuration(v.lastAt - v.firstAt)}, ${v.pages.length} page${v.pages.length === 1 ? "" : "s"}${app ? ` — ${app.company}` : ""}`,
  ];
  const appText = appLine(app, v.src);
  if (appText) lines.push(`Application: ${appText}`);
  lines.push(`From: ${v.referrer ? hostOf(v.referrer) : "direct"}${v.src ? ` · src=${v.src}` : ""}`);
  lines.push(
    `Who: ${v.ctx.category} · ${describeDevice(v.ctx.userAgent)}${locationOf(v.ctx) ? ` · ${locationOf(v.ctx)}` : ""}${v.ctx.network ? ` · ${v.ctx.network}` : ""}`
  );
  const pages = v.pages.map((p) => `${p.path}${p.ms !== undefined ? ` (${fmtDuration(p.ms)})` : ""}`).join(" → ");
  lines.push(`Pages: ${pages}`);
  if (v.clicks.length) lines.push(`Clicks: ${v.clicks.join(", ")}`);
  for (const q of v.questions) lines.push(`Chat: "${q}"`);
  lines.push(`Started ${new Date(v.firstAt).toISOString()}`);
  return lines.join("\n").slice(0, 3900);
}

/**
 * The Hermes template on the server prints only
 * "Visitor [{path}] via {uaSummary}, ref {referrer}, {timestamp}". So these four
 * fields carry the digest itself; the plain values are also sent as entry_path,
 * device and referrer_host, and the multi-line version as `text`.
 */
function templateFields(v: Visit, app: Application | null, headline: string) {
  const short = app ? `${app.company} (applied ${app.applied_at}, ${app.status})` : v.src ? `src=${v.src}, no matching application` : "";
  const pages = v.pages.map((p) => `${p.path}${p.ms !== undefined ? ` ${fmtDuration(p.ms)}` : ""}`).join(" → ");
  const who = [describeDevice(v.ctx.userAgent), locationOf(v.ctx), v.ctx.network, v.ctx.category].filter(Boolean).join(" · ");
  const extras = [
    v.referrer ? hostOf(v.referrer) : "direct",
    v.src ? `src=${v.src}` : "",
    v.clicks.length ? `clicks: ${v.clicks.join(", ")}` : "",
    ...v.questions.map((q) => `chat: "${q}"`),
  ].filter(Boolean).join(" · ");
  return {
    path: [headline, short, pages].filter(Boolean).join(" · ").slice(0, 1500),
    uaSummary: who.slice(0, 300),
    referrer: extras.slice(0, 1800),
    timestamp: new Date(v.firstAt).toISOString(),
  };
}

function basePayload(v: Visit) {
  return {
    category: v.ctx.category,
    entry_path: v.pages[0]?.path ?? "/",
    referrer_host: v.referrer ? hostOf(v.referrer) : "direct",
    device: describeDevice(v.ctx.userAgent),
    country: v.ctx.country,
    region: v.ctx.region,
    city: v.ctx.city,
    network: v.ctx.network,
    src: v.src ?? undefined,
    sent_at: new Date().toISOString(),
  };
}

async function flush(key: string): Promise<void> {
  const v = visits.get(key);
  if (!v) return;
  visits.delete(key);
  clearTimeout(v.timer);
  // Time on the last page: until the last activity, unless a leave beacon measured it.
  const last = v.pages[v.pages.length - 1];
  if (last && last.ms === undefined && v.lastAt > last.at) last.ms = v.lastAt - last.at;
  const app = v.src ? await lookupApplication(v.src).catch(() => null) : null;
  await sendVisitorWebhook(
    {
      // Hermes accepts only event_type "visitor-pageview"; `kind` tells digest from alert.
      event_type: "visitor-pageview",
      kind: "digest",
      ...basePayload(v),
      ...templateFields(v, app, `${intentOf(v).toUpperCase()} intent, ${fmtDuration(v.lastAt - v.firstAt)}`),
      intent: intentOf(v),
      application: app?.company,
      text: digestText(v, app),
    },
    v.ctx.ip
  );
}

/** Send all pending digests now (tests and graceful shutdown). */
export async function flushAllVisits(): Promise<void> {
  await Promise.all([...visits.keys()].map(flush));
}

function schedule(key: string, v: Visit) {
  clearTimeout(v.timer);
  v.timer = setTimeout(() => void flush(key), IDLE_MS);
  v.timer.unref?.();
}

function getOrStart(ctx: VisitContext, now: number): [string, Visit] {
  const key = visitKey(ctx.ip, ctx.userAgent);
  let v = visits.get(key);
  if (!v) {
    if (visits.size >= MAX_VISITS) {
      const oldest = [...visits.entries()].sort((a, b) => a[1].lastAt - b[1].lastAt)[0];
      if (oldest) void flush(oldest[0]);
    }
    v = { ctx, firstAt: now, lastAt: now, referrer: "", src: null, pages: [], clicks: [], questions: [], alerted: false };
    visits.set(key, v);
  }
  // Location headers can be missing on some requests; keep what was seen first.
  v.ctx = { ...ctx, country: v.ctx.country || ctx.country, region: v.ctx.region || ctx.region, city: v.ctx.city || ctx.city, network: v.ctx.network || ctx.network };
  return [key, v];
}

async function maybeAlert(v: Visit, reason: string): Promise<void> {
  if (v.alerted) return;
  v.alerted = true;
  const app = v.src ? await lookupApplication(v.src).catch(() => null) : null;
  const who = [describeDevice(v.ctx.userAgent), locationOf(v.ctx), v.ctx.network].filter(Boolean).join(" · ");
  const text = [
    `NOW: ${reason}${app ? ` — ${app.company}` : ""}`,
    appLine(app, v.src),
    `From: ${v.referrer ? hostOf(v.referrer) : "direct"} · ${who}`,
    `Pages so far: ${v.pages.map((p) => p.path).join(" → ")}`,
  ].filter(Boolean).join("\n");
  await sendVisitorWebhook(
    { event_type: "visitor-pageview", kind: "alert", ...basePayload(v), ...templateFields(v, app, `NOW: ${reason}`), text },
    v.ctx.ip
  );
}

/** A page view. `referrer` (origin) and `src` count only on the first page of a visit. */
export async function recordPageVisit(ctx: VisitContext, path: string, referrer: string, src: string | null): Promise<void> {
  const now = Date.now();
  const [key, v] = getOrStart(ctx, now);
  if (v.pages.length === 0) {
    v.referrer = referrer;
    v.src = src;
  } else if (!v.src && src) {
    v.src = src;
  }
  const prev = v.pages[v.pages.length - 1];
  if (prev && prev.ms === undefined) prev.ms = now - prev.at;
  if (v.pages.length < MAX_PAGES) v.pages.push({ path, at: now });
  v.lastAt = now;
  schedule(key, v);
}

/** Time on a page, from the browser's pagehide/visibilitychange beacon. */
export function recordLeave(ctx: VisitContext, path: string, ms: number): void {
  const v = visits.get(visitKey(ctx.ip, ctx.userAgent));
  if (!v) return;
  const page = [...v.pages].reverse().find((p) => p.path === path);
  if (page && Number.isFinite(ms) && ms >= 0 && ms < IDLE_MS) page.ms = Math.round(ms);
  v.lastAt = Math.max(v.lastAt, Date.now());
  schedule(visitKey(ctx.ip, ctx.userAgent), v);
}

export async function recordClick(ctx: VisitContext, name: string): Promise<void> {
  const now = Date.now();
  const [key, v] = getOrStart(ctx, now);
  if (!v.clicks.includes(name)) v.clicks.push(name);
  v.lastAt = now;
  schedule(key, v);
  if (name === "resume_download") await maybeAlert(v, "resume downloaded");
}

export async function recordQuestion(ctx: VisitContext, question: string): Promise<void> {
  const now = Date.now();
  const [key, v] = getOrStart(ctx, now);
  if (v.questions.length < MAX_QUESTIONS) v.questions.push(question.replace(/\s+/g, " ").trim().slice(0, 200));
  v.lastAt = now;
  schedule(key, v);
  if (v.src) await maybeAlert(v, "asked the chat a question");
}
