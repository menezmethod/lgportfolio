import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
          About
        </h1>

        <div className="space-y-12">
          {/* Bio */}
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              SRE at{' '}
              <span className="text-foreground font-medium">The Home Depot</span>{' '}
              Home Services Division. Reliability, observability, and operational
              excellence for scheduling, dispatch, and fulfillment services.
            </p>
            <p>
              Before this role, I spent 4 years on Enterprise Payments — two as a
              contractor and two full-time after conversion. Go services, 2400+
              stores, platinum-tier uptime, and zero-downtime migrations that
              decompose monoliths without dropping a single payment.
            </p>
            <p>
              Based in{' '}
              <span className="text-foreground">Tampa Bay, FL</span>. Open to
              remote and hybrid (≤2 days/week).
            </p>
          </div>

          {/* Experience */}
          <div>
            <h2 className="text-sm font-mono text-muted-foreground mb-6 uppercase tracking-wider">
              Experience
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="font-medium">
                  Site Reliability Engineer — Home Services Division
                </h3>
                <p className="text-sm text-muted-foreground">
                  The Home Depot · Mar 2026 – Present
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• OpenTelemetry distributed tracing across multi-service stack</li>
                  <li>• SLO-driven reliability practices and incident response</li>
                  <li>• Platform observability tooling</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">
                  Software Engineer II — Enterprise Payments Platform
                </h3>
                <p className="text-sm text-muted-foreground">
                  The Home Depot · Jan 2024 – Mar 2026
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• Production Go services on GKE for Card Broker routing</li>
                  <li>• OpenTelemetry pipelines and Grafana dashboards</li>
                  <li>• Zero-downtime migrations and PCI DSS infrastructure</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">
                  Contractor — Enterprise Payments Platform
                </h3>
                <p className="text-sm text-muted-foreground">
                  Daugherty Business Solutions → The Home Depot · Jul 2022 – Jan 2024
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• Joined before Card Broker deployed to any stores</li>
                  <li>• Earned GCP Professional Cloud Architect certification</li>
                  <li>• Hired full-time when the team broke the contract to retain</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">
                  Founder / Software Consultant
                </h3>
                <p className="text-sm text-muted-foreground">
                  Menez Enterprises · 2016 – 2022
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• Independent consultancy, custom web applications</li>
                  <li>• End-to-end delivery: architecture, deployment, clients</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-sm font-mono text-muted-foreground mb-4 uppercase tracking-wider">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                'Go', 'Java', 'TypeScript', 'Python',
                'GCP', 'GKE', 'Terraform', 'Kubernetes', 'Docker',
                'OpenTelemetry', 'Prometheus', 'Grafana', 'Tempo',
                'PostgreSQL', 'Redis', 'CockroachDB',
                'gRPC', 'Protobuf', 'CI/CD',
                'Distributed Systems', 'SRE', 'Incident Response',
              ].map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 text-xs font-mono bg-card border border-border rounded text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/contact"
            className="inline-block text-foreground hover:text-primary transition-colors"
          >
            Get in touch →
          </Link>
        </div>
      </main>
    </div>
  );
}
