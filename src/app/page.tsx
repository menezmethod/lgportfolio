'use client';

import { ArrowRight, Terminal, Radio, Shield } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const titles = [
  'GCP Professional Cloud Architect',
  'Go · Platform & Infrastructure',
  'Distributed Systems & Reliability',
  'Payment Infrastructure Engineering',
  'Platform Engineering at Scale',
];

const heroSignals = [
  {
    label: 'store footprint',
    value: '2400+',
    note: 'enterprise payment nodes influenced through platform infrastructure',
    status: 'up' as const,
  },
  {
    label: 'service graph',
    value: '50+',
    note: 'payment microservices across the platform surface area',
    status: 'up' as const,
  },
  {
    label: 'critical path',
    value: '<50ms',
    note: 'p99 latency on the hottest transaction paths',
    status: 'live' as const,
  },
  {
    label: 'platform uptime',
    value: '99.99%',
    note: 'platinum-tier reliability across payment infrastructure',
    status: 'up' as const,
  },
] as const;

const migrationCards = [
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
    desc: 'Introduced protobuf contracts and backwards-compatible API versioning. Breaking changes are caught at compile time, not in production during peak hours.',
    tags: ['Protobuf', 'gRPC', 'API Versioning'],
    status: 'up' as const,
  },
];

const platformPatterns = [
  {
    title: 'Service Mesh & Traffic Management',
    desc: 'Wire-level observability and traffic splitting across service boundaries. No-code canary deployments with automatic rollback on error budget depletion.',
  },
  {
    title: 'OpenTelemetry Instrumentation',
    desc: 'End-to-end tracing, metrics, and structured logging unified under a single standard. Every service publishes its contract through telemetry, not documentation.',
  },
  {
    title: 'Incident Response & War Rooms',
    desc: 'Structured investigation with flame graphs, span waterfalls, and metric correlation. Postmortems produce action items, not finger-pointing.',
  },
  {
    title: 'Platform API & Self-Service',
    desc: 'Internal developer platform abstractions that let service teams deploy, observe, and debug without waiting for infrastructure. Infrastructure as product, not as ticket queue.',
  },
];

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

      {/* ── HERO ── */}
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
                Platforms that move
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-code bg-clip-text text-transparent">
                money reliably at
              </span>
              <br />
              <span className="bg-gradient-to-r from-code via-primary to-secondary bg-clip-text text-transparent">
                Fortune 50 scale.
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
              I build Go services, payment rails, observability pipelines, and platform infrastructure.
              Current proof point: a Fortune 50 payments domain with{' '}
              <strong className="text-foreground">2400+ stores, platinum-tier uptime expectations, and sub-50ms critical paths</strong>.
            </p>
          ) : (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              I design and operate distributed systems that move money reliably at Fortune 50 scale.{' '}
              Today that means Go microservices, protobuf contracts, and OpenTelemetry pipelines at{' '}
              <strong className="text-foreground">The Home Depot</strong> —{' '}
              2,400+ stores, platinum-tier uptime, and sub-50ms critical paths.
            </p>
          )}

          {/* Key Metrics */}
          <div>
            <div className="section-indicator mb-4">
              <span>Metrics</span>
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
                    'text-foreground'
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
              <Radio className="w-5 h-5 text-code" />
              AI Chat
            </Link>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="section-divider" />

      {/* ── MIGRATIONS & ARCHITECTURE ── */}
      <section id="migrations" className="py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="section-indicator mb-4">
            <span>Architecture</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Migration <span className="text-primary">&amp; Architecture</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed mb-12">
            I lead complex migrations in high-stakes environments. At enterprise payment scale,
            "move fast and break things" is not an option — every deployment goes through
            blue-green gates, traffic shadowing, and automated rollback validation.
          </p>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {migrationCards.map((item) => (
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

      {/* ── PLATFORM PATTERNS ── */}
      <section id="platform" className="py-20 md:py-32 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="section-indicator mb-4">
            <span>Platform</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Platform <span className="text-primary">Engineering Patterns</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed mb-12">
            Platform engineering is not about tools — it is about reducing cognitive load for service teams.
            The platform is the product, and every abstraction should either speed up delivery or
            reduce incident response time.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {platformPatterns.map((item) => (
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
                <span className="terminal-title">platform-config.yaml</span>
                <span className="ml-auto badge-live">live</span>
              </div>
              <pre className="p-5 text-xs sm:text-sm font-mono text-muted-foreground overflow-x-auto leading-relaxed">
{`platform:
  services:
    - name: tender-processor
      lang: go
      runtime: cloud-run
      sla_p99: 50ms
    - name: payment-orchestrator
      lang: go
      runtime: gke
      sla_p99: 100ms

observability:
  tracing: opentelemetry
  backend: tempo
  alerting: [pagerduty, war-room]

deployment:
  strategy: blue-green
  rollback: automated
  shadow_period: 15m

contracts:
  format: protobuf
  registry: buf`}
              </pre>
            </div>
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap gap-3 mt-10">
            {['Go', 'GCP', 'Terraform', 'GKE', 'Kubernetes', 'Cloud Run', 'BigQuery', 'OpenTelemetry', 'Prometheus', 'Grafana', 'gRPC', 'Protobuf', 'Docker', 'CI/CD', 'Distributed Tracing', 'PostgreSQL', 'Redis'].map((tag) => (
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
