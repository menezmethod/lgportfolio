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

const FILE_SECTION_SPLIT = /(?=# ═{3,}\n# SECTION \d+:)/;
const FILE_PREAMBLE_MAX_CHARS = 2500;
const GREETING_TOKENS = new Set(["hi", "hello", "hey", "there", "thanks", "thank", "yo", "howdy"]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

function scoreSection(section: string, queryTokens: Set<string>): number {
  const sectionTokens = tokenize(section);
  let score = 0;
  for (const token of queryTokens) {
    if (sectionTokens.has(token)) score++;
  }
  return score;
}

function isLowSignalQuery(query: string, queryTokens: Set<string>): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length <= 12) return true;
  if (queryTokens.size <= 2 && [...queryTokens].every((token) => GREETING_TOKENS.has(token))) {
    return true;
  }
  return false;
}

function splitKnowledgeSections(): string[] {
  const parts = KNOWLEDGE_BASE.split(FILE_SECTION_SPLIT).map((section) => section.trim());
  return parts.filter((section) => section.length > 50);
}

/** File-based retrieval: return the most relevant KB sections instead of the full document. */
export function retrieveFileContext(query: string, topK = 3): string {
  const sections = splitKnowledgeSections();
  if (sections.length === 0) return KNOWLEDGE_BASE;

  const queryTokens = tokenize(query);
  const behaviorIdx = sections.findIndex((section) => /SECTION 9:/i.test(section));
  const identityIdx = sections.findIndex((section) => /SECTION 1:/i.test(section));
  const selected = new Set<number>();

  if (behaviorIdx >= 0) selected.add(behaviorIdx);

  if (isLowSignalQuery(query, queryTokens)) {
    if (identityIdx >= 0) selected.add(identityIdx);
  } else {
    const ranked = sections
      .map((section, idx) => ({ idx, score: scoreSection(section, queryTokens) }))
      .filter(({ idx }) => idx !== behaviorIdx)
      .sort((a, b) => b.score - a.score);

    for (const { idx, score } of ranked) {
      if (selected.size >= topK + (behaviorIdx >= 0 ? 1 : 0)) break;
      if (score > 0 || selected.size < 2) selected.add(idx);
    }

    if (selected.size <= 1 && identityIdx >= 0) selected.add(identityIdx);
    if (selected.size <= 1) {
      for (const { idx } of ranked.slice(0, 2)) selected.add(idx);
    }
  }

  const body = [...selected]
    .sort((a, b) => a - b)
    .map((idx) => sections[idx].trim())
    .join("\n\n");

  if (!isLowSignalQuery(query, queryTokens)) return body;

  const preamble = KNOWLEDGE_BASE.split(FILE_SECTION_SPLIT)[0]?.trim() ?? "";
  if (preamble.length <= FILE_PREAMBLE_MAX_CHARS) {
    return `${preamble}\n\n${body}`.trim();
  }
  return body;
}

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
    return retrieveFileContext(query, topK);
  }

  try {
    const embedding = await generateEmbedding(query);
    const vectorLiteral = toVectorLiteral(embedding);

    const { rows } = await client.query<{ content: string; source: string }>(
      `SELECT content, source FROM match_documents($1::vector(768), 0.7, $2)`,
      [vectorLiteral, topK]
    );

    if (!rows || rows.length === 0) {
      return retrieveFileContext(query, topK);
    }

    const raw = rows
      .map((r) => `[Source: ${r.source || "unknown"}] ${r.content}`)
      .join("\n\n---\n\n");
    return deduplicateContext(raw);
  } catch {
    return retrieveFileContext(query, topK);
  }
}
