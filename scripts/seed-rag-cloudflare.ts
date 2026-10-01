/**
 * Seed the Cloudflare Vectorize index with knowledge chunks and embeddings,
 * via the lgportfolio-rag worker (which holds the Cloudflare bindings).
 *
 * Prereqs:
 *   - Worker deployed: workers/rag (`npx wrangler deploy`), secret RAG_KEY set.
 *   - CLOUDFLARE_RAG_WORKER_URL + CLOUDFLARE_RAG_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/seed-rag-cloudflare.ts --dry-run   # prints what would be upserted and deleted, calls nothing
 *   npx tsx scripts/seed-rag-cloudflare.ts             # upserts the current chunks, then deletes stale ids
 *
 * Chunk ids are stable and sequential (kb-001, kb-002, ...). After an upsert, any id past the last
 * current chunk (up to STALE_SCAN ids further) is deleted through the worker's /prune route, so
 * chunks from removed knowledge-base text stop being retrieved. Deploy the worker first
 * (`cd workers/rag && npx wrangler deploy`) so /prune exists.
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { KNOWLEDGE_BASE } from "../src/lib/knowledge";

const MAX_CHUNK_CHARS = 1500;
/** How many ids past the last current chunk to delete. Increase if the index ever held more chunks than this. */
const STALE_SCAN = 300;
const DRY_RUN = process.argv.includes("--dry-run");
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
  if (!workerKey && !DRY_RUN) {
    console.error("Set CLOUDFLARE_RAG_KEY (in .env.local or env).");
    process.exit(1);
  }

  const chunks = chunkText(KNOWLEDGE_BASE).map((chunk, index) => ({
    id: `kb-${String(index + 1).padStart(3, "0")}`,
    ...chunk,
  }));
  console.log(`Chunked knowledge into ${chunks.length} chunks.`);
  const staleIds = Array.from({ length: STALE_SCAN }, (_, i) => `kb-${String(chunks.length + i + 1).padStart(3, "0")}`);

  if (DRY_RUN) {
    console.log(`[dry run] would upsert ${chunks.length} chunks: ${chunks[0].id} to ${chunks[chunks.length - 1].id}`);
    console.log(`[dry run] would delete stale ids: ${staleIds[0]} to ${staleIds[staleIds.length - 1]} (${staleIds.length} ids, missing ids are ignored)`);
    console.log("[dry run] no network calls were made.");
    return;
  }

  console.log("Embedding via worker...");
  const response = await fetch(`${workerUrl}/seed`, {
    method: "POST",
    headers: { "x-rag-key": workerKey!, "Content-Type": "application/json" },
    body: JSON.stringify({ chunks }),
  });
  const result = await response.json();
  if (!response.ok || result.error) {
    console.error(`Seed failed (${response.status}):`, result.error ?? result);
    process.exit(1);
  }
  console.log(`${result.upserted} chunks upserted (mutation ${result.mutationId}).`);

  const prune = await fetch(`${workerUrl}/prune`, {
    method: "POST",
    headers: { "x-rag-key": workerKey!, "Content-Type": "application/json" },
    body: JSON.stringify({ ids: staleIds }),
  });
  if (prune.ok) {
    console.log(`Pruned stale ids ${staleIds[0]} to ${staleIds[staleIds.length - 1]}.`);
  } else {
    console.error(`Prune failed (${prune.status}). Deploy the worker (workers/rag) so /prune exists, then re-run.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
