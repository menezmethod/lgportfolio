---
title: "File-Based RAG Without Apology"
description: "Why I chose a 200-line knowledge module over pgvector — and when you should too."
date: "2026-06-10"
tags: ["Architecture", "RAG", "AI Infrastructure"]
---

## The Default Move

When a portfolio site adds an "AI chat about me" feature, the standard approach is to scrape all your content into a vector database, deploy a retrieval pipeline, add pgvector to PostgreSQL, and pay for Cloud SQL. That is what the first version of this site did.

## Why I Reverted

I was about to deploy a distributed vector search system when I asked a simple question: **how much text actually needs to be searchable?**

About 200 lines — my resume experience, project descriptions, and skills. That is it. I do not have a 10,000-document knowledge base. I have a markdown file that fits on one screen.

The chat API concatenates the knowledge base with the system prompt and sends it to the LLM as a single request. The model 128K context window handles 200 lines trivially.

## The Tradeoff

| Approach | Pros | Cons |
|----------|------|------|
| **In-context RAG** | Zero infra, zero latency, zero maintenance | Does not scale past ~50K tokens |
| **Vector DB** | Handles millions of documents | Added latency, cost, complexity |

For a portfolio site, in-context is the right call. The pgvector infrastructure is still in the Terraform directory — one `terraform apply` away if needed.

**Relevant to:** Architecture decisions, system design interviews, platform roles where you own cost vs. complexity tradeoffs.
