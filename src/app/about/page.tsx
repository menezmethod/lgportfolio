'use client';

import { Eye, Shield, Cpu, Code2 } from 'lucide-react';

const skills: Record<string, string[]> = {
  'systems & architecture': ['Distributed Systems', 'Event-Driven Architecture', 'Microservices', 'Domain-Driven Design', 'System Design'],
  'cloud (gcp certified)': ['Cloud Run', 'Pub/Sub', 'BigQuery', 'Cloud Build', 'Terraform', 'Cloud Armor'],
  'languages': ['Go (primary)', 'TypeScript', 'Java', 'Rust', 'Python'],
  'observability': ['OpenTelemetry', 'Prometheus', 'Grafana', 'Jaeger / Tempo', 'PromQL'],
  'data': ['CockroachDB', 'PostgreSQL', 'Redis', 'pgvector'],
  'local ai & rag': ['Self-hosted LLM', 'Apple Silicon', 'GGUF Quantization', 'RAG Pipelines', 'llama.cpp'],
};

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-24 px-4 md:px-6 pb-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-emerald-400 font-mono text-sm">$</span>
          <span className="font-mono text-sm text-muted-foreground">cat about.md</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 animate-fadeIn">
          Systems Thinker. <span className="text-primary">Builder.</span>
        </h1>

        <div className="grid md:grid-cols-3 gap-10 md:gap-16">
          <div className="md:col-span-2 space-y-8 text-lg leading-relaxed text-muted-foreground">
            <p>
              I am a <span className="text-foreground font-semibold">Systems Architect and Backend Engineer</span> at{' '}
              <span className="text-primary font-semibold">The Home Depot</span>.
              I build and operate the payment card tender system&mdash;the critical path that
              processes every credit, debit, and gift card transaction across 2,300+ stores
              and e-commerce, handling{' '}
              <span className="text-foreground font-semibold">5M+ daily transactions</span>.
            </p>
            <p>
              My work sits at the intersection of{' '}
              <span className="text-foreground">reliability, observability, and performance</span>.
              I design high-throughput Go microservices on Google Cloud Platform that absorb
              Black Friday–scale traffic spikes without degradation. When systems fail under load,
              I build the tracing infrastructure that makes failures visible.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10 mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full"></span>
              What I Do
            </h2>
            <ul className="space-y-6">
              <li className="group">
                <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-card/50 transition-colors border border-transparent hover:border-border/50">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                    <Eye className="size-5" />
                  </div>
                  <div>
                    <span className="text-foreground font-semibold block text-lg mb-1">Make Distributed Systems Visible</span>
                    <p className="text-muted-foreground">
                      I build the OpenTelemetry pipelines, Grafana dashboards, and tracing standards that turn
                      &quot;it&apos;s slow&quot; into &quot;span X in service Y is adding 200ms due to a missing
                      index.&quot; My observability work directly caused a 20% latency reduction across payment services.
                    </p>
                  </div>
                </div>
              </li>
              <li className="group">
                <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-card/50 transition-colors border border-transparent hover:border-border/50">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <span className="text-foreground font-semibold block text-lg mb-1">Migrate Without Downtime</span>
                    <p className="text-muted-foreground">
                      I lead zero-downtime migrations of legacy payment systems to type-safe Go microservices.
                      Blue-green deployments, traffic shadowing, automated rollback gates. Every migration
                      I&apos;ve led has had zero customer impact.
                    </p>
                  </div>
                </div>
              </li>
              <li className="group">
                <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-card/50 transition-colors border border-transparent hover:border-border/50">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                    <Cpu className="size-5" />
                  </div>
                  <div>
                    <span className="text-foreground font-semibold block text-lg mb-1">Local AI &amp; RAG</span>
                    <p className="text-muted-foreground">
                      I build and test local RAG pipelines. The LLM behind this site runs on my MacBook Pro M4 Max
                      (128GB)&mdash;self-hosted inference, no cloud required. Not every call needs to leave your network.
                    </p>
                  </div>
                </div>
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-foreground mt-12 mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full"></span>
              Peer Feedback
            </h2>
            <div className="grid gap-6">
              <blockquote className="p-6 bg-card/30 border border-border/50 rounded-lg relative overflow-hidden group hover:border-primary/20 transition-colors">
                <p className="text-lg italic text-muted-foreground mb-4 relative z-10">
                  &quot;The engineer I trust with the most critical systems. Doesn&apos;t just fix
                  bugs&mdash;fixes the process that let the bug happen.&quot;
                </p>
                <footer className="text-sm font-bold text-foreground flex items-center gap-2">
                  &mdash; Senior Engineering Lead <span className="text-muted-foreground font-normal">@ The Home Depot</span>
                </footer>
              </blockquote>

              <div className="grid md:grid-cols-2 gap-6">
                <blockquote className="p-6 bg-card/30 border border-border/50 rounded-lg hover:border-primary/20 transition-colors">
                  <p className="italic text-muted-foreground mb-4">
                    &quot;Brings data to every discussion. &apos;Let&apos;s benchmark it&apos; beats
                    &apos;because I said so.&apos;&quot;
                  </p>
                  <footer className="text-sm font-bold text-foreground">
                    &mdash; Principal Engineer
                  </footer>
                </blockquote>
                <blockquote className="p-6 bg-card/30 border border-border/50 rounded-lg hover:border-primary/20 transition-colors">
                  <p className="italic text-muted-foreground mb-4">
                    &quot;Ramps up new engineers faster than anyone. Mentorship is his default mode.&quot;
                  </p>
                  <footer className="text-sm font-bold text-foreground">
                    &mdash; Engineering Manager
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="rounded-xl sticky top-24 border border-border/50 bg-card/20 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50 bg-card/40">
                <Code2 className="size-4 text-primary" />
                <span className="font-mono text-sm text-foreground">stack.yml</span>
              </div>
              <div className="p-5 space-y-6">
                {Object.entries(skills).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-xs font-mono text-primary tracking-wider uppercase mb-3 pb-1 border-b border-primary/20">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 text-xs bg-card/60 border border-border/50 rounded text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
