-- RAG schema for Cloud SQL PostgreSQL + pgvector
-- Run once after the instance exists (e.g. via Cloud SQL Proxy or gcloud sql connect).
-- Usage: psql "host=/cloudsql/PROJECT:REGION:INSTANCE dbname=rag user=ragapp" -f init-rag-db.sql
-- Or with Cloud SQL Auth Proxy: psql "host=127.0.0.1 port=5432 dbname=rag user=ragapp" -f init-rag-db.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- Chunks of knowledge with embeddings (768 dimensions for text-embedding-004 / Gemini)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id         SERIAL PRIMARY KEY,
  content    TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'knowledge',
  embedding  vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Run after seeding: CREATE INDEX knowledge_chunks_embedding_idx ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- (IVFFlat benefits from having rows first; run once after seed-rag-db.ts)

-- Optional: function to match by embedding (app can use raw SQL instead)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (content text, source text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.content,
    k.source,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks k
  WHERE k.embedding IS NOT NULL
    AND (1 - (k.embedding <=> query_embedding)) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
