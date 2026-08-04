---
title: "Rate Limit Postmortem: One Config Change That Broke My Chat"
description: "How setting CHAT_MAX_RPM_PER_IP to 2 made my portfolio chat unusable — and what the fix taught me about default values and user behavior."
date: "2026-06-07"
tags: ["Infrastructure", "API Design", "Production Incidents"]
---

## The Setup

My portfolio chat uses a 3-layer rate limiting system:

1. **Per-IP rate limit** — `CHAT_MAX_RPM_PER_IP` (max requests per minute per IP)
2. **Session cap** — `NEXT_PUBLIC_CHAT_MAX_MESSAGES` (max messages per chat session)
3. **Daily budget** — Hard total across all users

The original values: 2 RPM per IP, 10 messages per session, 25 total daily. I was worried about inference costs on the self-hosted Ollama server. The Pi 5 has 8GB of RAM and the LLM is running on a Mac M4 Max over the LAN — not infinite compute.

## The Failure

With RPM=2, if a user asked a question that required follow-up, they'd hit the limit within 30 seconds. The chat would show a "rate limited" error instead of their answer. The user experience: *chat loads, ask one question, wait, get answer, ask follow-up, blocked.*

The rate limiter was working exactly as configured. That was the problem — the configuration was wrong.

## What I Missed

The rate limiter was built for the worst case (abuse, cost runaway) but configured for the average case (someone asking one question). I'd set the limit before any users existed. When the first real user showed up, they hit the wall in 30 seconds.

The gap: I'd measured "what's the minimum viable limit" but not "what's the minimum usable experience." A rate limit that blocks normal usage isn't a rate limit — it's a denial of service.

## The Fix

Three changes:

**1. Raise the per-IP limit.** 2 RPM → 10 RPM. A real user asking follow-up questions sends 3-4 requests per minute. 10 RPM gives headroom without enabling abuse.

```typescript
// Before
CHAT_MAX_RPM_PER_IP=2

// After
CHAT_MAX_RPM_PER_IP=10
```

**2. Add progressive throttling.** Instead of hard-blocking at the limit, add a warning at 80% and slow responses at 95%. The user still gets answers, just slower.

```typescript
function getRateLimitResponse(requestsThisMinute: number, limit: number) {
  const usage = requestsThisMinute / limit;
  if (usage >= 1.0) {
    return { status: 429, retryAfter: 60 };
  }
  if (usage >= 0.95) {
    return { status: 200, delay: 2000 }; // slow but not blocked
  }
  if (usage >= 0.80) {
    return { status: 200, warning: 'approaching limit' };
  }
  return { status: 200 };
}
```

**3. Monitor the actual distribution.** I added a histogram of requests-per-minute per IP. Within 24 hours I could see the real usage pattern: most users send 1-2 requests, power users send 5-6, nobody exceeds 8. The limit of 10 covers 99% of real usage.

## What This Taught Me

**Default values are load-bearing.** Every config file is a promise about expected behavior. Set it wrong and the system works perfectly while failing its users. I now treat default values the same way I treat database schemas — they need a migration plan when they change.

**Measure before you throttle.** I'd configured the limit based on anxiety about cost, not data about usage. The histogram showed inference costs were $0.02/day. The rate limit was solving a problem that didn't exist.

**The user doesn't care about your infrastructure.** They don't know about Ollama, the Pi 5, or the LAN connection. They know the chat stopped working. Every rate limit decision should be invisible to the user — if they notice the limit, you've failed.

**Hard blocks are a last resort.** Progressive throttling (slow down before you block) is almost always better. The user still gets their answer, just slower. They can retry. They don't see an error. The experience degrades gracefully instead of failing hard.

## Current Config

After the fix:

| Layer | Before | After | Rationale |
|-------|--------|-------|-----------|
| Per-IP RPM | 2 | 10 | Covers real usage (99th percentile is 8) |
| Session messages | 10 | 20 | Long conversations need room |
| Daily budget | 25 | 100 | Cost is $0.02/day, not a concern |
| Throttle behavior | Hard block | Progressive slow | Graceful degradation |

Daily inference cost: $0.03. The rate limiter was solving a $0.03 problem by breaking the user experience.

## The Pattern

Every rate limiter I've built since follows the same rule: **set the limit based on real usage data, not anxiety.** Measure first. Set the limit at 3x the 99th percentile. Add progressive throttling. Monitor. Adjust.

If you don't know your usage distribution, you don't have a rate limit problem — you have a measurement problem. Fix that first.
