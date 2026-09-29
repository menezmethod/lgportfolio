/**
 * Seed the Cloudflare Vectorize index with knowledge chunks and embeddings,
 * via the lgportfolio-rag worker (which holds the Cloudflare bindings).
 *
 * Prereqs:
 *   - Worker deployed: workers/rag (`npx wrangler deploy`), secret RAG_KEY set.
 *   - CLOUDFLARE_RAG_WORKER_URL + CLOUDFLARE_RAG_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/seed-rag-cloudflare.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { KNOWLEDGE_BASE } from "../src/lib/knowledge";

const MAX_CHUNK_CHARS = 1500;
const DEFAULT_WORKER_URL = "https://lgportfolio-rag.luisgimenezdev.workers.dev";

const workerUrl = (process.env.CLOUDFLARE_RAG_WORKER_URL?.trim() || DEFAULT_WORKER_URL).replace(
  /\/$/,
  ""
);
const workerKey = process.env.CLOUDFLARE_RAG_KEY?.trim();

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

async function main() {
  if (!workerKey) {
    console.error("Set CLOUDFLARE_RAG_KEY (in .env.local or env).");
    process.exit(1);
  }

  const chunks = chunkText(KNOWLEDGE_BASE).map((chunk, index) => ({
    id: `kb-${String(index + 1).padStart(3, "0")}`,
    ...chunk,
  }));
  console.log(`Chunked knowledge into ${chunks.length} chunks. Embedding via worker...`);

  const response = await fetch(`${workerUrl}/seed`, {
    method: "POST",
    headers: { "x-rag-key": workerKey, "Content-Type": "application/json" },
    body: JSON.stringify({ chunks }),
  });
  const result = await response.json();
  if (!response.ok || result.error) {
    console.error(`Seed failed (${response.status}):`, result.error ?? result);
    process.exit(1);
  }

  // ponytail: upsert-only — stale ids from removed KB sections linger until manually
  // deleted; fine for a 30-chunk index that only grows. Add a /prune route if it matters.
  console.log(`Done. ${result.upserted} chunks upserted (mutation ${result.mutationId}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
