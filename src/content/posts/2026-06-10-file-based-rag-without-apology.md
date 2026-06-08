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

I was about to deploy a distributed vector search system when I asked a simple question: **how much text actually needs to be searchable?**

The answer was about 200 lines — my resume experience, project descriptions, and skills. That's it. I don't have a 10,000-document knowledge base. I have a markdown file that fits on one screen.

I deleted the Cloud SQL dependency and replaced it with:

```typescript
const KNOWLEDGE_BASE = `
## Go Experience
~4 years production experience building high-throughput payment services...

## GCP Infrastructure
GCP Professional Cloud Architect certified. Cloud Run, GKE, Terraform...
`;
```

The chat API concatenates the knowledge base with the system prompt and sends it to the LLM as a single request. The model's context window (128K tokens) handles 200 lines trivially.

## The Tradeoff

| Approach | Pros | Cons |
|----------|------|------|
| **In-context RAG** | Zero infra, zero latency, zero maintenance | Doesn't scale past ~50K tokens of context |
| **Vector DB** | Handles millions of documents | Added latency, cost, deployment complexity |

For a portfolio site, in-context is the right call. For a documentation search engine or a product's support bot, you'd want vector search. The mistake is defaulting to the scalable solution before you know whether you need to scale.

## The Real Architecture

The chat still has the complete pipeline — rate limiting, prompt injection defense, caching, streaming, error handling. The only thing it doesn't have is a database. That's not "less of a system." It's the right system for the actual requirements.

The pgvector infrastructure is still in the Terraform directory. If I ever need it, it's one `terraform apply` away.

**Relevant to:** Architecture decisions, system design interviews, platform roles where you own cost vs. complexity tradeoffs.
