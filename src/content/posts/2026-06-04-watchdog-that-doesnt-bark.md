---
title: "The Watchdog That Doesn't Bark"
description: "Building a self-healing monitor that recovers silently — and when to actually wake up a human."
date: "2026-06-04"
tags: ["Infrastructure", "Self-Healing", "Edge Computing"]
---

## The Incident

My portfolio site's AI chat went down. The chat API returned empty responses. The user saw a loading spinner, then nothing.

Root cause: Coolify recreated the inferencia container with a new name and IP, the environment variable pointed to a stale IP, and no one noticed until someone tried to use the chat.

The fix was trivial (update one env var). The *pattern* was the problem — a silent failure with no recovery path.

## The Architecture

I wrote a Python watchdog that runs every 5 minutes on the Pi 5. It checks 6 links in the health chain:

```
1. gimenez.dev loads (HTTP 200)
2. Chat API responds (/api/chat)
3. Pi 5 is reachable (SSH)
4. Inferencia container is running (Docker)
5. Ollama is reachable (LAN HTTP)
6. Traefik routes correctly (proxy health)
```

If any link fails, it tries an automatic recovery (restart the container, update the env var, etc.). If recovery fails, it sends a single Telegram alert. If recovery succeeds, **nobody hears about it**.

## The Key Design Decision

Most monitoring setups alert on every hiccup. The noise trains humans to ignore alerts. I made a deliberate tradeoff:

- **Silent recovery** — If the watchdog fixes it, no message. Zero noise.
- **Single alert on failure** — If recovery fails, exactly one Telegram message. Not a page storm.
- **No pager duty for a portfolio site** — The site has SLOs but they aren't "wake me up at 3 AM" SLOs. If recovery fails, the alert sits in Telegram until morning.

The watchdog runs as a cron job with `no_agent: true` — it's a pure Python script that delivers its output verbatim. No LLM overhead, no agent loop, just a health check that produces silence or one line of text.

## The Tradeoff

This tradeoff works for a portfolio site (good-enough availability, zero maintenance overhead). It would be wrong for a payment system (you want immediate human escalation) or a batch job (you want retries with backoff, not silent recovery). The pattern generalizes: define your failure modes, your cost of downtime, and your alerting threshold before you write the first health check.

**Relevant to:** SRE, platform engineering, infrastructure roles where you own uptime without a dedicated ops team.
