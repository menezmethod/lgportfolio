import Link from 'next/link';
import { Terminal } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-card/60 border border-border/50 font-mono text-sm text-muted-foreground">
          <span className="text-red-400">$</span>
          <span>404 — not found</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-foreground">
          4<span className="text-primary">0</span>4
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed">
          This page doesn&apos;t exist. Maybe it was moved, maybe it never was.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border/50 text-foreground rounded-lg hover:bg-card/60 transition-all font-mono text-sm"
          >
            <Terminal className="size-4 text-primary" />
            Ask the AI
          </Link>
        </div>
      </div>
    </div>
  );
}
