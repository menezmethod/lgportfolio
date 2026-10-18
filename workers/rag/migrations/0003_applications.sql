-- Private copy of the owner's application tracker, keyed by the ?src= tag used in
-- application links. Seeded by scripts/sync-applications.mjs; never committed.
CREATE TABLE IF NOT EXISTS applications (
  src TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT,
  applied_at TEXT,
  status TEXT
);
