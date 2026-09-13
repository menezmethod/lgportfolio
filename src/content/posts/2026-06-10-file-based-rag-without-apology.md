---
title: "File-Based RAG Without Apology"
description: "Why I chose token-overlap retrieval over pgvector, and when you should too."
date: "2026-06-10"
tags: ["Architecture", "RAG", "AI Infrastructure"]
---

When you add an "AI chat about me" feature to a portfolio site, the standard playbook is: scrape your content into a vector database, deploy a retrieval pipeline with embeddings, add pgvector to Postgres, pay for Cloud SQL.

That's what the first version of this site did. The Terraform had a Cloud SQL Postgres instance with the pgvector extension ready to go. `rag.ts` had all the plumbing for vector search.

## Why I ripped it out

I was about to deploy a distributed vector search system when I stopped and asked myself a dumb question: how much text actually needs to be searchable here?

The answer was my knowledge base: a few hundred lines split into 9 sections (identity, experience, specific contributions, certifications, skills, what I'm looking for, FAQ, this site, and how the AI should behave). That's the whole corpus. I don't have a 10,000-document index. I have a markdown-ish file that fits in an editor tab.

So I deleted the Cloud SQL dependency, but I didn't just concatenate the whole thing into every request. Each section is real content:

```
# SECTION 1: ROLE & IDENTITY
...
# SECTION 3: SPECIFIC CONTRIBUTIONS (What Luis Actually Did)
...
# SECTION 9: AI BEHAVIOR RULES
```

And retrieval is a real (if small) ranking step, not "send everything":

```typescript
function scoreSection(section: string, queryTokens: Set<string>): number {
  const sectionTokens = tokenize(section);
  let score = 0;
  for (const token of queryTokens) {
    if (sectionTokens.has(token)) score++;
  }
  return score;
}
```

Tokenize the query, tokenize each section, count the overlap, take the top-K sections. The behavior-rules section always gets included regardless of score, since the model needs to know how to behave no matter what's asked. A short or greeting-y query ("hi", "thanks") skips scoring entirely and just gets the identity section plus a preamble, since there's nothing meaningful to rank against.

## The actual tradeoff

Token-overlap scoring over a few hundred lines is zero infra, zero latency worth measuring, and zero maintenance, but it stops making sense somewhere past maybe a few thousand documents where lexical overlap alone can't tell "relevant" from "coincidentally shares words." A vector DB handles that scale but adds latency, cost, and a deployment you now have to maintain.

For a portfolio site, the simple version wins outright. For a documentation search engine or a support bot with a real corpus, you'd want actual embeddings. The mistake isn't picking either one, it's defaulting to the scalable option before you've checked whether you actually need to scale.

The pgvector path is still in the code, not deleted, just dormant: `retrieveContext()` checks for Cloud SQL env vars first and only falls back to the token-overlap version if they're not set. If I ever need real semantic search, it's already wired up. I just haven't needed it yet.
