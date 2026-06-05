---
title: "Inferencia: A Smart LLM Router in Go"
description: "Building a Go-based LLM proxy that routes chat, TTS, and embeddings to different backends — and why I hosted it on a Raspberry Pi 5."
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

The key design decision was **capability-based routing**, not path-based. Each backend registers what it can do:

```go
type Backend interface {
    Name() string
    Supports(cap Capability) bool
    RoundTrip(req *Request) (*Response, error)
}
```

Adding a new backend (say, a dedicated embeddings service) is a registration, not a routing table change.

## Why Host on a Pi 5?

The Pi 5 is the **control plane** — it runs Coolify, Traefik, and the router. Inference runs on the Mac M4 Max over LAN. Keeping the proxy at the network edge means TLS terminates at the edge, the router stays reachable through inference reboots, and it is a cheap place to experiment with deployment patterns that translate directly to production.

**Relevant to:** Senior platform/infra roles where you own ingress, routing, and middleware.
