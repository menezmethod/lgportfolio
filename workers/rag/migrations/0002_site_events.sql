-- Durable first-party events for likely-human visitors: page views and outbound clicks.
-- No IP, user-agent, or session ID is stored.
CREATE TABLE IF NOT EXISTS site_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  src TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_site_events_created ON site_events (created_at);
