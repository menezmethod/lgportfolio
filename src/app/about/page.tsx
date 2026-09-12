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
              Before this role, I spent about 4 years on Enterprise Payments — two
              as a contractor and two full-time after conversion. Go authorization
              services on CockroachDB, deployed across a 2,300+ store rollout:
              Card Broker auth routing, Gift Card Tender from initial design
              onward, and modernization off legacy NonStop to reduce PCI scope.
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
                  <li>• Go authorization services on CockroachDB, deployed to GKE, for Card Broker routing</li>
                  <li>• Gift Card Tender from initial design onward: design, implementation, production-readiness review, alerting, on-call</li>
                  <li>• Contributed to modernization off legacy NonStop and PCI-scope reduction via proxy layers</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">
                  Contractor — Enterprise Payments Platform
                </h3>
                <p className="text-sm text-muted-foreground">
                  Daugherty Business Solutions → The Home Depot · Apr 2022 – Jan 2024
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• Joined before Card Broker deployed to any stores</li>
                  <li>• Earned GCP Professional Cloud Architect certification</li>
                  <li>• Hired full-time by The Home Depot in Jan 2024</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">
                  Independent Software Consultant
                </h3>
                <p className="text-sm text-muted-foreground">
                  Menez Enterprises · Sep 2018 – Apr 2022
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• Independent freelance consultancy, custom web applications for small-business clients</li>
                  <li>• End-to-end delivery: architecture, build, deployment, client communication</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium">
                  Web Developer
                </h3>
                <p className="text-sm text-muted-foreground">
                  G World Properties · Sep 2015 – Sep 2018
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                  <li>• Built and maintained websites, internal tools, and APIs for a real-estate company (WordPress, MySQL, Python)</li>
                  <li>• Contributed React/Node and Spring components to web applications and services</li>
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
