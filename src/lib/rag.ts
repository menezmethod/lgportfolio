import { KNOWLEDGE_BASE } from "./knowledge";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "what",
  "when",
  "where",
  "who",
  "with",
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function splitKnowledgeBaseIntoChunks(): string[] {
  const chunks = KNOWLEDGE_BASE.split(/\n(?=##\s)/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks.length > 0 ? chunks : [KNOWLEDGE_BASE];
}

const KNOWLEDGE_CHUNKS = splitKnowledgeBaseIntoChunks();

function scoreChunk(queryTokens: string[], chunk: string): number {
  const normalizedChunk = normalize(chunk);
  let score = 0;

  for (const token of queryTokens) {
    if (normalizedChunk.includes(token)) score += 2;
  }

  const heading = chunk.match(/^##\s+(.+)$/m)?.[1];
  if (heading) {
    const normalizedHeading = normalize(heading);
    for (const token of queryTokens) {
      if (normalizedHeading.includes(token)) score += 2;
    }
  }

  return score;
}

export async function retrieveContext(query: string, topK = 5): Promise<string> {
  const trimmed = query.trim();
  if (!trimmed) return KNOWLEDGE_BASE;

  const queryTokens = tokenize(trimmed);
  if (queryTokens.length === 0) return KNOWLEDGE_BASE;

  const ranked = KNOWLEDGE_CHUNKS.map((chunk) => ({
    chunk,
    score: scoreChunk(queryTokens, chunk),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(topK, 8)));

  if (ranked.length === 0) return KNOWLEDGE_BASE;

  return ranked.map((item) => item.chunk).join("\n\n---\n\n");
}
