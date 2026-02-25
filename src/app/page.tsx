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
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Systems Architect.</span>
            <br />
            <span className="text-primary">Golang. Edge AI.</span>
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
              I fix broken distributed systems and integrate local AI pipelines.
              Currently scaling payment infrastructure at The Home Depot&mdash;
              <strong className="text-foreground">5M+ daily transactions, 99.99% uptime, sub-50ms p99</strong>.
            </p>
          ) : (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              I fix broken distributed systems and build local AI pipelines.
              Currently engineering mission-critical payment infrastructure at{' '}
              <strong className="text-foreground">The Home Depot</strong>&mdash;
              <strong className="text-foreground">5M+ daily transactions</strong>{' '}
              processed through Go microservices on GCP with 99.99% availability.
            </p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 py-8 border-y border-white/5 my-8 font-mono">
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">5M+</div>
              <div className="text-xs text-muted-foreground mt-1">txn/day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">99.99%</div>
              <div className="text-xs text-muted-foreground mt-1">uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">&lt;50ms</div>
              <div className="text-xs text-muted-foreground mt-1">p99 latency</div>
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
            Massive structural shifts don&apos;t happen by accident. I lead complex,
            zero-downtime backend migrations&mdash;decomposing monolithic payment systems
            into type-safe, scalable Golang microservices without dropping a single transaction.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Zero-Downtime GCT Migrations',
                desc: 'Led multi-phase migration strategies for Gift Card Tender systems. Blue-green deployments, traffic shadowing, and automated rollback gates ensuring zero customer impact.',
                tags: ['Blue-Green', 'Traffic Shadow', 'Rollback Gates'],
              },
              {
                title: 'Monolith Decomposition',
                desc: 'Refactored legacy monolithic payment services into isolated, type-safe Go microservices. Each service owns its data, its deployment, and its on-call rotation.',
                tags: ['Go', 'Domain Isolation', 'Cloud Run'],
              },
              {
                title: 'Type-Safe Contract Evolution',
                desc: 'Introduced protobuf contracts and backwards-compatible API versioning. Breaking changes are caught at compile time, not in production at 2 AM.',
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
            <span className="font-mono text-sm text-muted-foreground">edge-ai.md</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Edge AI <span className="text-primary">&amp; Local RAG</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed mb-12">
            Cloud inference is a solved problem. Running LLMs on a Raspberry Pi with
            512MB of RAM&mdash;that&apos;s where the real engineering happens. I build and test
            local RAG pipelines optimized for edge compute, because not every inference
            call should leave your network.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                {
                  title: 'Local RAG Pipeline Architecture',
                  desc: 'End-to-end retrieval-augmented generation running entirely on local hardware. Vector embeddings, semantic search, and context-aware LLM responses without cloud dependency.',
                },
                {
                  title: 'Model Sanitization & Optimization',
                  desc: 'Using OpenClaw and picoCLAW to sanitize, quantize, and optimize models for constrained environments. GGUF quantization, KV-cache tuning, and memory-mapped inference.',
                },
                {
                  title: 'Edge Compute Targets',
                  desc: 'Optimizing LLM/AI workflows for Raspberry Pi Zero W 2 (512MB) and Raspberry Pi 5 (8GB). Real inference on real hardware, not cloud abstractions.',
                },
                {
                  title: 'Hardware/Software Integration',
                  desc: 'Bridging the gap between ML models and physical compute constraints. Custom inference servers, thermal management, and power-efficient batch processing.',
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
                <span className="ml-2 text-xs text-muted-foreground font-mono">edge-rag.sh</span>
              </div>
              <pre className="p-5 text-xs sm:text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{`#!/bin/bash
# Edge RAG Pipeline — Raspberry Pi 5
# Target: 8GB RAM, ARM64

# Quantize model for edge deployment
picoCLAW quantize \\
  --model mistral-7b-instruct \\
  --format gguf-q4_k_m \\
  --target-ram 4096 \\
  --output /opt/models/

# Sanitize training artifacts
openClaw sanitize \\
  --input /opt/models/mistral-q4.gguf \\
  --strip-pii \\
  --verify-checksums

# Start local inference server
llama-server \\
  --model /opt/models/mistral-q4.gguf \\
  --ctx-size 4096 \\
  --threads 4 \\
  --port 8080 \\
  --embedding

# Benchmark: 12 tok/s on Pi 5 (8GB)
# Benchmark: 2.1 tok/s on Pi Zero W 2
echo "Edge inference ready."`}
              </pre>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-10">
            {['Raspberry Pi 5', 'Raspberry Pi Zero W 2', 'GGUF Quantization', 'OpenClaw', 'picoCLAW', 'llama.cpp', 'Local RAG', 'Edge Compute', 'ARM64'].map((tag) => (
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
            jobTitle: 'Systems Architect & Backend Engineer',
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
