---
title: "What Building a Reverse Proxy Taught Me About Reliability"
description: "A Go reverse proxy for AI backends taught more about health checking, circuit breaking, and traffic management than any textbook. Lessons from running it on a Raspberry Pi 5 in production."
date: "2026-06-01"
tags: ["Go", "Infrastructure", "Reliability"]
---

I built a Go reverse proxy to front multiple AI backends — Ollama for chat, Kokoro for TTS, embeddings for search. One endpoint, multiple upstreams, different capabilities. It runs on a Raspberry Pi 5 and routes to inference servers on a Mac M4 Max over the LAN.

The proxy itself is boring. 200 lines of Go that parse an OpenAI-compatible API path and forward to the right backend. The interesting part is what it taught me about reliability patterns I'd seen in production but never built from scratch.

## Health Checking Is Non-Negotiable

The first version had no health checks. It accepted requests and forwarded them. When Ollama went down for a model reload, the proxy returned 502 with no explanation. The caller retried. The retry hit the proxy again. Same 502. Cascading failure from a 30-second Ollama restart.

The fix was a health probe that runs every 10 seconds:

```go
func (p *Proxy) checkHealth(ctx context.Context) {
    for _, backend := range p.backends {
        if err := backend.Probe(ctx); err != nil {
            backend.SetHealthy(false)
            log.Warn("backend unhealthy",
                "backend", backend.Name(),
                "error", err,
            )
        } else {
            backend.SetHealthy(true)
        }
    }
}
```

When the health check fails, the proxy returns 503 immediately — no retry, no timeout, no wasted work. The caller gets a clear signal: "backend is down, come back later." In production systems, a fast failure is always better than a slow timeout. The proxy learned the same lesson every load balancer learns.

## Circuit Breaking Across Backends

The proxy has three backends. One goes down, the others should keep working. But without circuit breaking, a slow backend poisons the connection pool. Ollama takes 30 seconds to load a model — the proxy holds a connection open for 30 seconds, starving the pool for TTS and embedding requests.

The circuit breaker pattern:

```
State: CLOSED (normal) → failure threshold exceeded → OPEN (fast-fail)
→ timeout expires → HALF-OPEN (probe) → success → CLOSED
```

```go
type CircuitBreaker struct {
    failures    int32
    threshold   int32
    resetAfter  time.Duration
    state       State
    lastFailure time.Time
}

func (cb *CircuitBreaker) Execute(fn func() error) error {
    if cb.state == Open {
        if time.Since(cb.lastFailure) > cb.resetAfter {
            cb.state = HalfOpen
        } else {
            return ErrCircuitOpen
        }
    }

    err := fn()
    if err != nil {
        if atomic.AddInt32(&cb.failures, 1) >= cb.threshold {
            cb.state = Open
            cb.lastFailure = time.Now()
        }
        return err
    }

    cb.state = Closed
    atomic.StoreInt32(&cb.failures, 0)
    return nil
}
```

The key insight: **the circuit breaker is per-backend, not global.** A TTS outage shouldn't block chat requests. Each backend gets its own breaker, its own failure count, its own reset timer. This is the same pattern used in production service meshes — just smaller.

## What This Taught Me About Production SRE

The proxy is a toy. It runs on a Pi 5 and serves a portfolio site. But the patterns are identical to what I see in production:

| Pattern | Toy Proxy | Production System |
|---------|-----------|-------------------|
| Health checking | HTTP probe every 10s | Deep health checks (DB, cache, dependencies) |
| Circuit breaking | Per-backend, 3 failures to open | Per-service, with error budget integration |
| Fast failure | 503 immediately | Graceful degradation, fallback responses |
| Connection pooling | Per-backend pool | Per-destination, with retry budgets |
| Retry budget | None (caller decides) | Token bucket, max retries per request |

The difference is scale, not complexity. A Pi 5 proxy and a GKE service mesh solve the same problems: how do you route traffic, handle failures, and keep the system responsive when parts of it are down?

## What I'd Do Differently

**Request hedging is missing.** For latency-sensitive routes, send the request to two backends simultaneously and use the first response. This cuts tail latency in half at the cost of 2x compute. I'd add this if inference latency became a real bottleneck.

**No retry budget.** The caller decides whether to retry. In a production system, I'd add a token bucket that limits retries per time window — prevents the retry storm that killed us in the first version.

**No observability.** The proxy logs errors but doesn't emit metrics. A production version would expose request count, latency histogram, circuit breaker state, and backend health as Prometheus metrics. That's the first thing I'd add.

## The Real Lesson

Building a reverse proxy from scratch taught me more about reliability than reading about service meshes. When you implement health checking, you understand why production systems need deep probes. When you implement circuit breaking, you understand why Netflix invented Hystrix. When you break your own system and fix it with data, you stop trusting architecture diagrams and start trusting traces.

The patterns scale. The Pi 5 learns the same lessons as GKE. The difference is how many users notice when you get it wrong.
