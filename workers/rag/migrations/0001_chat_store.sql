-- Chat sessions and messages for the gimenez.dev chat (admin review and follow-up).
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id TEXT PRIMARY KEY,
  started_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  cache_hits INTEGER NOT NULL DEFAULT 0,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  rate_limited INTEGER NOT NULL DEFAULT 0,
  status TEXT,
  total_duration_ms INTEGER,
  trace_id TEXT,
  recruiter_email TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON chat_sessions (last_activity_at);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages (session_id, id);
