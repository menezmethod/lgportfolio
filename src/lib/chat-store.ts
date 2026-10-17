/**
 * Chat session store and durable site events: Cloudflare D1 behind the lgportfolio-rag worker (POST /store).
 * Storage is on whenever the worker key (CLOUDFLARE_RAG_KEY) is set.
 * The worker deletes sessions idle for 180 days and events older than 180 days (daily cron, workers/rag/src/store.ts).
 */

import { workerKey, workerUrl } from "./rag";

const STORE_TIMEOUT_MS = 5_000;

type Msg = { role: "user" | "assistant"; content: string };

/** Session analytics, no message content. Dates are ISO strings. */
export interface ChatSessionDoc {
  session_id: string;
  started_at: string;
  last_activity_at: string;
  message_count: number;
  cache_hits: number;
  rate_limited: boolean;
  status: "ok" | "error" | "rate_limited" | null;
  total_duration_ms?: number | null;
  trace_id?: string | null;
  engagement_score?: number;
  recruiter_email?: string | null;
}

/** True when chats and emails are actually saved. */
export function isStorageConfigured(): boolean {
  return workerKey() !== null;
}

async function store<T>(op: string, args: Record<string, unknown>): Promise<T> {
  const key = workerKey();
  if (!key) throw new Error("Chat storage not configured");
  const res = await fetch(`${workerUrl()}/store`, {
    method: "POST",
    headers: { "x-rag-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ op, ...args }),
    signal: AbortSignal.timeout(STORE_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Chat store ${op} failed: ${res.status}`);
  return (await res.json()) as T;
}

export async function writeSessionSummary(params: {
  sessionId: string;
  cacheHit?: boolean;
  rateLimited: boolean;
  status: "ok" | "error" | "rate_limited";
  totalDurationMs?: number;
  traceId?: string;
}): Promise<void> {
  if (!isStorageConfigured()) return;
  await store("summary", {
    session_id: params.sessionId,
    cache_hit: params.cacheHit,
    rate_limited: params.rateLimited,
    status: params.status,
    total_duration_ms: params.totalDurationMs,
    trace_id: params.traceId,
  });
}

export async function getSessionMemory(sessionId: string): Promise<Msg[]> {
  if (!isStorageConfigured()) return [];
  return (await store<{ messages: Msg[] }>("memory_get", { session_id: sessionId })).messages;
}

export async function appendSessionMemory(sessionId: string, messages: Msg[]): Promise<void> {
  if (!isStorageConfigured()) return;
  await store("memory_append", { session_id: sessionId, messages });
}

/** Session stats for the per-session message limit. */
export async function getSessionStats(
  sessionId: string
): Promise<{ message_count: number; engagement_score: number; cache_hits: number }> {
  if (!isStorageConfigured()) return { message_count: 0, engagement_score: 0, cache_hits: 0 };
  return store("stats", { session_id: sessionId });
}

export async function setRecruiterEmail(sessionId: string, email: string): Promise<void> {
  if (!isStorageConfigured()) return;
  await store("email", { session_id: sessionId, email });
}

/** Recent sessions for admin (no message content). */
export async function listSessions(limit = 50): Promise<ChatSessionDoc[]> {
  if (!isStorageConfigured()) return [];
  return (await store<{ sessions: ChatSessionDoc[] }>("list", { limit })).sessions;
}

/** One session plus its saved messages, for admin. */
export async function getSessionWithMemory(
  sessionId: string
): Promise<{ session: ChatSessionDoc | null; messages: Msg[] }> {
  if (!isStorageConfigured()) return { session: null, messages: [] };
  return store("session", { session_id: sessionId });
}

export const SITE_EVENTS = ["page_view", "resume_download", "github_click", "linkedin_click", "email_click"] as const;
export type SiteEvent = (typeof SITE_EVENTS)[number];

export interface BoardStats {
  sessions_last_n_days: number;
  sessions_with_email: number;
  events: Partial<Record<SiteEvent, number>>;
  top_paths: Array<{ path: string; n: number }>;
  sources: Array<{ src: string; n: number }>;
}

/** Durable event for a likely-human visitor. No IP, user-agent or session ID is sent. */
export async function recordSiteEvent(name: SiteEvent, path: string, src?: string | null): Promise<void> {
  if (!isStorageConfigured()) return;
  await store("event", { name, path: path.slice(0, 200), src: src ?? undefined });
}

/** Admin board summary for the last N days: chat sessions, emails left, site events, top paths, ?src= tags. */
export async function getBoardStats(days = 7): Promise<BoardStats> {
  if (!isStorageConfigured()) {
    return { sessions_last_n_days: 0, sessions_with_email: 0, events: {}, top_paths: [], sources: [] };
  }
  return store("board", { days });
}
