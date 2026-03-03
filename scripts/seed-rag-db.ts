/**
 * Seed the RAG Cloud SQL (pgvector) database with knowledge chunks and embeddings.
 * Run after init-rag-db.sql has been applied.
 *
 * Prereqs:
 *   - Cloud SQL instance exists (terraform apply with enable_rag_cloud_sql = true).
 *   - Schema applied: psql ... -f scripts/init-rag-db.sql
 *   - Locally: run Cloud SQL Proxy, set RAG_DB_HOST=127.0.0.1 and port 5432.
 *   - GOOGLE_API_KEY in .env.local for Gemini text-embedding-004.
 *
 * Usage:
 *   npx tsx scripts/seed-rag-db.ts
 *   # or with env: RAG_DB_HOST=127.0.0.1 RAG_DB_NAME=rag RAG_DB_USER=ragapp RAG_DB_PASSWORD=... GOOGLE_API_KEY=... npx tsx scripts/seed-rag-db.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { Pool } from "pg";
import { KNOWLEDGE_BASE } from "../src/lib/knowledge";

const EMBEDDING_DIM = 768;
const MAX_CHUNK_CHARS = 1500;
const BATCH_DELAY_MS = 200;

function chunkText(text: string): { content: string; source: string }[] {
  const chunks: { content: string; source: string }[] = [];
  const sections = text.split(/\n\n---+\n\n/).map((s) => s.trim()).filter(Boolean);

  for (const section of sections) {
    if (section.length <= MAX_CHUNK_CHARS) {
      chunks.push({ content: section, source: "knowledge" });
      continue;
    }
    const paragraphs = section.split(/\n\n+/);
    let current = "";
    for (const p of paragraphs) {
      if (current.length + p.length + 2 > MAX_CHUNK_CHARS && current.length > 0) {
        chunks.push({ content: current.trim(), source: "knowledge" });
        current = "";
      }
      current += (current ? "\n\n" : "") + p;
    }
    if (current.trim()) {
      chunks.push({ content: current.trim(), source: "knowledge" });
    }
  }
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_DOCUMENT",
      }),
    }
  );
  if (!res.ok) throw new Error(`Embedding failed: ${res.statusText}`);
  const data = await res.json();
  const values = data.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIM) {
    throw new Error(`Unexpected embedding dimension: ${values?.length}`);
  }
  return values;
}

async function main() {
  const host = process.env.RAG_DB_HOST || `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`;
  const database = process.env.RAG_DB_NAME;
  const user = process.env.RAG_DB_USER;
  const password = process.env.RAG_DB_PASSWORD;

  if (!database || !user || !password) {
    console.error("Set RAG_DB_NAME, RAG_DB_USER, RAG_DB_PASSWORD (and RAG_DB_HOST for local).");
    process.exit(1);
  }

  const pool = new Pool({
    host,
    port: process.env.RAG_DB_PORT ? parseInt(process.env.RAG_DB_PORT, 10) : 5432,
    database,
    user,
    password,
  });

  const chunks = chunkText(KNOWLEDGE_BASE);
  console.log(`Chunked knowledge into ${chunks.length} chunks. Generating embeddings and inserting...`);

  await pool.query("DELETE FROM knowledge_chunks");

  for (let i = 0; i < chunks.length; i++) {
    const { content, source } = chunks[i];
    const embedding = await generateEmbedding(content);
    const vectorLiteral = `[${embedding.join(",")}]`;
    await pool.query(
      `INSERT INTO knowledge_chunks (content, source, embedding) VALUES ($1, $2, $3::vector(768))`,
      [content, source, vectorLiteral]
    );
    if ((i + 1) % 5 === 0) console.log(`  Inserted ${i + 1}/${chunks.length}`);
    if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
  }

  console.log(`Done. Inserted ${chunks.length} rows into knowledge_chunks.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
