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
              <span className="text-foreground">The Home Depot</span>,
              working on Home Services. I keep an eye on reliability and
              observability, and I&apos;m usually the one who gets pulled
              in when something breaks.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
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
              SRE on the Home Services team. I use OpenTelemetry traces to
              figure out what actually broke in scheduling, dispatch, or
              fulfillment, and I work on the SLOs so we catch it before it
              gets bad.
            </p>
            <p className="text-sm text-muted-foreground">
              Before that: 4 years on Enterprise Payments. Go authorization
              services on CockroachDB, rolled out to 2,300+ stores.
            </p>
          </div>

          {/* Certifications */}
          <div className="text-xs text-muted-foreground font-mono">
            GCP Professional Cloud Architect · active
          </div>
        </div>
      </main>
    </div>
  );
}
