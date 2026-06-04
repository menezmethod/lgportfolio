'use client';

import { ArrowRight, Terminal, Radio, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const titles = [
  'GCP Professional Cloud Architect',
  'Go · Platform & Infrastructure',
  'Edge Systems & Observability',
  'AI Infrastructure & Agentic Ops',
  'Silicon-to-Satellite Operator',
];

const heroSignals = [
  {
    label: 'store footprint',
    value: '2400+',
    note: 'retail nodes influenced through enterprise payments',
    status: 'up' as const,
  },
  {
    label: 'service graph',
    value: '50+',
    note: 'payment services across the platform surface area',
    status: 'up' as const,
  },
  {
    label: 'critical path',
    value: '<50ms',
    note: 'p99 latency target on the hottest transaction paths',
    status: 'live' as const,
  },
  {
    label: 'edge lab',
    value: 'Pi 5 · ESP32',
    note: 'hardware-in-the-loop gateway and sensor control plane',
    status: 'up' as const,
  },
] as const;

function PortfolioContent() {
  const searchParams = useSearchParams();
  const isRecruiter = searchParams.get('ref') === 'recruiter';
  const [currentTitle, setCurrentTitle] = useState(0);
  const [typedLine, setTypedLine] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const titleInterval = setInterval(() => {
      setCurrentTitle((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(titleInterval);
  }, []);

  // Terminal typing effect for the intro line
  useEffect(() => {
    const fullText = './identify --role';
    let idx = 0;
    let blinkInterval: ReturnType<typeof setInterval> | null = null;
    const typeInterval = setInterval(() => {
      if (idx < fullText.length) {
        setTypedLine(fullText.slice(0, idx + 1));
        idx++;
      } else {
        clearInterval(typeInterval);
        blinkInterval = setInterval(() => {
          setShowCursor((prev) => !prev);
        }, 530);
      }
    }, 40);
    return () => {
      clearInterval(typeInterval);
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16 pb-20">

      {/* ── HERO — OPERATIONS CONSOLE ── */}
      <section className="min-h-[90vh] flex items-center justify-center px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">

          {/* Terminal Intro */}
          <div className="terminal-window max-w-md mx-auto md:mx-0">
            <div className="terminal-header">
              <div className="terminal-dot terminal-dot-red" />
              <div className="terminal-dot terminal-dot-yellow" />
              <div className="terminal-dot terminal-dot-green" />
              <span className="terminal-title">~/session.sh — zsh</span>
            </div>
            <div className="terminal-body space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-code">❯</span>
                <span className="text-foreground/90">{typedLine}</span>
                {showCursor && typedLine.length === './identify --role'.length && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-2 text-foreground/90">
                <span className="text-code">◈</span>
                <span className="font-semibold text-foreground">Luis Gimenez</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-code">Senior Platform Engineer</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-code">❯</span>
                <span>cat /etc/location</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-code">◈</span>
                <span>Tampa Bay, FL · Remote / Hybrid</span>
              </div>
            </div>
          </div>

          {/* Hero Headline */}
          <div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Systems that start
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-code bg-clip-text text-transparent">
                at silicon and end
              </span>
              <br />
              <span className="bg-gradient-to-r from-code via-primary to-secondary bg-clip-text text-transparent">
                in the cloud.
              </span>
            </h1>
          </div>

          {/* Rotating Subtitle */}
          <div className="h-[50px] md:h-[60px] flex items-center" aria-label="Current role" aria-live="polite">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-card/40 border border-border/50">
              <span className="badge-live">active</span>
              <span className="font-mono text-sm md:text-base text-muted-foreground transition-all duration-500">
                <span className="text-primary/90">{titles[currentTitle]}</span>
                <span className="animate-pulse ml-1 text-primary" aria-hidden="true">▎</span>
              </span>
            </div>
          </div>

          {/* Description */}
          {isRecruiter ? (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed border-l-2 border-primary/30 pl-6">
              <strong className="text-foreground">Currently: Software Engineer II building Fortune 50 payment infrastructure.</strong>{' '}
              Targeting Senior Platform Engineer roles.{' '}
              Tampa Bay based, open to remote and hybrid (≤2 days/week).{' '}
              I build Go services, payment rails, observability pipelines, and edge-to-cloud systems.
              Current proof point: a Fortune 50 payments domain with{' '}
              <strong className="text-foreground">2400+ stores, platinum-tier uptime expectations, and sub-50ms critical paths</strong>.
            </p>
          ) : (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              I design systems that start at hardware and end in measurable cloud outcomes.
              Today that means Go services and mission-critical payment infrastructure at a{' '}
              <strong className="text-foreground">Fortune 50 retailer</strong>. Next it means
              public edge labs built from <strong className="text-foreground">ESP32 nodes, Raspberry Pi 5 gateways, and GCP observability</strong>.
            </p>
          )}

          {/* Telemetry Tiles */}
          <div>
            <div className="section-indicator mb-4">
              <span>Telemetry</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {heroSignals.map((signal) => (
                <div key={signal.label} className="telemetry-tile">
                  <div className="flex items-center justify-between mb-3">
                    <span className="telemetry-label">{signal.label}</span>
                    <span className={signal.status === 'live' ? 'badge-live' : 'badge-up'} />
                  </div>
                  <div className={`telemetry-value ${
                    signal.status === 'live' ? 'text-primary' :
                    signal.label === 'store footprint' ? 'text-foreground' :
                    signal.label === 'edge lab' ? 'text-code' : 'text-foreground'
                  }`}>
                    {signal.value}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {signal.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Credential Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-card/40 border border-border/50">
              <span className="badge-up">verified</span>
              <span className="text-xs font-mono text-muted-foreground tracking-wide">
                <span className="text-code">gcp:</span> Google Cloud Professional Cloud Architect — Active
              </span>
            </div>
          </div>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center pt-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg
                hover:bg-primary/90 transition-all text-lg glow-primary hover:scale-[1.03] duration-200"
              aria-label="Get in touch"
            >
              Get in Touch <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-8 py-4 border border-border/50 text-foreground rounded-lg
                hover:bg-card/60 transition-all text-base font-mono"
            >
              <Terminal className="w-5 h-5 text-primary" />
              View Architecture
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 bg-card/40 text-foreground border border-border/50 rounded-lg
                hover:bg-card/60 transition-all text-base font-mono"
            >
              <Sparkles className="w-5 h-5 text-code" />
              AI Chat
            </Link>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="section-divider" />

      {/* ── WAR ROOM & OBSERVABILITY ── */}
      <section id="war-room" className="py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="section-indicator mb-4">
            <span>Observability</span>
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
                <div key={item.label} className="telemetry-tile">
                  <h3 className="font-mono text-primary text-sm font-semibold mb-2">{item.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Terminal Code Block */}
            <div className="terminal-window self-start">
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red" />
                <div className="terminal-dot terminal-dot-yellow" />
                <div className="terminal-dot terminal-dot-green" />
                <span className="terminal-title">otel-collector.yaml</span>
                <span className="ml-auto badge-up">running</span>
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
        value: tender-services
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

      {/* ── DIVIDER ── */}
      <div className="section-divider" />

      {/* ── ENTERPRISE MIGRATION ── */}
      <section id="migration" className="py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="section-indicator mb-4">
            <span>Deployments</span>
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
                title: 'Zero-Downtime Tender Migrations',
                desc: 'Led multi-phase migration strategies for enterprise tender systems. Blue-green deployments, traffic shadowing, and automated rollback gates ensuring zero customer impact.',
                tags: ['Blue-Green', 'Traffic Shadow', 'Rollback Gates'],
                status: 'up' as const,
              },
              {
                title: 'Monolith Decomposition',
                desc: 'Refactored legacy monolithic payment services into isolated, type-safe Go microservices. Each service owns its data, its deployment, and its on-call rotation.',
                tags: ['Go', 'Domain Isolation', 'Cloud Run'],
                status: 'up' as const,
              },
              {
                title: 'Type-Safe Contract Evolution',
                desc: 'Introduced protobuf contracts and backwards-compatible API versioning. Breaking changes are caught at compile time, not in production at 2 AM.',
                tags: ['Protobuf', 'gRPC', 'API Versioning'],
                status: 'up' as const,
              },
            ].map((item) => (
              <div key={item.title} className="telemetry-tile group">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                  <span className="badge-up" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-[11px] font-mono bg-primary/5 border border-primary/10 rounded text-primary/70">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="section-divider" />

      {/* ── SILICON TO SATELLITE ── */}
      <section id="edge-ai" className="py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="section-indicator mb-4">
            <span>Edge Fleet</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Silicon-to-Satellite <span className="text-primary">Systems</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed mb-12">
            The next chapter of this portfolio is not another web app. It is a networked edge lab:
            ESP32 sensor nodes, Raspberry Pi 5 gateways, machine vision, and GCP analytics wired into
            a public operations board. AI belongs in the control plane, not as a thin wrapper on top of CRUD.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[
                {
                  title: 'ESP32 Sensor Fleet',
                  desc: 'Telemetry at the edge: environmental sensing, heartbeat signals, OTA coordination, and real sampling cadence on physical hardware.',
                },
                {
                  title: 'Pi 5 Edge Gateway',
                  desc: 'Local buffering, MQTT ingress, Frigate workloads, and edge-side rules so the system remains useful even when the cloud is unavailable.',
                },
                {
                  title: 'GCP Analytics Plane',
                  desc: 'Cloud Run services normalize events, BigQuery stores long-horizon telemetry, and dashboards expose the system as an operator surface instead of a hobby project.',
                },
                {
                  title: 'Agentic Operations Layer',
                  desc: 'Runbooks, RAG, and event summarization sit on top of real telemetry so AI helps operators reason about incidents instead of pretending to be the product.',
                },
              ].map((item) => (
                <div key={item.title} className="telemetry-tile">
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Terminal Code Block */}
            <div className="terminal-window self-start">
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red" />
                <div className="terminal-dot terminal-dot-yellow" />
                <div className="terminal-dot terminal-dot-green" />
                <span className="terminal-title">edge-fleet.yaml</span>
                <span className="ml-auto badge-live">live</span>
              </div>
              <pre className="p-5 text-xs sm:text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{`fleet:
  sensor_nodes:
    - esp32-soil-01
    - esp32-climate-02
  edge_gateway:
    host: raspberry-pi-5
    services: [mqtt, frigate, heartbeat-watcher]

cloud:
  ingest_api: cloud-run
  analytics: bigquery
  observability: [cloud-monitoring, war-room]

ai:
  role: incident summarization + runbook retrieval
  source_of_truth: live telemetry, not guesses`}
              </pre>
            </div>
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap gap-3 mt-10">
            {['Go', 'GCP', 'Terraform', 'GKE / Kubernetes', 'ESP32', 'Raspberry Pi 5', 'Frigate', 'Cloud Run', 'BigQuery', 'OpenTelemetry', 'Distributed Tracing', 'RAG'].map((tag) => (
              <span key={tag} className="px-3 py-1.5 text-xs font-mono bg-card/40 border border-border/50 rounded text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="section-divider" />

      {/* ── STATUS BAR ── */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto flex justify-center">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-card/40 border border-border/50">
            <span className="badge-live">available</span>
            <Radio className="size-4 text-code" />
            <p className="text-sm font-mono text-muted-foreground">
              accepting interviews &mdash; Senior Platform Engineer roles
            </p>
            <span className="h-4 w-px bg-border/50" />
            <span className="text-[11px] font-mono text-muted-foreground tracking-wide">
              status: <span className="text-code">open</span>
            </span>
          </div>
        </div>
      </section>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Luis Gimenez',
            jobTitle: 'Senior Platform Engineer',
            url: 'https://gimenez.dev',
            sameAs: [
              'https://github.com/menezmethod',
              'https://linkedin.com/in/gimenezdev',
              'https://twitter.com/menezmethod',
            ],
            worksFor: {
              '@type': 'Organization',
              name: 'The Home Depot',
            },
            knowsAbout: ['Go', 'Java', 'GCP', 'Terraform', 'Kubernetes', 'OpenTelemetry', 'Distributed Systems', 'Payment Architecture'],
          }),
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-primary">booting...</div>}>
      <PortfolioContent />
    </Suspense>
  );
}
