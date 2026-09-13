---
title: "File-Based RAG Without Apology"
description: "Why I chose a 200-line knowledge module over pgvector, and when you should too."
date: "2026-06-10"
tags: ["Architecture", "RAG", "AI Infrastructure"]
---

When you add an "AI chat about me" feature to a portfolio site, the standard playbook is: scrape your content into a vector database, deploy a retrieval pipeline with embeddings, add pgvector to Postgres, pay for Cloud SQL.

That's what the first version of this site did. The Terraform had a Cloud SQL Postgres instance with the pgvector extension ready to go. `rag.ts` had all the plumbing for vector search.

## Why I ripped it out

I was about to deploy a distributed vector search system when I stopped and asked myself a dumb question: how much text actually needs to be searchable here?

The answer was about 200 lines: my experience, project descriptions, skills. That's the whole knowledge base. I don't have a 10,000-document corpus. I have a markdown file that fits on one screen.

So I deleted the Cloud SQL dependency and replaced it with this:

```typescript
const KNOWLEDGE_BASE = `
## Go Experience
~4 years production experience building high-throughput payment services...

## GCP Infrastructure
GCP Professional Cloud Architect certified. Cloud Run, GKE, Terraform...
`;
```

The chat API just concatenates the knowledge base with the system prompt and sends it to the LLM in one request. The model's 128K context window handles 200 lines without even noticing.

## The actual tradeoff

In-context is zero infra, zero latency, zero maintenance, but it stops scaling somewhere past ~50K tokens of context. A vector DB handles millions of documents but adds latency, cost, and a deployment you now have to maintain.

For a portfolio site, in-context wins outright. For a documentation search engine or a support bot with a real corpus, you'd want the vector search. The mistake isn't picking either one, it's defaulting to the scalable option before you've checked whether you actually need to scale.

The chat still has everything else a real system needs: rate limiting, prompt injection defense, caching, streaming, error handling. The only thing it's missing is a database, and it doesn't need one. The pgvector setup is still sitting in the Terraform directory. If I ever actually need it, it's one `terraform apply` away.
