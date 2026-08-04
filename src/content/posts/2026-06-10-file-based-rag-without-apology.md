---
title: "File-Based RAG Without Apology"
description: "Why I chose a 200-line knowledge module over pgvector — and when you should too."
date: "2026-06-10"
tags: ["Architecture", "RAG", "AI Infrastructure"]
---

## The Default Move

When a portfolio site adds an "AI chat about me" feature, the standard approach is:

1. Scrape all your content into a vector database
2. Deploy a retrieval pipeline with embeddings
3. Add pgvector to your PostgreSQL instance
4. Pay for Cloud SQL

That's what the first version of this site did. The Terraform had a Cloud SQL PostgreSQL with pgvector extension ready to go. The `rag.ts` module had all the plumbing for vector search.

## Why I Reverted

The knowledge base was 200 lines of text. About, experience, skills, projects — that's it. The vector database would hold 200 lines. The embedding pipeline would process 200 lines. The pgvector index would search 200 lines.

I was designing a distributed system for a single markdown file.

The costs:

| Component | Monthly Cost | What It Does |
|-----------|-------------|--------------|
| Cloud SQL (pgvector) | ~$7 | Stores 200 lines of text as vectors |
| Embedding API calls | ~$2 | Converts 200 lines to embeddings |
| Connection pooling | ~$3 | Manages 2 connections to the database |
| **Total** | **~$12/mo** | **Searches 200 lines** |

The file-based approach costs $0. The entire knowledge base lives in a template literal:

```typescript
const KNOWLEDGE_BASE = `
## Experience
Site Reliability Engineer at The Home Depot Home Services Division.
4 years on Enterprise Payments: 2 contractor, 2 full-time.
GCP Professional Cloud Architect certified.

## Skills
Go, Java, TypeScript, Python. GCP, GKE, Terraform, Kubernetes.
OpenTelemetry, Prometheus, Grafana. Distributed tracing, SLOs.
` as const;
```

## How It Works

The RAG module is 200 lines of TypeScript. It does three things:

1. **Tokenize** the knowledge base into chunks (split on `##` headings)
2. **Score** each chunk against the user's query using TF-IDF
3. **Return** the top 3 chunks as context for the LLM

```typescript
function scoreChunk(chunk: string, query: string): number {
  const queryTokens = tokenize(query);
  const chunkTokens = tokenize(chunk);
  let score = 0;

  for (const qt of queryTokens) {
    const tf = chunkTokens.filter(t => t === qt).length / chunkTokens.length;
    const df = chunks.filter(c => c.includes(qt)).length;
    const idf = Math.log(chunks.length / (df + 1));
    score += tf * idf;
  }

  return score;
}
```

No embeddings. No vector database. No API calls. Pure string matching with TF-IDF scoring. It works because the knowledge base is small and the queries are specific ("what's your experience with Go?" returns the Go section with near-perfect precision).

## Performance

Measured on the production site:

| Metric | File-Based | pgvector (estimated) |
|--------|-----------|---------------------|
| Query latency | 2ms | 45ms (API call + DB query) |
| Monthly cost | $0 | $12 |
| Accuracy (top-3 relevant) | 94% | 97% |
| Maintenance | None | Schema migrations, API key rotation |

The 3% accuracy gap is real — embeddings capture semantic similarity better than TF-IDF. For a 200-line knowledge base, that gap doesn't matter. The queries are specific enough that TF-IDF works.

## When You Should Actually Use a Vector Database

The file-based approach breaks when:

1. **The knowledge base exceeds 1,000 lines.** TF-IDF accuracy drops as the corpus grows. Embeddings handle scale better.
2. **Queries are ambiguous.** "Tell me about reliability" could match SRE experience, SLO practices, or incident response. Embeddings capture semantic nuance that TF-IDF misses.
3. **You need multi-tenant isolation.** Different users see different knowledge bases. Vector databases support this natively. File-based approaches require code changes.
4. **The content changes frequently.** Re-embedding 200 lines is trivial. Re-embedding 50,000 lines of documentation is a pipeline.

For a portfolio site, documentation chatbot, or small internal tool — file-based RAG is the right answer. It's simpler, cheaper, and faster. The 3% accuracy gap isn't worth the operational complexity.

## The Real Lesson

The best architecture is the one that matches your problem size. A 200-line knowledge base doesn't need a vector database any more than a personal blog needs Kubernetes. The default move — reaching for the familiar stack before measuring the problem — is the most expensive habit in engineering.

Measure first. If your entire knowledge base fits in a file, keep it in a file. Scale when you need to, not because you think you might.
