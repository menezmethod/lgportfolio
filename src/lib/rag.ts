/**
 * RAG: retrieval for the AI chat.
 * - When the Cloudflare RAG worker is configured: vector search via Workers AI
 *   embeddings + Vectorize (the worker holds the Cloudflare bindings).
 * - Otherwise: file-based knowledge base (KNOWLEDGE_BASE).
 * Embeddings: Workers AI (@cf/baai/bge-m3, 1024 dimensions).
 */

import { KNOWLEDGE_BASE } from "./knowledge";

const DEFAULT_WORKER_URL = "https://lgportfolio-rag.luisgimenezdev.workers.dev";
/** Cosine similarity floor, calibrated for bge-m3: relevant chunks score ~0.45–0.7. */
const MATCH_THRESHOLD = 0.4;
const WORKER_TIMEOUT_MS = 10_000;

function workerUrl(): string {
  const url = process.env.CLOUDFLARE_RAG_WORKER_URL?.trim() || DEFAULT_WORKER_URL;
  return url.replace(/\/$/, "");
}

function workerKey(): string | null {
  return process.env.CLOUDFLARE_RAG_KEY?.trim() || null;
}

export function isCloudflareRagConfigured(): boolean {
  return Boolean(workerKey());
}

export interface VectorMatch {
  score: number;
  source: string;
  content: string;
}

/** Timing probe: one fixed query straight to the RAG worker (no file fallback). Returns ms, or null on any failure. */
export async function probeWorkerRetrieval(): Promise<number | null> {
  if (!isCloudflareRagConfigured()) return null;
  const start = Date.now();
  try {
    await retrieveWorkerMatches("What does Luis work on?", 3);
    return Date.now() - start;
  } catch {
    return null;
  }
}

async function retrieveWorkerMatches(query: string, topK: number): Promise<VectorMatch[]> {
  const key = workerKey();
  if (!key) throw new Error("Cloudflare RAG not configured");

  const response = await fetch(`${workerUrl()}/retrieve`, {
    method: "POST",
    headers: { "x-rag-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ query, topK }),
    signal: AbortSignal.timeout(WORKER_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`RAG worker failed: ${response.status}`);
  }

  const data = await response.json();
  const matches = data?.matches;
  if (!Array.isArray(matches)) return [];
  return matches
    .filter((m: { content?: unknown }) => typeof m?.content === "string" && m.content.length > 0)
    .map((m: { score?: number; source?: unknown; content: string }) => ({
      score: typeof m.score === "number" ? m.score : 0,
      source: typeof m.source === "string" ? m.source : "unknown",
      content: m.content,
    }));
}

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

const normalizeWs = (t: string) => t.replace(/\s+/g, " ").trim();
let kbNormalized: string | null = null;

/**
 * A vector chunk is current only if its text still appears in the knowledge base. This keeps stale
 * chunks (from an index that was seeded before the knowledge base changed) out of answers until the
 * index is re-seeded.
 */
export function isCurrentChunk(content: string): boolean {
  kbNormalized ??= normalizeWs(KNOWLEDGE_BASE);
  return kbNormalized.includes(normalizeWs(content));
}

// Small in-memory LRU for the RETRIEVAL result only (never the generated answer), so repeated questions and the
// suggested chips skip the embed + Vectorize round trip. Failures and fallbacks are never cached.
const CACHE_MAX = 200;
const CACHE_TTL_MS = 10 * 60 * 1000;
const retrievalCache = new Map<string, { at: number; context: string }>();

function cacheKey(query: string, topK: number): string {
  return `${topK}|${query.toLowerCase().trim().replace(/\s+/g, " ")}`;
}

function remember(key: string, context: string): void {
  retrievalCache.set(key, { at: Date.now(), context });
  if (retrievalCache.size > CACHE_MAX) retrievalCache.delete(retrievalCache.keys().next().value as string);
}

/** Test hook. */
export function resetRetrievalCache(): void {
  retrievalCache.clear();
}

export async function retrieveContext(query: string, topK = 5): Promise<string> {
  // Low-signal queries (greetings, one-liners) keep the curated file context —
  // it always includes the identity and behavior-rule sections.
  if (!isCloudflareRagConfigured() || isLowSignalQuery(query, tokenize(query))) {
    return retrieveFileContext(query, topK);
  }

  const key = cacheKey(query, topK);
  const hit = retrievalCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    retrievalCache.delete(key); // refresh recency
    retrievalCache.set(key, hit);
    return hit.context;
  }
  if (hit) retrievalCache.delete(key);

  try {
    const matches = (await retrieveWorkerMatches(query, topK)).filter(
      (match) => match.score >= MATCH_THRESHOLD && isCurrentChunk(match.content)
    );

    if (matches.length === 0) {
      // The worker answered; nothing usable came back (for example only stale chunks). That is a result, not a
      // failure, so cache the file context and skip the round trip next time.
      const fileContext = retrieveFileContext(query, topK);
      remember(key, fileContext);
      return fileContext;
    }

    // Always include the AI behavior rules alongside vector matches (the file
    // path guarantees them; the vector path must too).
    const behaviorSection = splitKnowledgeSections().find((section) =>
      /SECTION 9:/i.test(section)
    );
    const chunks = matches.map((match) => `[Source: ${match.source}] ${match.content}`);
    if (behaviorSection) chunks.push(`[Source: knowledge] ${behaviorSection}`);

    const context = deduplicateContext(chunks.join("\n\n---\n\n"));
    remember(key, context);
    return context;
  } catch {
    return retrieveFileContext(query, topK);
  }
}
