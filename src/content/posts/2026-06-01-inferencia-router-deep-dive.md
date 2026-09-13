---
title: "Inferencia: Building a Smart LLM Router in Go"
description: "How I built a Go-based LLM proxy that routes chat, TTS, and embeddings to different backends, and why I hosted it on a Raspberry Pi 5."
date: "2026-06-01"
tags: ["Go", "Infrastructure", "Edge Computing"]
---

I needed one API endpoint that could sit in front of multiple AI backends (Ollama for chat and embeddings, Kokoro for TTS) without exposing either one directly to the internet. Just running everything on one machine and exposing it works fine, until you want a second backend type or you want to move something to different hardware. Then it breaks.

## The architecture

The router is a Go binary. It does three things: parses the OpenAI-compatible path (`/v1/chat/completions`, `/v1/audio/speech`, `/v1/embeddings`), routes to the right backend by capability tag, and streams responses back without buffering.

```
client → Cloudflare Tunnel → Coolify/Traefik (Pi5) → inferencia (:8080)
                                                          │
                                          ┌───────────────┼───────────────┐
                                          ▼               ▼               ▼
                                      Ollama (Mac)    Kokoro TTS (Mac)   [future]
```

The real decision was capability-based routing instead of path-based. Each backend registers what it can actually do:

```go
type Backend interface {
    Name() string
    Supports(cap Capability) bool
    RoundTrip(req *Request) (*Response, error)
}
```

Adding a new backend, say a dedicated embeddings service, is just a registration. Not a routing table change.

## What's still missing

Health-aware routing. Right now, if Ollama goes down, the router still takes the request and fails at proxy time instead of catching it earlier. The next version should probe backends and return 503 before that happens. I haven't built it because I don't have a concrete need for it yet, and building it now would just be speculative flexibility. That's usually a trap.

## Why a Pi 5?

Not for performance. The Pi 5 is a reverse proxy, not an inference server. The actual inference runs on my Mac M4 Max over the LAN. The Pi 5 is the control plane: it runs Coolify, Traefik, and the router. Keeping the proxy at the network edge instead of tunneling everything off the Mac means the Mac can sleep when it's idle, TLS terminates at the edge, the router stays reachable even if the inference box reboots, and it's a cheap place to try deployment patterns before they matter in production.
