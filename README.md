# Luis Gimenez — Portfolio & Production System

**Live site:** [gimenez.dev](https://gimenez.dev) · **War Room:** [gimenez.dev/war-room](https://gimenez.dev/war-room)

[![CI](https://img.shields.io/github/actions/workflow/status/menezmethod/lgportfolio/ci.yml?branch=main&logo=github&label=CI)](https://github.com/menezmethod/lgportfolio/actions)
[![Deploy](https://img.shields.io/badge/Coolify-Deployed-6366f1)](https://gimenez.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

A **production Next.js portfolio** deployed on **Coolify** (`gimenez.dev`), with an AI-powered recruiter chat, live observability (War Room), session analytics, and optional **GCP** infra preserved in-repo for rollback (Cloud Run, ALB, Terraform, Cloud Build — not removed).

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/menezmethod/lgportfolio.git
cd lgportfolio

# Install
npm install

# Set up environment
cp .env.example .env.local
# Add your Clerk, Firebase, Inferencia, GA4 keys

# Start dev server
npm run dev
```

## 🏗️ Architecture

The portfolio is a Next.js App Router application deployed on **Coolify** (Docker on a homelab Pi), with server-side rendering for public pages and client components for interactive features. The AI recruiter chat uses a multi-tier fallback stack (Gemini → Anthropic → Inferencia/local LLM) with session persistence via Firestore. Observability is provided by a live War Room dashboard with Prometheus metrics and structured logging. The optional GCP deployment path (Cloud Run + Terraform) is preserved for rollback scenarios.

### Key Components

- **AI Recruiter Chat** — Multi-provider chat with knowledge base, session memory, email capture, and admin controls
- **War Room** — Live observability dashboard with telemetry, Prometheus metrics, and error tracing
- **Blog** — Technical writing on infrastructure engineering with syntax highlighting
- **Infrastructure** — Coolify on homelab Pi; Terraform for optional GCP Cloud Run rollback

## 🤖 Auto-Pipeline

This repo is part of an autonomous fleet. PRs are auto-reviewed, auto-tested, and auto-merged by the fleet pipeline.

## 📚 Documentation

- [PRD](./PRD.md) — Product Requirements Document
- [Architecture (RICO)](./RICO.md) — Architecture decision records
- [AGENTS.md](./AGENTS.md) — Agent instructions for Cursor/IDE
- [Deployment Guide](./docs/deploy.md) — Full deployment documentation
- [Knowledge Base](./knowledge/) — AI chat knowledge entries
