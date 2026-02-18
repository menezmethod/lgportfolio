'use client';

import { Code2, Cloud, Database, Cpu } from 'lucide-react';

const skills = {
  architecture: ['Distributed Systems', 'Microservices', 'Event-Driven', 'System Design', 'Cloud Native'],
  cloud: ['Google Cloud Platform', 'Cloud Run', 'Pub/Sub', 'BigQuery', 'Terraform (IaC)'],
  languages: ['Go (Golang)', 'Java', 'TypeScript', 'SQL', 'Rust'],
  observability: ['Prometheus', 'Grafana', 'Jaeger', 'OpenTelemetry'],
  domains: ['Fintech/Payments', 'High-Throughput Systems', 'PCI-DSS Compliance', 'AI Engineering'],
};

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-24 px-4 md:px-6 pb-16">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 animate-fadeIn">
          <span className="text-primary font-mono">[0]</span> Professional Profile
        </h1>

        <div className="grid md:grid-cols-3 gap-10 md:gap-16">
          <div className="md:col-span-2 space-y-8 text-lg leading-relaxed text-muted-foreground">
            <p>
              I am a <span className="text-foreground font-semibold">Distributed Systems Engineer</span> at <span className="text-primary font-semibold">The Home Depot</span>, 
              where I architect and build mission-critical payment processing infrastructures handling 
              <span className="text-foreground font-semibold"> billions of dollars in annual transactions</span>.
            </p>
            <p>
              My work sits at the intersection of reliability, scale, and performance. I specialize in designing 
              <span className="text-foreground"> high-throughput Go microservices</span> on Google Cloud Platform that can withstand 
              Black Friday traffic spikes without breaking a sweat.
            </p>

            <h2 className="text-2xl font-bold text-foreground mt-10 mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full"></span>
              Impact & Architecture
            </h2>
            <ul className="space-y-6">
              <li className="group">
                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-card/50 transition-colors border border-transparent hover:border-border">
                   <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                     <Cpu className="size-5" />
                   </div>
                   <div>
                     <span className="text-foreground font-semibold block text-lg mb-1">Scale & Reliability</span>
                     <p className="text-muted-foreground">Maintained 99.99% availability for payment services processing 5M+ daily transactions. High-concurrency architecture is not a buzzword—it's my daily reality.</p>
                   </div>
                </div>
              </li>
              <li className="group">
                 <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-card/50 transition-colors border border-transparent hover:border-border">
                   <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                     <Cloud className="size-5" />
                   </div>
                   <div>
                     <span className="text-foreground font-semibold block text-lg mb-1">Cloud Native Modernization</span>
                     <p className="text-muted-foreground">Led the architectural migration of legacy monoliths to serverless Go microservices on Cloud Run, achieving a 40% reduction in end-to-end latency.</p>
                   </div>
                </div>
              </li>
              <li className="group">
                 <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-card/50 transition-colors border border-transparent hover:border-border">
                   <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                     <Database className="size-5" />
                   </div>
                   <div>
                     <span className="text-foreground font-semibold block text-lg mb-1">Data Integrity & Security</span>
                     <p className="text-muted-foreground">Architected idempotent transaction flows and PCI-DSS compliant data handling strategies. In payments, you cannot lose data, and you cannot be doubled-billed.</p>
                   </div>
                </div>
              </li>
            </ul>
            
            <h2 className="text-2xl font-bold text-foreground mt-10 mb-6">Beyond the Terminal</h2>
            <p>
              When I'm not optimizing garbage collection in Go, I'm building AI tools (like this portfolio's assistant) and exploring Rust. 
              I'm also preparing for the arrival of my first child — learning that <span className="text-primary font-medium">patience and eventual consistency</span> apply to parenting just as much as distributed databases.
            </p>


            {/* Behavioral Patch: Social Proof */}
            <h2 className="text-2xl font-bold text-foreground mt-12 mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full"></span>
              Peer Feedback
            </h2>
            <div className="grid gap-6">
              <blockquote className="p-6 bg-muted/10 border border-white/5 rounded-xl relative overflow-hidden group hover:border-primary/20 transition-colors">
                <p className="text-lg italic text-muted-foreground mb-4 relative z-10">
                  "The engineer I trust with the most critical systems. Doesn't just fix bugs — fixes the process that let the bug happen."
                </p>
                <footer className="text-sm font-bold text-foreground flex items-center gap-2">
                  — Senior Engineering Lead <span className="text-muted-foreground font-normal">@ The Home Depot</span>
                </footer>
              </blockquote>
              
              <div className="grid md:grid-cols-2 gap-6">
                 <blockquote className="p-6 bg-muted/10 border border-white/5 rounded-xl hover:border-primary/20 transition-colors">
                  <p className="italic text-muted-foreground mb-4">
                    "Brings data to every discussion. 'Let's benchmark it' beats 'because I said so'."
                  </p>
                  <footer className="text-sm font-bold text-foreground">
                    — Principal Engineer
                  </footer>
                </blockquote>
                <blockquote className="p-6 bg-muted/10 border border-white/5 rounded-xl hover:border-primary/20 transition-colors">
                  <p className="italic text-muted-foreground mb-4">
                    "Ramps up new engineers faster than anyone. Mentorship is his default mode."
                  </p>
                  <footer className="text-sm font-bold text-foreground">
                    — Engineering Manager
                  </footer>
                </blockquote>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="glass-card p-8 rounded-xl sticky top-24 border border-border/50 bg-card/20 backdrop-blur-md">
              <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Code2 className="size-5 text-primary" />
                Technical Arsenal
              </h3>
              <div className="space-y-8">
                {Object.entries(skills).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-xs font-bold text-primary tracking-widest uppercase mb-3 border-b border-primary/20 pb-1">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 text-sm bg-secondary/10 hover:bg-secondary/20 transition-colors rounded-md text-secondary border border-secondary/20"
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
