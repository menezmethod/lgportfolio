/**
 * Firestore client for chat session analytics and conversation memory.
 * GCP-only; no PII in analytics docs. Message content stored only in memory collection for context.
 */

import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore, Timestamp } from "firebase-admin/firestore";

let _db: Firestore | null = null;

function getCredentials(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    return null;
  }
}

export function getDb(): Firestore | null {
  if (_db) return _db;
  const creds = getCredentials();
  if (!creds) return null;
  if (!getApps().length) {
    initializeApp({ credential: cert(creds) });
  }
  _db = getFirestore();
  return _db;
}

export const COLLECTIONS = {
  SESSIONS: "chat_sessions",
  MEMORY: "chat_memory",
} as const;

/** Session analytics only — no message content (PII-safe). */
export interface ChatSessionDoc {
  session_id: string;
  started_at: Timestamp | Date;
  last_activity_at: Timestamp | Date;
  message_count: number;
  cache_hits: number;
  rate_limited: boolean;
  status: "ok" | "error" | "rate_limited";
  total_duration_ms?: number;
  trace_id?: string;
  engagement_score?: number;
  recruiter_email?: string | null;
}

/** Conversation memory for context (role + content). */
export interface ChatMemoryDoc {
  session_id: string;
  updated_at: Timestamp | Date;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

const MAX_MEMORY_MESSAGES = 20;

export async function writeSessionSummary(params: {
  sessionId: string;
  messageCount: number;
  cacheHits: number;
  rateLimited: boolean;
  status: "ok" | "error" | "rate_limited";
  totalDurationMs?: number;
  traceId?: string;
  engagementScore?: number;
  recruiterEmail?: string | null;
}): Promise<void> {
  const db = getDb();
  if (!db) return;

  const now = new Date();
  const ref = db.collection(COLLECTIONS.SESSIONS).doc(params.sessionId);
  const existing = await ref.get();

  const data: Partial<ChatSessionDoc> = {
    session_id: params.sessionId,
    last_activity_at: now,
    message_count: params.messageCount,
    cache_hits: params.cacheHits,
    rate_limited: params.rateLimited,
    status: params.status,
    total_duration_ms: params.totalDurationMs,
    trace_id: params.traceId,
    engagement_score: params.engagementScore,
    ...(params.recruiterEmail !== undefined && { recruiter_email: params.recruiterEmail }),
  };

  if (!existing.exists) {
    await ref.set({
      ...data,
      started_at: now,
    });
  } else {
    await ref.update(data);
  }
}

export async function getSessionMemory(sessionId: string): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const db = getDb();
  if (!db) return [];

  const snap = await db.collection(COLLECTIONS.MEMORY).doc(sessionId).get();
  const doc = snap.data() as ChatMemoryDoc | undefined;
  if (!doc?.messages?.length) return [];
  return doc.messages.slice(-MAX_MEMORY_MESSAGES);
}

export async function appendSessionMemory(
  sessionId: string,
  newMessages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<void> {
  const db = getDb();
  if (!db) return;

  const ref = db.collection(COLLECTIONS.MEMORY).doc(sessionId);
  const existing = await getSessionMemory(sessionId);
  const merged = [...existing, ...newMessages].slice(-MAX_MEMORY_MESSAGES);

  await ref.set({
    session_id: sessionId,
    updated_at: new Date(),
    messages: merged,
  });
}

/** Get session stats for dynamic rate limit (engagement-based). */
export async function getSessionStats(
  sessionId: string
): Promise<{ message_count: number; engagement_score: number; cache_hits: number }> {
  const db = getDb();
  if (!db) return { message_count: 0, engagement_score: 0, cache_hits: 0 };

  const snap = await db.collection(COLLECTIONS.SESSIONS).doc(sessionId).get();
  const doc = snap.data() as ChatSessionDoc | undefined;
  if (!doc) return { message_count: 0, engagement_score: 0, cache_hits: 0 };
  return {
    message_count: doc.message_count ?? 0,
    engagement_score: doc.engagement_score ?? 0,
    cache_hits: doc.cache_hits ?? 0,
  };
}

export async function setRecruiterEmail(sessionId: string, email: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  const ref = db.collection(COLLECTIONS.SESSIONS).doc(sessionId);
  await ref.update({
    recruiter_email: email,
    last_activity_at: new Date(),
  });
}

/** List recent sessions for admin (no message content). */
export async function listSessions(limit = 50): Promise<ChatSessionDoc[]> {
  const db = getDb();
  if (!db) return [];

  const snap = await db
    .collection(COLLECTIONS.SESSIONS)
    .orderBy("last_activity_at", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as ChatSessionDoc);
}

/** Get one session + full conversation for admin. */
export async function getSessionWithMemory(sessionId: string): Promise<{
  session: ChatSessionDoc | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}> {
  const db = getDb();
  if (!db) return { session: null, messages: [] };

  const [sessionSnap, memorySnap] = await Promise.all([
    db.collection(COLLECTIONS.SESSIONS).doc(sessionId).get(),
    db.collection(COLLECTIONS.MEMORY).doc(sessionId).get(),
  ]);

  const session = sessionSnap.exists ? (sessionSnap.data() as ChatSessionDoc) : null;
  const mem = memorySnap.data() as ChatMemoryDoc | undefined;
  const messages = mem?.messages ?? [];
  return { session, messages };
}
