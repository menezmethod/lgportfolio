---
title: "The Watchdog That Doesn't Bark"
description: "Building a self-healing monitor that recovers silently, and knowing when to actually wake up a human."
date: "2026-06-04"
tags: ["Infrastructure", "Self-Healing", "Edge Computing"]
---

My portfolio site's AI chat went down. The chat API returned empty responses. Loading spinner, then nothing.

Root cause: Coolify recreated the inferencia container with a new name and IP, the environment variable still pointed to the old one, and nobody noticed until someone actually tried to use the chat.

The fix was trivial, update one env var. The pattern was the problem: a silent failure with no recovery path.

## What I built

A Python watchdog that runs every 5 minutes on the Pi 5 and checks 6 links in the health chain:

```
1. gimenez.dev loads (HTTP 200)
2. Chat API responds (/api/chat)
3. Pi 5 is reachable (SSH)
4. Inferencia container is running (Docker)
5. Ollama is reachable (LAN HTTP)
6. Traefik routes correctly (proxy health)
```

If any link fails, it tries an automatic recovery: restart the container, update the env var, whatever fits. If recovery fails, it sends one Telegram alert. If recovery succeeds, nobody hears about it.

## The design call

Most monitoring setups alert on every hiccup, and the noise trains people to ignore alerts. I went the other way on purpose:

- Silent recovery. If the watchdog fixes it, no message. Zero noise.
- One alert on failure. If recovery fails, exactly one Telegram message, not a page storm.
- No pager duty for a portfolio site. It has SLOs, but they're not "wake me up at 3 AM" SLOs. If recovery fails, the alert just sits in Telegram until morning.

The watchdog runs as a cron job with `no_agent: true`. It's a plain Python script that prints its output and exits. No LLM in the loop, no agent overhead, just a health check that produces either silence or one line of text.

## Where this doesn't apply

This works because it's a portfolio site: good-enough availability, zero maintenance overhead. I'd never ship this for a payment system, you want a human paged immediately there. Same for a batch job, where you want retries with backoff instead of silent recovery. The only thing I'd actually carry over to a different system is the exercise itself: decide what failure modes matter, what downtime actually costs, and what deserves a page, before writing the first health check.
