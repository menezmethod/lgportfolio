import { Cpu, Code2, Eye, Shield } from 'lucide-react';

const skills: Record<string, string[]> = {
  'systems architecture': ['Distributed Systems', 'Event-Driven Design', 'Microservices', 'Domain Boundaries', 'System Design'],
  'cloud architecture': ['GKE', 'Cloud Run', 'BigQuery', 'Terraform', 'Cloud Armor'],
  'edge systems': ['ESP32', 'Raspberry Pi 5', 'MQTT', 'Frigate', 'OTA Workflows'],
  'observability': ['OpenTelemetry', 'Prometheus', 'Grafana', 'Tempo', 'PromQL'],
  'platform and data': ['CockroachDB', 'PostgreSQL', 'Redis', 'pgvector', 'Pub/Sub'],
  'ai infrastructure': ['Self-hosted LLMs', 'RAG Pipelines', 'Agentic Ops', 'Inference APIs', 'Runbook Retrieval'],
};

export default function About() {
  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-20 text-foreground md:px-6 md:pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-sm text-emerald-400">$</span>
          <span className="font-mono text-sm text-muted-foreground">cat about.md</span>
        </div>
        <h1 className="mb-10 text-3xl font-bold md:mb-16 md:text-5xl animate-fadeIn">
          Systems Operator. <span className="text-primary">Architect.</span>
        </h1>

        <div className="grid gap-10 md:grid-cols-3 md:gap-16">
          <div className="space-y-8 text-lg leading-relaxed text-muted-foreground md:col-span-2">
            <p>
              I work inside one of the hardest engineering environments to fake: enterprise payments.
              At <span className="font-semibold text-primary">The Home Depot</span>, I contribute to a
              tender ecosystem that supports <span className="font-semibold text-foreground">2400+ stores</span>,
              high-throughput transaction flows, the register-side payment servlet path, and platinum-tier uptime expectations.
            </p>
            <p>
              My focus is not generic full-stack work. I instrument critical paths, reduce operational
              ambiguity, and help move risky systems without customer impact. That is the core skill
              behind my career shift toward <span className="text-foreground">staff and principal-scope systems architecture</span>.
            </p>
            <p>
              The next layer is hardware-cloud fusion: ESP32 nodes, Raspberry Pi 5 gateways, machine
              vision, and GCP analytics tied into public observability boards. I care about the whole
              chain, from noisy sensors and power budgets to trace-linked cloud events and operator tooling.
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
                    <Cpu className="size-5" />
                  </div>
                  <div>
                    <span className="mb-1 block text-lg font-semibold text-foreground">
                      Build Edge-to-Cloud AI Systems
                    </span>
                    <p className="text-muted-foreground">
                      I am less interested in chatbot wrappers than in AI control planes:
                      local inference, retrieval-backed runbooks, public telemetry, and hardware that reports into the cloud as a coherent system.
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
                  title: 'Use AI where operators need leverage',
                  description: 'AI is valuable when it summarizes incidents, retrieves runbooks, or helps reason about edge fleets. It is not valuable as decorative product frosting.',
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
            <div className="sticky top-24 overflow-hidden rounded-xl border border-border/50 bg-card/20">
              <div className="flex items-center gap-2 border-b border-border/50 bg-card/40 px-5 py-3">
                <Code2 className="size-4 text-primary" />
                <span className="font-mono text-sm text-foreground">stack.yml</span>
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
