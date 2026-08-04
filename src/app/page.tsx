'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
        <div className="space-y-12">
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Luis Gimenez
            </h1>
            <p className="text-lg text-muted-foreground">
              Site Reliability Engineer at{' '}
              <span className="text-foreground">The Home Depot</span>.
              Reliability, observability, and incident response for Home Services.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <Link
              href="/writing"
              className="block text-foreground hover:text-primary transition-colors"
            >
              Writing →
            </Link>
            <Link
              href="/about"
              className="block text-foreground hover:text-primary transition-colors"
            >
              About / Experience →
            </Link>
            <Link
              href="https://github.com/menezmethod"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-foreground hover:text-primary transition-colors"
            >
              GitHub →
            </Link>
            <Link
              href="https://linkedin.com/in/gimenezdev"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-foreground hover:text-primary transition-colors"
            >
              LinkedIn →
            </Link>
            <Link
              href="/contact"
              className="block text-foreground hover:text-primary transition-colors"
            >
              Contact →
            </Link>
          </div>

          {/* Current */}
          <div className="border-l-2 border-border pl-6 space-y-2">
            <p className="text-sm text-muted-foreground font-mono">
              currently
            </p>
            <p className="text-sm">
              SRE on Home Services Division. OpenTelemetry distributed tracing,
              SLO-driven reliability, incident response for scheduling, dispatch,
              and fulfillment.
            </p>
            <p className="text-sm text-muted-foreground">
              Previously: 4 years on Enterprise Payments — Go services,
              2400+ stores, platinum-tier uptime.
            </p>
          </div>

          {/* Certifications */}
          <div className="text-xs text-muted-foreground font-mono">
            GCP Professional Cloud Architect — Active
          </div>
        </div>
      </main>
    </div>
  );
}
