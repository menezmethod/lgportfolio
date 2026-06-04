import { Eye, Shield, GitBranch } from 'lucide-react';

const skills: Record<string, string[]> = {
  'programming languages': ['Go (Proficient)', 'Java (Proficient)', 'TypeScript (Working)', 'Python (Working)', 'SQL (Proficient)'],
  'cloud infrastructure': ['GCP (Proficient)', 'GKE (Working)', 'Cloud Run (Proficient)', 'BigQuery (Working)', 'Terraform (Working)', 'Cloud Armor (Working)'],
  'systems architecture': ['Distributed Systems (Proficient)', 'Event-Driven Design (Proficient)', 'Microservices (Proficient)', 'Domain Boundaries (Proficient)', 'System Design (Proficient)'],
  'platform engineering': ['Kubernetes (Working)', 'Docker (Proficient)', 'CI/CD (Proficient)', 'gRPC (Proficient)', 'Protobuf (Working)', 'API Design (Proficient)'],
  'observability': ['OpenTelemetry (Proficient)', 'Prometheus (Proficient)', 'Grafana (Proficient)', 'Tempo (Working)', 'PromQL (Working)', 'Alerting (Proficient)'],
  'data & storage': ['CockroachDB (Working)', 'PostgreSQL (Proficient)', 'Redis (Working)', 'Pub/Sub (Working)', 'BigQuery (Proficient)'],
};

export default function About() {
  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-20 text-foreground md:px-6 md:pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="section-indicator mb-6">
          <span>About</span>
        </div>
        <h1 className="mb-10 text-3xl font-bold md:mb-16 md:text-5xl">
          Senior Platform Engineer. <span className="text-primary">Payment Infrastructure.</span>
        </h1>

        <div className="grid gap-10 md:grid-cols-3 md:gap-16">
          <div className="space-y-8 text-lg leading-relaxed text-muted-foreground md:col-span-2">
            <p>
              I work inside one of the hardest engineering environments to fake: enterprise payments.
              At <span className="font-semibold text-primary">The Home Depot</span>, I design and build
              Go-based payment services that support <span className="font-semibold text-foreground">2400+ stores</span>,
              high-throughput transaction flows, and platinum-tier uptime expectations.
            </p>
            <p>
              My focus is not generic full-stack work. I instrument critical paths, reduce operational
              ambiguity, and move risky systems without customer impact. At a Fortune 50 retailer,
              that means designing Go payment services that process real transactions at scale,
              building OpenTelemetry pipelines that expose gaps in legacy architectures,
              and leading zero-downtime migrations that decompose monoliths without dropping a single payment.
            </p>
            <p>
              Based in the <span className="text-foreground">Tampa Bay area</span>, I am open to remote and hybrid (≤2 days/week) roles
              in platform engineering, infrastructure, and systems architecture.
            </p>
            <p>
              The next frontier is platform-as-product: internal developer platforms that abstract
              infrastructure complexity, self-service deployment pipelines, and observability-driven
              operations that let teams ship fast without sacrificing reliability.
            </p>

            <h2 className="mt-10 mb-6 flex items-center gap-3 text-2xl font-bold text-foreground">
              <span className="h-8 w-1 rounded-full bg-primary" />
              What I Build
            </h2>
            <ul className="space-y-6">
              <li className="group">
                <div className="flex items-start gap-4 rounded-lg border border-transparent p-4 transition-colors hover:border-border/50 hover:bg-card/50">
                  <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
                    <Eye className="size-5" />
                  </div>
                  <div>
                    <span className="mb-1 block text-lg font-semibold text-foreground">
                      Instrument Critical Paths
                    </span>
                    <p className="text-muted-foreground">
                      I build the telemetry that turns vague production pain into measurable facts.
                      Traces, dashboards, alert rules, and canonical logs are architecture, not afterthoughts.
                    </p>
                  </div>
                </div>
              </li>
              <li className="group">
                <div className="flex items-start gap-4 rounded-lg border border-transparent p-4 transition-colors hover:border-border/50 hover:bg-card/50">
                  <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
                    <Shield className="size-5" />
                  </div>
                  <div>
                    <span className="mb-1 block text-lg font-semibold text-foreground">
                      Move Risky Systems Safely
                    </span>
                    <p className="text-muted-foreground">
                      Zero-downtime migrations, rollback gates, traffic shadowing, and tight change
                      discipline are the difference between architecture theater and operating systems that survive contact with reality.
                    </p>
                  </div>
                </div>
              </li>
              <li className="group">
                <div className="flex items-start gap-4 rounded-lg border border-transparent p-4 transition-colors hover:border-border/50 hover:bg-card/50">
                  <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
                    <GitBranch className="size-5" />
                  </div>
                  <div>
                    <span className="mb-1 block text-lg font-semibold text-foreground">
                      Build Platform Abstractions
                    </span>
                    <p className="text-muted-foreground">
                      I create the internal developer platform tooling that lets service teams
                      deploy, observe, and debug without tickets. Infrastructure as product,
                      not as bottleneck.
                    </p>
                  </div>
                </div>
              </li>
            </ul>

            <h2 className="mt-12 mb-6 flex items-center gap-3 text-2xl font-bold text-foreground">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Operating Principles
            </h2>
            <div className="grid gap-6">
              {[
                {
                  title: 'Measure before opinion',
                  description: 'If a system is important, it deserves traces, metrics, and an incident timeline. Guesswork is not an operating model.',
                },
                {
                  title: 'Design for failure, not the demo',
                  description: 'Rollback paths, cache expiry, replay protection, and error budgets matter more than pretty architecture diagrams.',
                },
                {
                  title: 'Platforms reduce cognitive load',
                  description: 'Every platform abstraction should either speed up delivery or reduce incident response time. If it does neither, it is infrastructure theater.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-border/50 bg-card/30 p-6 transition-colors hover:border-primary/20"
                >
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="terminal-window sticky top-24">
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red" />
                <div className="terminal-dot terminal-dot-yellow" />
                <div className="terminal-dot terminal-dot-green" />
                <span className="terminal-title">stack.yml</span>
              </div>
              <div className="space-y-6 p-5">
                {Object.entries(skills).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="mb-3 border-b border-primary/20 pb-1 text-xs font-mono uppercase tracking-wider text-primary">
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map((skill) => (
                        <span
                          key={skill}
                          className="rounded border border-border/50 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
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
