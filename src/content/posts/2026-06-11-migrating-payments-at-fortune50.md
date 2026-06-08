---
title: "What I Learned Migrating Payment Services at a Fortune 50"
date: 2026-06-11
tags: ["Architecture", "Payments", "Infrastructure"]
description: "Lessons from migrating payment flows at The Home Depot — what worked, what broke, and how we kept 2400+ stores processing while changing the system underneath."
---

In 2023, 1,200+ transactions failed because a gateway rotated their TLS. Our monolith "PayCore" had no circuit breaker. One config change took down 2,400+ stores for 37 min.

PayCore was a single Java WAR handling everything.

```
BEFORE          AFTER
┌────────┐     ┌────────┐
│POS/Web │     │POS/Web │
└───┬────┘     └───┬────┘
    │              │
┌───▼───┐     ┌───▼────┐
│PayCore│     │ API Gw │
│Monolith│    └───┬────┘
│All flows│      │
└───┬────┘   ┌───▼──┐ ┌──────┐
    │       │Auth  │ │Settle│
┌───▼──┐   │Canary│ │Async │
│Gwys  │   └───┬──┘ └──────┘
└──────┘      │
         ┌────▼─────┐
         │Gw Abstrac│
         │Cct Bkr   │
         └────┬─────┘
              │
         ┌────▼─────┐
         │TSYS│ FIS │
         └────┴────┘
```

**Strangler Fig.** Carved out tokenization, settlement, gift cards. Tokenization looked easy — PayCore used custom H2, not the PCI vault. Six weeks lost.

**Traffic Shadowing.** Two weeks of parallel auth. Caught a 3.2% decline-code mismatch — old code mapped gateway errors wrong.

**Feature Flags.** LaunchDarkly by store, type, amount. Missed: per-response-code flags. A processor returned "call issuer" mid-canary. Rolled back.

**Canary.** Gates: burn < 2x, approval ±0.5%, P99 ±150ms. 1→5→20→100→500→all. Store #47 on satellite (900ms) broke gRPC. Added proxy.

| Strategy | Risk | Cutover | Rollback | Validation |
|---|---|---|---|---|
| Blue/Green | Low | Fast | Instant | Pre-deploy |
| Canary | Very Low | Gradual | Gradual | Real-time |
| Shadow | None | N/A | N/A | **Best** |
| Flags | Low-Med | Instant | Instant | Per-req |

## Retro

1. **Failures as data** — per-gateway config beats hand-coded retry.
2. **Simulate satellite** — store networking ≠ DC.
3. **Shadow offline** — batch costs 10% of real-time.
4. **Risk first** — hidden PCI coupling.

After 14mo, PayCore was gone. **99.99%** uptime, **400ms** latency (was 847ms), **3x** faster integrations, **zero** full outages. Scariest: processing $40M with the kill switch next to my coffee. Best: Monday when nobody noticed.
