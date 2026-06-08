---
title: "Overengineering vs. Shipping: How I Decided When Simple Is Better"
description: "A framework for deciding when to build the scalable system and when to hardcode the 200-line solution — from building an AI chat that works without a database."
date: "2026-06-18"
tags: ["Architecture", "Engineering Philosophy", "Infrastructure"]
---

## The Default Move Trap

I was about to deploy pgvector for a portfolio site. Cloud SQL spec'd, embedding pipeline stubbed, vector index configured. Professional. Production-ready. One problem: the knowledge base was 200 lines of text. I'd designed a distributed system for a single markdown file.

I call this the **default move** — reaching for the familiar stack (event bus, microservice, cache layer) before you measure the problem. It's not malice. It's habit.

## What I Actually Built

The chat on this site has no database. The entire knowledge base lives in a template literal:

```typescript
const KNOWLEDGE_BASE = `
## Experience
~4 years building payment platforms on GCP...

## Projects
Inferencia router, file-based RAG, rate-limit postmortems...
`;

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: SYSTEM_PROMPT + KNOWLEDGE_BASE },
    { role: "user", content: question }
  ]
});
```

30 lines. Never failed. Costs nothing.

## The Table That Changed My Mind

| Approach | Cost to build | Cost to maintain | Failure mode |
|---|---|---|---|
| **200-line hardcode** | 30 minutes | $0/mo, zero infra | Context limits at ~50K tokens |
| **pgvector pipeline** | 3 days + Terraform | ~$30/mo Cloud SQL | None within any realistic data size |

The hardcode wins on every axis *except* scale I'll never need. The vector DB is more "correct." It's also wasted effort.

## My Framework

I now ask three questions before any architecture decision:

**1. How much data, really?** Not "what if we get acquired?" — the actual data. 200 lines is different from 500M events/day.

**2. How many users, really?** This chat serves me and maybe a dozen recruiters. Not 100K concurrent.

**3. What's the cost of being wrong?** Worst case for my hardcoded chat: the model misses something, I add a line. Worst case for a payment system on in-memory store: six-figure data loss.

Question three is decisive. Payment systems, auth, medical records — those get the full distributed treatment. A portfolio chat? Ship the 200 lines.

## When to Go Big

I'm not anti-infrastructure. I manage real Terraform pipelines and CI systems at work. When the answers are "terabytes of data," "thousands of users," "regulatory fine" — build the robust system. But don't tell yourself that's your portfolio site.

The skill isn't building distributed systems. It's knowing when *not* to.

**Relevant to:** Architecture decisions, system design interviews, platform roles owning cost vs. complexity tradeoffs.
