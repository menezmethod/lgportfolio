---
title: "The Watchdog That Doesn't Bark"
description: "Building a self-healing monitor that recovers silently — and when to actually wake up a human."
date: "2026-06-04"
tags: ["Infrastructure", "Self-Healing", "Edge Computing"]
---

## The Incident

My portfolio site's AI chat went down. The chat API returned empty responses. Root cause: Coolify recreated the inferencia container with a new name and IP, the environment variable pointed to a stale IP, and no one noticed until someone tried to use the chat.

The fix was trivial (update one env var). The *pattern* was the problem — a silent failure with no recovery path.

## The Architecture

I wrote a Python watchdog that runs every 5 minutes on the Pi 5. It checks 6 links in the health chain:

1. gimenez.dev loads (HTTP 200)
2. Chat API responds
3. Pi 5 is reachable (SSH)
4. Inferencia container is running (Docker)
5. Ollama is reachable (LAN HTTP)
6. Traefik routes correctly

If any link fails, it tries automatic recovery (restart the container, update env var). If recovery fails, it sends a single Telegram alert. **If recovery succeeds, nobody hears about it.**

## The Key Design Decision

- **Silent recovery** — If the watchdog fixes it, no message. Zero noise.
- **Single alert on failure** — If recovery fails, exactly one Telegram message.
- **No pager duty for a portfolio site** — The site has SLOs but they are not "wake me up at 3 AM" SLOs.

**Relevant to:** SRE, platform engineering, infrastructure roles where you own uptime without a dedicated ops team.
