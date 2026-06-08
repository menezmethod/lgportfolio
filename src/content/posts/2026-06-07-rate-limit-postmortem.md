---
title: "Rate Limit Postmortem: One Config Change That Broke My Chat"
description: "How setting CHAT_MAX_RPM_PER_IP to 2 made my portfolio chat unusable — and the exact fix strategy that works."
date: "2026-06-07"
tags: ["Infrastructure", "API Design", "Production Incidents"]
---

## The Setup

My portfolio chat uses a 3-layer rate limiting system:

1. **Per-IP rate limit** — `CHAT_MAX_RPM_PER_IP` (max requests per minute per IP)
2. **Session cap** — `NEXT_PUBLIC_CHAT_MAX_MESSAGES` (max messages per chat session)
3. **Daily budget** — Hard total across all users

The original values were conservative: 2 RPM per IP, 10 messages per session, 25 total. I was worried about inference costs on the self-hosted Ollama server.

## The Failure

With RPM=2, if a user asked a question that required follow-up, they'd hit the limit within 30 seconds. The chat would show a "rate limited" error instead of their answer. The user experience was: *chat loads, ask one question, wait, get answer, ask follow-up, blocked*.

The worst part: the main page content listed "AI Chat" as a feature, and it was broken out of the box.

## The Fix (Data-Driven)

I didn't guess. I looked at real usage patterns from the War Room analytics:

- Average user session: 4-6 messages
- Average time between messages: 20-45 seconds
- Peak concurrency: 1-2 users simultaneously
- Inference cost per response: negligible (Gemma 4 27B via Ollama on local hardware)

With actual data, the new limits were obvious:

- RPM: 2 → **6** (accommodates bursts without abuse)
- Session cap: 10 → **30** (covers any realistic conversation)
- Daily budget: 25 → **150** (the old budget was consumed by a single session)

## The Budget Kill Switch

The daily budget is the critical safety net. If something goes wrong (infinite loop, abuse, misconfiguration), the budget kills chat for everyone after 150 responses. Recovering from $0 budget is simpler than recovering from an unexpected $500 Cloud Run bill.

```typescript
const BUDGET_KILL: RateLimitConfig = {
  windowMs: 24 * 60 * 60 * 1000,  // 1 day
  max: 150,                         // hard ceiling
  message: "Chat is temporarily unavailable. Try again tomorrow."
};
```

## The Lesson

Rate limiting is not a binary "on/off" feature. You need three different numbers that interact: burst tolerance, session depth, and daily ceiling. Each solves a different problem (burst abuse vs. session length vs. cost runaway). Setting any one of them wrong makes the whole system feel broken.

**Relevant to:** API design, platform engineering, backend roles where you own the boundary between your service and its consumers.
