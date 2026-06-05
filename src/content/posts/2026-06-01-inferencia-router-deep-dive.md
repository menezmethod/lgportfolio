---
title: "Inferencia: A Smart LLM Router in Go"
description: "Building a Go-based LLM proxy."
date: "2026-06-01"
tags: ["Go", "Infrastructure"]
---
I needed a single API endpoint that could front multiple AI backends.

The router is a Go binary that parses OpenAI-compatible API paths and routes to backends by capability tags.

```go
type Backend interface {
    Name() string
    Supports(cap Capability) bool
}

```
Adding a new backend is a registration, not a routing table change.