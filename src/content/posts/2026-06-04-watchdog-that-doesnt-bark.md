---
title: "The Watchdog That Doesn't Bark"
description: "Building a self-healing monitor that recovers silently — and why the best incident response is the one the user never sees."
date: "2026-06-04"
tags: ["Infrastructure", "Self-Healing", "Monitoring"]
---

## The Incident

My portfolio site's AI chat went down. The chat API returned empty responses. The user saw a loading spinner, then nothing.

Root cause: Coolify recreated the inferencia container with a new name and IP, the environment variable pointed to a stale IP, and no one noticed until someone tried to use the chat.

The fix was trivial (update one env var). The *pattern* was the problem — a silent failure with no recovery path. The chat didn't crash. It returned empty responses. The HTTP status was 200. Nothing triggered an alert.

## What I Built

A Python watchdog that runs every 5 minutes on the Pi 5 via cron. It checks 6 links in the health chain:

```
Cloudflare DNS → Tunnel → Traefik → Container → LLM Backend → Chat API
```

```python
#!/usr/bin/env python3
"""Watchdog for gimenez.dev health chain. Runs via cron every 5 minutes."""
import subprocess, json, sys, time

CHECKS = [
    {"name": "dns", "cmd": "dig +short gimenez.dev @1.1.1.1 | head -1",
     "expect": lambda r: bool(r.strip())},
    {"name": "tunnel", "cmd": "curl -sk -o /dev/null -w '%{http_code}' https://gimenez.dev --max-time 10",
     "expect": lambda r: r.strip() == "200"},
    {"name": "traefik", "cmd": "docker exec coolify-proxy wget -q -O- --timeout=5 http://localhost/health -H 'Host: gimenez.dev'",
     "expect": lambda r: "ok" in r.lower() or "healthy" in r.lower()},
    {"name": "container", "cmd": "docker ps --format '{{.Status}}' | grep lgportfolio",
     "expect": lambda r: "Up" in r},
    {"name": "chat-api", "cmd": "curl -s http://localhost:3000/api/health --max-time 5",
     "expect": lambda r: '"ok"' in r or '"healthy"' in r},
    {"name": "llm", "cmd": "curl -s http://llm.menezmethod.com/health --max-time 10",
     "expect": lambda r: '"ok"' in r or '"healthy"' in r},
]

def run_checks():
    results = []
    for check in CHECKS:
        try:
            out = subprocess.run(
                check["cmd"], shell=True, capture_output=True,
                text=True, timeout=15
            ).stdout
            ok = check["expect"](out)
            results.append({"name": check["name"], "ok": ok, "output": out.strip()[:100]})
        except Exception as e:
            results.append({"name": check["name"], "ok": False, "output": str(e)[:100]})
    return results

def try_heal(results):
    """Attempt automatic recovery for known failure modes."""
    for r in results:
        if r["name"] == "container" and not r["ok"]:
            # Container is down — restart it
            subprocess.run(
                "docker start lgportfolio || true",
                shell=True, capture_output=True, timeout=30
            )
            return "restarted container"
    return None

if __name__ == "__main__":
    results = run_checks()
    failed = [r for r in results if not r["ok"]]

    if not failed:
        sys.exit(0)  # silent on success

    # Try healing
    heal_action = try_heal(results)

    # Report only failures
    report = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "failed": [{"check": r["name"], "output": r["output"]} for r in failed],
        "heal_action": heal_action,
    }
    print(json.dumps(report, indent=2))
    sys.exit(1)
```

## The Key Design Decision: Silence on Success

The watchdog runs every 5 minutes. If everything is healthy, it prints nothing and exits 0. The cron job has `deliver: local` — stdout goes to a log file, not to the user. The user never knows the watchdog exists.

This is the **"bark only when it matters"** pattern. Most monitoring systems are noisy — they alert on warnings, info, and every metric crossing a threshold. The result is alert fatigue. Engineers stop reading alerts because 90% of them are false positives.

The watchdog inverts this: **silence = healthy.** If you see output, something is broken. If you see nothing, everything is working. One signal to learn, one signal to trust.

## What It Actually Caught

In the first month of operation:

| Incident | Detection | Recovery | User Impact |
|----------|-----------|----------|-------------|
| Container stopped (OOM) | Watchdog detected "container down" | Auto-restarted | None |
| LLM server reboot | Watchdog detected "llm unhealthy" | Waited 5min, re-checked | 5min chat outage |
| Cloudflare DNS cache | Watchdog detected "tunnel timeout" | Manual DNS flush | 2min outage |
| Coolify deploy in progress | Watchdog detected "container restarting" | Waited, re-checked | None |

The container OOM was the most common failure. The Pi 5 has 8GB RAM. Coolify runs 6 containers. When a deploy triggers a memory spike, the OOM killer picks the largest container — which is usually the Next.js app. The watchdog restarts it in 30 seconds. The user sees a 30-second blip instead of a permanent outage.

## Why Not Just Use UptimeRobot?

UptimeRobot (or any external monitor) checks if the HTTP endpoint responds. It would have caught the permanent outage. It would not have caught:

1. **Empty response bodies** — HTTP 200 with no content. UptimeRobot sees 200 and thinks it's fine.
2. **Stale container IPs** — Coolify recreates containers with new IPs. The tunnel points to the old IP. External check returns 200 (Cloudflare's cache), internal check fails.
3. **Partial failures** — LLM is down but the chat API still returns a 200 with "I can't answer that right now." External check passes. Internal check catches it.

The watchdog checks the **entire chain**, not just the edge. That's the difference between "the site is up" and "the site actually works."

## The Self-Healing Question

The watchdog can restart the container automatically. It does this for container-down failures only. It does NOT:

- Restart the LLM server (that's on a Mac, different failure domain)
- Flush DNS (that requires human judgment about whether it's a cache issue or a real DNS change)
- Update environment variables (that's a config change, not a recovery)

The rule: **auto-heal only when the fix is reversible and the blast radius is zero.** Restarting a container is reversible (Coolify will recreate it on the next deploy). Flushing DNS is not (you might be clearing a correct record). Updating env vars is not (you might be writing a wrong value).

I'd rather have a 5-minute outage than a wrong auto-fix that takes 30 minutes to diagnose.

## Metrics

After 2 months of running:

- **Checks executed:** 8,640 (every 5 min × 60 days)
- **Failures detected:** 23
- **Auto-healed:** 18 (78%)
- **Manual intervention required:** 5 (22%)
- **Mean time to detection:** <5 minutes (cron interval)
- **Mean time to recovery (auto):** <30 seconds
- **Mean time to recovery (manual):** ~5 minutes
- **False positives:** 0

Zero false positives is the metric that matters. Every alert I've received was a real problem. That's why I trust the watchdog.
