// Auto-generated. Run `npm run generate-posts` to rebuild.
// Contains inline post content so Vercel serverless has zero fs access.

import matter from "gray-matter";

interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
}

const RAW_POSTS: { slug: string; raw: string }[] = [
  { slug: "2026-06-01-inferencia-router-deep-dive", raw: `---
title: "Inferencia: A Smart LLM Router in Go"
description: "Building a Go-based LLM proxy that routes chat, TTS, and embeddings to different backends — and why I hosted it on a Raspberry Pi 5."
date: "2026-06-01"
tags: ["Go", "Infrastructure", "Edge Computing"]
---

## The Problem

I needed a single API endpoint that could front multiple AI backends — Ollama for chat and embeddings, Kokoro for TTS — without exposing each service directly to the internet. The naive approach (run everything on one machine, expose it) breaks as soon as you want to add a second backend type or move a service to different hardware.

## The Architecture

The router is a Go binary that does exactly three things:

1. **Parse the OpenAI-compatible API path** (\`/v1/chat/completions\`, \`/v1/audio/speech\`, \`/v1/embeddings\`)
2. **Route to the correct backend** based on capability tags
3. **Stream responses** back to the client without buffering

The key design decision was **capability-based routing**, not path-based. Each backend registers what it can do:

\`\`\`go
type Backend interface {
    Name() string
    Supports(cap Capability) bool
    RoundTrip(req *Request) (*Response, error)
}
\`\`\`

Adding a new backend (say, a dedicated embeddings service) is a registration, not a routing table change.

## Why Host on a Pi 5?

The Pi 5 is the **control plane** — it runs Coolify, Traefik, and the router. Inference runs on the Mac M4 Max over LAN. Keeping the proxy at the network edge means TLS terminates at the edge, the router stays reachable through inference reboots, and it is a cheap place to experiment with deployment patterns that translate directly to production.

**Relevant to:** Senior platform/infra roles where you own ingress, routing, and middleware.
` },
  { slug: "2026-06-04-watchdog-that-doesnt-bark", raw: `---
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
` },
  { slug: "2026-06-07-rate-limit-postmortem", raw: `---
title: "Rate Limit Postmortem"
description: "How setting CHAT_MAX_RPM_PER_IP to 2 broke my portfolio chat."
date: "2026-06-07"
tags: ["Infrastructure", "API Design"]
---
Three-layer rate limiting: per-IP RPM, session cap, daily budget. Original values: 2 RPM, 10 msgs/session.

With RPM=2, a follow-up within 30 seconds hits the limit. War Room analytics showed real usage: 4-6 msgs/session, 20-45s between messages. New limits: 6 RPM, 30 msgs/session, 150 daily budget.

Lesson: three numbers — burst tolerance, session depth, daily ceiling. Each solves a different problem.
` },
  { slug: "2026-06-10-file-based-rag-without-apology", raw: `---
title: "File-Based RAG Without Apology"
description: "Why I chose a 200-line knowledge module over pgvector — and when you should too."
date: "2026-06-10"
tags: ["Architecture", "RAG", "AI Infrastructure"]
---

## The Default Move

When a portfolio site adds an "AI chat about me" feature, the standard approach is to scrape all your content into a vector database, deploy a retrieval pipeline, add pgvector to PostgreSQL, and pay for Cloud SQL. That is what the first version of this site did.

## Why I Reverted

I was about to deploy a distributed vector search system when I asked a simple question: **how much text actually needs to be searchable?**

About 200 lines — my resume experience, project descriptions, and skills. That is it. I do not have a 10,000-document knowledge base. I have a markdown file that fits on one screen.

The chat API concatenates the knowledge base with the system prompt and sends it to the LLM as a single request. The model 128K context window handles 200 lines trivially.

## The Tradeoff

| Approach | Pros | Cons |
|----------|------|------|
| **In-context RAG** | Zero infra, zero latency, zero maintenance | Does not scale past ~50K tokens |
| **Vector DB** | Handles millions of documents | Added latency, cost, complexity |

For a portfolio site, in-context is the right call. The pgvector infrastructure is still in the Terraform directory — one \`terraform apply\` away if needed.

**Relevant to:** Architecture decisions, system design interviews, platform roles where you own cost vs. complexity tradeoffs.
` },
];

function parsePost(raw: { slug: string; raw: string }): Post {
  const { data, content } = matter(raw.raw);
  return {
    slug: raw.slug,
    title: data.title || "Untitled",
    description: data.description || "",
    date: data.date || "",
    tags: (data.tags || []) as string[],
    content,
  };
}

const parsed = RAW_POSTS.map(parsePost);
export const allPosts: Post[] = parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find(p => p.slug === slug);
}

export function getPostSlugs(): string[] {
  return allPosts.map(p => p.slug);
}
