/**
 * RAG: retrieval for the AI chat.
 * - When Cloud SQL (GCP) is configured: vector search via pgvector.
 * - Otherwise: file-based knowledge base (KNOWLEDGE_BASE).
 * Embeddings: Google Generative Language API (text-embedding-004).
 */

import { Pool } from "pg";

const connectionName = process.env.CLOUD_SQL_CONNECTION_NAME;
const dbName = process.env.RAG_DB_NAME;
const dbUser = process.env.RAG_DB_USER;
const dbPassword = process.env.RAG_DB_PASSWORD;
const dbHost = process.env.RAG_DB_HOST; // optional: for local Cloud SQL Proxy (e.g. 127.0.0.1)

const hasCloudSql =
  connectionName && dbName && dbUser && dbPassword;

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!hasCloudSql) return null;
  if (pool) return pool;
  try {
    const host = dbHost || `/cloudsql/${connectionName}`;
    pool = new Pool({
      host,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    return pool;
  } catch {
    return null;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
        taskType: "RETRIEVAL_QUERY",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding?.values || [];
}

import { KNOWLEDGE_BASE } from "./knowledge";

function deduplicateContext(context: string): string {
  const chunkSeparator = "\n\n---\n\n";
  const chunks = context
    .split(chunkSeparator)
    .map((b) => b.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const chunk of chunks) {
    const normalized = chunk.replace(/\s+/g, " ").trim();
    if (normalized.length < 20) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(chunk);
  }
  return out.join(chunkSeparator);
}

/** Format embedding array for PostgreSQL vector(768). */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function retrieveContext(query: string, topK = 5): Promise<string> {
  const client = getPool();

  if (!client) {
    return KNOWLEDGE_BASE;
  }

  try {
    const embedding = await generateEmbedding(query);
    const vectorLiteral = toVectorLiteral(embedding);

    const { rows } = await client.query<{ content: string; source: string }>(
      `SELECT content, source FROM match_documents($1::vector(768), 0.7, $2)`,
      [vectorLiteral, topK]
    );

    if (!rows || rows.length === 0) {
      return KNOWLEDGE_BASE;
    }

    const raw = rows
      .map((r) => `[Source: ${r.source || "unknown"}] ${r.content}`)
      .join("\n\n---\n\n");
    return deduplicateContext(raw);
  } catch {
    return KNOWLEDGE_BASE;
  }
}
