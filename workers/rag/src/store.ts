/**
 * Chat session store on D1 (binding CHAT_DB). Schema: migrations/0001_chat_store.sql.
 * One POST /store route with an `op` field keeps the app client small.
 * Rows older than RETENTION_DAYS (by last activity) are deleted by the daily cron.
 */

export const RETENTION_DAYS = 180;
const MAX_MEMORY_MESSAGES = 20;
const MAX_LIST = 200;
export const EVENT_NAMES = ["page_view", "resume_download", "github_click", "linkedin_click", "email_click"] as const;

type Msg = { role: "user" | "assistant"; content: string };

interface SessionRow {
  session_id: string;
  started_at: number;
  last_activity_at: number;
  message_count: number;
  cache_hits: number;
  engagement_score: number;
  rate_limited: number;
  status: string | null;
  total_duration_ms: number | null;
  trace_id: string | null;
  recruiter_email: string | null;
}

function toSession(r: SessionRow) {
  return {
    ...r,
    started_at: new Date(r.started_at).toISOString(),
    last_activity_at: new Date(r.last_activity_at).toISOString(),
    rate_limited: Boolean(r.rate_limited),
  };
}

function str(v: unknown, max = 200): string | null {
  return typeof v === "string" && v.length > 0 && v.length <= max ? v : null;
}

