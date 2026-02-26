'use client';

import { ArrowRight, Sparkles, Terminal, Eye, GitMerge, Cpu, Radio } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const titles = [
  'GCP Professional Cloud Architect',
  'Distributed Systems Engineer',
  'Edge AI & Local RAG Builder',
  'War Room Operator',
];

function PortfolioContent() {
  const searchParams = useSearchParams();
  const isRecruiter = searchParams.get('ref') === 'recruiter';
  const [currentTitle, setCurrentTitle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitle((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16 pb-20">

      {/* ── HERO ── */}
      <section className="min-h-[90vh] flex items-center justify-center px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-6 md:space-y-8 animate-fadeIn">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card/60 border border-border/50 font-mono text-sm text-muted-foreground">
            <span className="text-emerald-400">$</span>
            <span>whoami</span>
            <span className="animate-pulse text-primary">_</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold">
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Systems Engineer.</span>
            <br />
            <span className="text-primary">Golang. Reliability. AI.</span>
          </h1>

          <div className="h-[50px] md:h-[60px] mb-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-mono text-muted-foreground">
              <span className="text-primary/80 transition-all duration-500">
                {titles[currentTitle]}
              </span>
              <span className="animate-pulse ml-1 text-primary">_</span>
            </h2>
          </div>

          {isRecruiter ? (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4 border-l-2 border-primary/50 pl-6 text-left">
              <strong className="text-foreground">Available for Senior, Staff &amp; Architect roles.</strong>{' '}
              I fix reliability gaps in distributed systems and integrate local AI pipelines.
              Currently an SE II contributor on a 100+ engineer payments organization at The Home Depot&mdash;
              high-volume traffic, strict uptime constraints, and real production ownership.
            </p>
          ) : (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              I fix reliability bottlenecks in distributed systems and build local AI pipelines.
              Currently engineering mission-critical payment infrastructure at{' '}
              <strong className="text-foreground">The Home Depot</strong> as an individual contributor on a large team.
              My focus is observability, production operations, and migration support across Go services on GCP.
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 py-8 border-y border-white/5 my-8 font-mono">
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">185K+</div>
              <div className="text-xs text-muted-foreground mt-1">txn/hour context</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">100+</div>
              <div className="text-xs text-muted-foreground mt-1">engineer org</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">50+</div>
              <div className="text-xs text-muted-foreground mt-1">microservices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-emerald-400">GCP</div>
              <div className="text-xs text-muted-foreground mt-1">certified architect</div>
            </div>
          </div>

          <div className="flex justify-center mb-12">
            <span className="px-6 py-3 bg-card/60 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-mono tracking-wide">
              Google Cloud Professional Cloud Architect &mdash; Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-lg shadow-lg shadow-primary/20 hover:scale-105 duration-200"
              aria-label="Get in touch"
            >
              Get in Touch <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border/50 text-foreground rounded-lg hover:bg-card/60 transition-all text-base font-mono"
            >
              <Terminal className="w-5 h-5 text-primary" />
              View Architecture
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 bg-card/40 text-foreground border border-white/5 rounded-lg hover:bg-card/60 transition-all text-lg"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              AI Chat
            </Link>
          </div>
        </div>
      </section>

      {/* ── WAR ROOM & OBSERVABILITY ── */}
      <section id="war-room" className="py-20 md:py-32 px-4 md:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="size-5 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">war-room.md</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            War Room <span className="text-primary">&amp; Observability</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed mb-12">
            I don&apos;t just write code; I make distributed systems{' '}
            <em className="text-foreground not-italic font-semibold">visible</em>.
            When legacy architectures fail silently, I build the OpenTelemetry pipelines
            and tracing standards that expose the gaps, allowing teams to navigate
            production War Rooms with actual data instead of guesswork.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                { label: 'OpenTelemetry', desc: 'End-to-end instrumentation of distributed services. Traces, metrics, and logs unified under a single standard.' },
                { label: 'Distributed Tracing (Tempo)', desc: 'Full request lifecycle visibility across microservice boundaries. Pinpoint latency sources in seconds, not hours.' },
                { label: 'Payload Mapping', desc: 'Correlate business payloads with infrastructure telemetry. When a transaction fails, know exactly where, why, and what data was involved.' },
                { label: 'Root Cause Analysis', desc: 'Structured incident investigation. Flame graphs, span waterfalls, and metric correlation to eliminate guesswork from postmortems.' },
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-lg bg-card/40 border border-border/50 hover:border-primary/30 transition-colors">
                  <h3 className="font-mono text-primary font-semibold mb-2">{item.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border/60 bg-[#0a0a0f] overflow-hidden shadow-2xl self-start">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-card/20">
                <div className="size-3 rounded-full bg-red-500/60" />
                <div className="size-3 rounded-full bg-yellow-500/60" />
                <div className="size-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">otel-collector.yaml</span>
              </div>
              <pre className="p-5 text-xs sm:text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{`receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:
    timeout: 5s
    send_batch_size: 1024
  attributes:
    actions:
      - key: service.team
        value: payment-card-tender
        action: upsert

exporters:
  otlp/tempo:
    endpoint: tempo.observability:4317
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: payment_system

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, attributes]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus]`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE MIGRATION ── */}
      <section id="migration" className="py-20 md:py-32 px-4 md:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <GitMerge className="size-5 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">migration-playbook.md</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Enterprise <span className="text-primary">Migration</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed mb-12">
            Massive structural shifts don&apos;t happen by accident. I contribute to complex,
            zero-downtime backend migration programs&mdash;helping decompose legacy payment paths
            into safer, more observable Go services without customer disruption.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Zero-Downtime GCT Migrations',
                desc: 'Contributed to multi-phase migration strategies for Gift Card Tender systems, including rollout support, observability validation, and rollback readiness.',
                tags: ['Blue-Green', 'Traffic Shadow', 'Rollback Gates'],
              },
              {
                title: 'Monolith Decomposition',
                desc: 'Supported decomposition of legacy payment services into isolated Go microservices with stronger ownership boundaries and safer operations.',
                tags: ['Go', 'Domain Isolation', 'Cloud Run'],
              },
              {
                title: 'Type-Safe Contract Evolution',
                desc: 'Implemented safer contract-evolution patterns so breaking changes are detected earlier in delivery, not during production incidents.',
                tags: ['Protobuf', 'gRPC', 'API Versioning'],
              },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-lg bg-card/40 border border-border/50 hover:border-primary/30 transition-colors group">
                <h3 className="font-semibold text-lg text-foreground mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs font-mono bg-primary/5 border border-primary/10 rounded text-primary/80">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EDGE AI & LOCAL RAG ── */}
      <section id="edge-ai" className="py-20 md:py-32 px-4 md:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="size-5 text-primary" />
            <span className="font-mono text-sm text-muted-foreground">local-ai.md</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Edge AI <span className="text-primary">&amp; Local RAG</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed mb-12">
            Cloud inference is a solved problem. Running a self-hosted LLM and local RAG on your own
            hardware&mdash;for example, a MacBook Pro M4 Max with 128GB RAM&mdash;keeps inference off the
            cloud when it matters. I build and test local RAG pipelines so not every call has to leave your network.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                {
                  title: 'Local RAG Pipeline Architecture',
                  desc: 'End-to-end retrieval-augmented generation on your own hardware. Vector embeddings, semantic search, and context-aware LLM responses without cloud dependency.',
                },
                {
                  title: 'Model Optimization for Local Inference',
                  desc: 'Quantization and optimization for local serving: GGUF, KV-cache tuning, memory-mapped inference. Models that run well on high-end Apple Silicon.',
                },
                {
                  title: 'Self-Hosted Inference',
                  desc: 'The LLM backing this site runs on a MacBook Pro M4 Max (128GB). Hobby hardware experiments exist, but production chat inference for this site is on the MacBook host.',
                },
                {
                  title: 'Hardware/Software Integration',
                  desc: 'Bridging model serving and local compute with an OpenAI-compatible inference endpoint, backend guardrails, and efficient execution on Apple Silicon.',
                },
              ].map((item) => (
                <div key={item.title} className="p-5 rounded-lg bg-card/40 border border-border/50 hover:border-primary/30 transition-colors">
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border/60 bg-[#0a0a0f] overflow-hidden shadow-2xl self-start">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-card/20">
                <div className="size-3 rounded-full bg-red-500/60" />
                <div className="size-3 rounded-full bg-yellow-500/60" />
                <div className="size-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-muted-foreground font-mono">local-inference.sh</span>
              </div>
              <pre className="p-5 text-xs sm:text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{`#!/bin/bash
# Local RAG / inference — MacBook Pro M4 Max 128GB
# OpenAI-compatible API + RAG on your own hardware

# Start local inference server (OpenAI-compatible)
# Serves the model that backs gimenez.dev/chat
inferencia serve \\
  --model mlx-community/gpt-oss-20b-MXFP4-Q8 \\
  --port 8080

# RAG: embeddings + retrieval + context
# This site: knowledge base + retrieval + chat API guardrails
echo "Local inference ready."`}
              </pre>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-10">
            {['Apple Silicon', 'M4 Max', 'gpt-oss', 'Self-hosted LLM', 'Local RAG', 'OpenClaw (hobby)', 'Inferencia', 'OpenAI-compatible API'].map((tag) => (
              <span key={tag} className="px-3 py-1.5 text-xs font-mono bg-card/60 border border-border/50 rounded-lg text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATUS ── */}
      <section className="py-12 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex justify-center">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card/40 border border-border/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <Radio className="size-4 text-emerald-400" />
            <p className="text-sm font-mono text-muted-foreground">
              accepting interviews &mdash; senior, staff &amp; architect roles
            </p>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Luis Gimenez',
            jobTitle: 'Software Engineer II / Backend Engineer',
            url: 'https://gimenez.dev',
            sameAs: [
              'https://github.com/menezmethod',
              'https://linkedin.com/in/gimenezdev',
              'https://twitter.com/menezmethod',
            ],
            alumniOf: 'The Home Depot',
            knowsAbout: ['Go', 'Distributed Systems', 'GCP', 'Edge AI', 'OpenTelemetry', 'Payment Architecture'],
          }),
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary font-mono">loading...</div>}>
      <PortfolioContent />
    </Suspense>
  );
}
