---
title: "Inferencia: Building a Smart LLM Router in Go"
description: "How I built a Go-based LLM proxy that routes chat, TTS, and embeddings to different backends — and why I hosted it on a Raspberry Pi 5."
date: "2026-06-01"
tags: ["Go", "Infrastructure", "Edge Computing"]
---

## The Problem

I needed a single API endpoint that could front multiple AI backends — Ollama for chat and embeddings, Kokoro for TTS — without exposing each service directly to the internet. The naive approach (run everything on one machine, expose it) breaks as soon as you want to add a second backend type or move a service to different hardware.

## The Architecture

The router is a Go binary that does exactly three things:

1. **Parse the OpenAI-compatible API path** (`/v1/chat/completions`, `/v1/audio/speech`, `/v1/embeddings`)
2. **Route to the correct backend** based on capability tags
3. **Stream responses** back to the client without buffering

```
client → Cloudflare Tunnel → Coolify/Traefik (Pi5) → inferencia (:8080)
                                                          │
                                          ┌───────────────┼───────────────┐
                                          ▼               ▼               ▼
                                      Ollama (Mac)    Kokoro TTS (Mac)   [future]
```

The key design decision was **capability-based routing**, not path-based. Each backend registers what it can do:

```go
type Backend interface {
    Name() string
    Supports(cap Capability) bool
    RoundTrip(req *Request) (*Response, error)
}
```

This means adding a new backend (say, a dedicated embeddings service) is a registration, not a routing table change.

## What I'd Do Differently

**Health-aware routing is missing.** Currently if Ollama goes down, the router still accepts requests and fails at proxy time. The next iteration should probe backends and 503 proactively when upstream is unhealthy. I'll add this when I have a concrete need — speculative flexibility is a trap.

## Why Host on a Pi 5?

It's not about performance. The Pi 5 is a reverse proxy, not an inference server. The real inference happens on the Mac M4 Max over the LAN. The Pi 5 is the **control plane** — it runs Coolify, Traefik, and the router. Keeping the proxy at the network edge (vs. tunneling everything from the Mac) means:

- The Mac can sleep when idle
- TLS termination happens at the edge
- The router is always reachable even if the inference server reboots
- It's a cheap place to experiment with deployment patterns that translate directly to production

**Relevant to:** Senior platform/infra roles where you own the "thin edge" — ingress, routing, middleware — not just the monolith behind it.