function int(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

async function memory(db: D1Database, sessionId: string): Promise<Msg[]> {
  const { results } = await db
    .prepare("SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id DESC LIMIT ?")
    .bind(sessionId, MAX_MEMORY_MESSAGES)
    .all<Msg>();
  return results.reverse();
}

/** Returns a JSON-serializable result, or throws an Error with `status` 400 for bad input. */
export async function handleStoreOp(db: D1Database, body: Record<string, unknown>): Promise<unknown> {
  const op = body.op;
  const sessionId = str(body.session_id);
  const now = Date.now();

  const bad = (msg: string) => Object.assign(new Error(msg), { status: 400 });

  switch (op) {
    case "summary": {
      if (!sessionId) throw bad("session_id required");
      const cacheHit = body.cache_hit ? 1 : 0;
      // Single upsert statement: concurrent first writes cannot both start at message_count 1.
      await db
        .prepare(
          `INSERT INTO chat_sessions (session_id, started_at, last_activity_at, message_count, cache_hits, engagement_score, rate_limited, status, total_duration_ms, trace_id)
           VALUES (?1, ?2, ?2, 1, ?3, 1, ?4, ?5, ?6, ?7)
           ON CONFLICT(session_id) DO UPDATE SET
             last_activity_at = ?2,
             message_count = message_count + 1,
             engagement_score = engagement_score + 1,
             cache_hits = cache_hits + ?3,
             rate_limited = ?4, status = COALESCE(?5, status), total_duration_ms = COALESCE(?6, total_duration_ms), trace_id = COALESCE(?7, trace_id)`
        )
        .bind(sessionId, now, cacheHit, body.rate_limited ? 1 : 0, str(body.status, 20), int(body.total_duration_ms), str(body.trace_id))
        .run();
      return { ok: true };
    }
    case "memory_get": {
      if (!sessionId) throw bad("session_id required");
      return { messages: await memory(db, sessionId) };
    }
    case "memory_append": {
      if (!sessionId) throw bad("session_id required");
      const msgs = (Array.isArray(body.messages) ? body.messages : []).filter(
        (m): m is Msg =>
          !!m && typeof m === "object" &&
          ((m as Msg).role === "user" || (m as Msg).role === "assistant") &&
          typeof (m as Msg).content === "string"
      );
      if (msgs.length === 0) return { ok: true };
      await db.batch([
        ...msgs.map((m) =>
          db
            .prepare("INSERT INTO chat_messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)")
            .bind(sessionId, m.role, m.content.slice(0, 8000), now)
        ),
        db
          .prepare(
            `DELETE FROM chat_messages WHERE session_id = ?1 AND id NOT IN
             (SELECT id FROM chat_messages WHERE session_id = ?1 ORDER BY id DESC LIMIT ?2)`
          )
          .bind(sessionId, MAX_MEMORY_MESSAGES),
      ]);
      return { ok: true };
    }
    case "stats": {
      if (!sessionId) throw bad("session_id required");
      const row = await db
        .prepare("SELECT message_count, engagement_score, cache_hits FROM chat_sessions WHERE session_id = ?")
        .bind(sessionId)
        .first<{ message_count: number; engagement_score: number; cache_hits: number }>();
      return row ?? { message_count: 0, engagement_score: 0, cache_hits: 0 };
    }
    case "email": {
      const email = str(body.email, 254);
      if (!sessionId || !email) throw bad("session_id and email required");
      await db
        .prepare(
          `INSERT INTO chat_sessions (session_id, started_at, last_activity_at, recruiter_email) VALUES (?1, ?2, ?2, ?3)
           ON CONFLICT(session_id) DO UPDATE SET recruiter_email = ?3, last_activity_at = ?2`
        )
        .bind(sessionId, now, email)
        .run();
      return { ok: true };
    }
    case "list": {
      const limit = Math.min(Math.max(int(body.limit) ?? 50, 1), MAX_LIST);
      const { results } = await db
        .prepare("SELECT * FROM chat_sessions ORDER BY last_activity_at DESC LIMIT ?")
        .bind(limit)
        .all<SessionRow>();
      return { sessions: results.map(toSession) };
    }
    case "session": {
      if (!sessionId) throw bad("session_id required");
      const row = await db.prepare("SELECT * FROM chat_sessions WHERE session_id = ?").bind(sessionId).first<SessionRow>();
      return { session: row ? toSession(row) : null, messages: await memory(db, sessionId) };
    }
    case "event": {
      const name = str(body.name, 40);
      const path = str(body.path, 200);
      if (!name || !(EVENT_NAMES as readonly string[]).includes(name) || !path) throw bad("valid name and path required");
      const src = typeof body.src === "string" && /^[a-z0-9-]{1,40}$/.test(body.src) ? body.src : null;
      await db.prepare("INSERT INTO site_events (name, path, src, created_at) VALUES (?, ?, ?, ?)").bind(name, path, src, now).run();
      return { ok: true };
    }
    case "board": {
      const days = Math.min(Math.max(int(body.days) ?? 7, 1), RETENTION_DAYS);
      const since = now - days * 86_400_000;
      const { results: events } = await db
        .prepare("SELECT name, COUNT(*) AS n FROM site_events WHERE created_at >= ? GROUP BY name")
        .bind(since)
        .all<{ name: string; n: number }>();
      const { results: paths } = await db
        .prepare("SELECT path, COUNT(*) AS n FROM site_events WHERE name = 'page_view' AND created_at >= ? GROUP BY path ORDER BY n DESC LIMIT 20")
        .bind(since)
        .all<{ path: string; n: number }>();
      const { results: sources } = await db
        .prepare("SELECT src, COUNT(*) AS n FROM site_events WHERE src IS NOT NULL AND created_at >= ? GROUP BY src ORDER BY n DESC LIMIT 20")
        .bind(since)
        .all<{ src: string; n: number }>();
      const row = await db
        .prepare(
          `SELECT COUNT(*) AS n, SUM(CASE WHEN recruiter_email IS NOT NULL AND TRIM(recruiter_email) <> '' THEN 1 ELSE 0 END) AS e
           FROM chat_sessions WHERE last_activity_at >= ?`
        )
        .bind(since)
        .first<{ n: number; e: number | null }>();
      return {
        sessions_last_n_days: row?.n ?? 0,
        sessions_with_email: row?.e ?? 0,
        events: Object.fromEntries(events.map((e) => [e.name, e.n])),
        top_paths: paths,
        sources,
      };
    }
    default:
      throw bad("unknown op");
  }
}

/** Daily cron: delete sessions (and their messages) idle longer than RETENTION_DAYS, and older site events. */
export async function purgeExpired(db: D1Database): Promise<void> {
  const cutoff = Date.now() - RETENTION_DAYS * 86_400_000;
  await db.batch([
    db
      .prepare("DELETE FROM chat_messages WHERE session_id IN (SELECT session_id FROM chat_sessions WHERE last_activity_at < ?)")
      .bind(cutoff),
    db.prepare("DELETE FROM chat_sessions WHERE last_activity_at < ?").bind(cutoff),
    // Messages whose session row never got written (append without summary) still expire.
    db.prepare("DELETE FROM chat_messages WHERE created_at < ?").bind(cutoff),
    db.prepare("DELETE FROM site_events WHERE created_at < ?").bind(cutoff),
  ]);
}
