# ADR-001: Single Cloud Run Instance with Budget Kill Switch

**Status:** Accepted
**Date:** 2026-02

## Context

This portfolio site (gimenez.dev) is a personal project that must cost under $20/month to operate. Cloud Run offers scale-to-zero but can incur unexpected costs under traffic spikes or abuse. The site includes an AI chat endpoint that makes external LLM API calls, creating an additional cost vector.

## Decision

Run a single Cloud Run instance (max-instances=1) behind a Global External Application Load Balancer with Cloud CDN and Cloud Armor. Implement a $20 budget kill switch via GCP Budget Alerts + Cloud Function that automatically sets max-instances=0 when budget thresholds are exceeded.

Rate limiting is applied at two layers:
- **Cloud Armor (edge):** 60/min global, 10/min for `/api/chat`
- **Application:** 2 RPM per IP, 10 msgs/session, 150 LLM requests/day

## Consequences

- **Positive:** Costs stay at ~$18-20/month (ALB is the main fixed cost). Automatic budget protection prevents runaway billing. In-memory metrics are practical with a single instance.
- **Negative:** In-memory telemetry metrics reset on cold starts. No horizontal scaling — a sustained traffic spike will hit rate limits or be dropped. This is acceptable for a portfolio site.
- **Mitigated:** CDN caching for static pages (1h TTL) and server-side caching for API responses (30s war-room, 60s RAG) absorb most spike traffic without hitting the application.
