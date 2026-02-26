'use client';

import { ExternalLink, Github, Lock, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Project {
  title: string;
  company?: string;
  description: string;
  challenge?: string;
  solution?: string;
  impact?: string;
  stack: string[];
  architecture: string;
  gcp: string;
  github?: string;
  demo?: string;
  metrics: Record<string, string>;
  featured: boolean;
  type: 'professional' | 'personal';
}

const projects: Project[] = [
  {
    title: 'Payment Card Tender System',
    company: 'The Home Depot',
    description: 'Backend architecture for the critical path processing every credit, debit, and gift card transaction across a nationwide store footprint.',
    challenge: 'Black Friday traffic spikes (order-of-magnitude load) with zero margin for error. Legacy monoliths failing under load with inadequate observability.',
    solution: 'Designed a distributed buffering architecture using Pub/Sub & Cloud Run to decouple ingestion. Built OpenTelemetry tracing pipelines to make the entire payment path observable. Led zero-downtime GCT migration to type-safe Go microservices.',
    impact: 'Zero downtime during peak volume (high-throughput daily transaction volumes). Sub-50ms p99 latency. 20% latency reduction from observability-driven optimization.',
    stack: ['Go', 'GCP Cloud Run', 'Pub/Sub', 'CockroachDB', 'Redis', 'OpenTelemetry', 'Prometheus', 'Grafana'],
    architecture: 'Event-Driven Distributed Systems',
    gcp: 'Cloud Run, Pub/Sub, BigQuery, Cloud Build',
    metrics: { scale: 'Enterprise-scale daily txn', availability: '99.99%', latency: 'p99 < 50ms', improvement: '-20% Latency' },
    featured: true,
    type: 'professional',
  },
  {
    title: 'gimenez.dev AI Portfolio',
    description: 'This portfolio. A RAG-powered AI assistant running on a self-hosted LLM with local knowledge retrieval. Built as a live demonstration of edge AI architecture.',
    challenge: 'Static portfolios fail to answer specific questions. Cloud LLM APIs are expensive at scale and leak context to third parties.',
    solution: 'Engineered a full RAG pipeline: local knowledge base, optional Supabase pgvector for semantic search, self-hosted inference via Inferencia (OpenAI-compatible). Deployed on GCP Cloud Run with Terraform IaC.',
    impact: 'Live production system demonstrating RAG architecture, edge-first AI thinking, and GCP deployment. Operational cost under $2/month.',
    stack: ['Next.js 16', 'TypeScript', 'AI SDK', 'Supabase pgvector', 'Terraform', 'Cloud Run', 'Docker'],
    architecture: 'RAG + Self-Hosted LLM on Cloud Run',
    gcp: 'Cloud Run, Artifact Registry, Secret Manager, Terraform',
    github: 'https://github.com/menezmethod/lgportfolio',
    demo: 'https://gimenez.dev',
    metrics: { cost: '~$2/mo', infra: 'Terraform IaC', ai: 'Local RAG', deployment: 'Cloud Run' },
    featured: true,
    type: 'personal',
  },
  {
    title: 'Churnistic',
    description: 'Automated ML pipeline for customer churn prediction with drift detection and autonomous retraining.',
    challenge: 'Manual ML retraining was a bottleneck, causing model degradation and stale predictions that cost revenue.',
    solution: 'Automated the entire pipeline using TensorFlow.js & Firebase Functions with data drift detection triggers, validation gates, and automatic deployment of superior models.',
    impact: 'Improved model accuracy by 15%. Eliminated 5+ hours/week of manual engineering toil. Caught a data drift issue that manual processes missed for weeks.',
    stack: ['TypeScript', 'TensorFlow.js', 'Firebase Functions', 'React'],
    architecture: 'Event-Driven ML Pipeline',
    gcp: 'Firebase Functions, Cloud Firestore',
    github: 'https://github.com/menezmethod/churnistic',
    demo: 'https://churnistic.vercel.app',
    metrics: { accuracy: '+15%', saved: '5h/week', trigger: 'Drift Detection' },
    featured: true,
    type: 'personal',
  },
  {
    title: 'Real-Time Trading Engine',
    description: 'WebSocket-driven trading platform with Go backend, real-time market data streaming, and portfolio analytics.',
    stack: ['Go', 'WebSockets', 'gRPC', 'PostgreSQL', 'React'],
    architecture: 'Microservices with gRPC + WebSocket',
    gcp: 'Cloud Run capable',
    github: 'https://github.com/menezmethod/st-server',
    metrics: { protocol: 'WebSocket', backend: 'Go + gRPC' },
    featured: false,
    type: 'personal',
  },
];

export default function Work() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-32 px-4 md:px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-emerald-400 font-mono text-sm">$</span>
          <span className="font-mono text-sm text-muted-foreground">ls -la ./projects</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 animate-fadeIn">
          Selected <span className="text-primary">Work</span>
        </h1>

        <div className="space-y-16 md:space-y-24">
          {projects.filter(p => p.featured).map((project, idx) => (
            <div key={project.title} className="group">
              <div className={`grid md:grid-cols-2 gap-12 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="space-y-6">
                  <div className="flex items-center gap-2 flex-wrap">
                    {project.type === 'professional' && (
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-mono rounded border border-primary/20">
                        PRODUCTION
                      </span>
                    )}
                    <h3 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                  </div>

                  {project.challenge ? (
                    <div className="space-y-4 my-6 p-5 rounded-lg bg-card/40 border border-border/50">
                      <div>
                        <h4 className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-1">The Challenge</h4>
                        <p className="text-foreground/90 leading-relaxed">{project.challenge}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-1">The Solution</h4>
                        <p className="text-foreground/90 leading-relaxed">{project.solution}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-1">The Impact</h4>
                        <p className="text-foreground/90 leading-relaxed">{project.impact}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-lg leading-relaxed">{project.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((t) => (
                      <span key={t} className="px-3 py-1 text-xs font-mono bg-card/60 border border-border/50 rounded text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="p-5 rounded-lg border border-border/50 bg-card/30 space-y-3">
                    <p className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px] font-mono text-xs">arch:</span>
                      <span className="text-foreground/90">{project.architecture}</span>
                    </p>
                    <p className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px] font-mono text-xs">gcp:</span>
                      <span className="text-primary">{project.gcp}</span>
                    </p>
                  </div>

                  <div className="flex gap-4 pt-2">
                    {project.type === 'professional' ? (
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 text-muted-foreground text-sm cursor-not-allowed font-mono">
                          <Lock className="w-4 h-4" /> proprietary
                        </span>
                        <Link
                          href="/architecture"
                          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                          <Building2 className="w-4 h-4" /> Architecture Case Study
                        </Link>
                      </div>
                    ) : (
                      <>
                        {project.demo && (
                          <a
                            href={project.demo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink className="w-5 h-5" /> Live
                          </a>
                        )}
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Github className="w-5 h-5" /> Source
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className={`rounded-xl border border-border/50 aspect-video flex items-center justify-center relative overflow-hidden ${project.type === 'professional' ? 'bg-gradient-to-br from-primary/10 via-background to-background' : 'bg-card/30'}`}>
                  <div className="text-center z-10 p-6">
                    <p className="text-muted-foreground mb-4 font-mono text-xs tracking-widest uppercase">{project.company || 'Personal Project'}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mb-6">{project.title}</p>
                    {project.metrics && (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm text-left">
                        {Object.entries(project.metrics).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-muted-foreground text-xs font-mono uppercase tracking-wider mb-1">{key}</span>
                            <span className="text-primary font-mono font-bold text-lg">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {projects.filter(p => !p.featured).length > 0 && (
          <>
            <h2 className="text-2xl font-semibold mt-24 mb-12 flex items-center gap-4">
              <span className="w-8 h-px bg-primary/50"></span>
              Other Work
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.filter(p => !p.featured).map((project) => (
                <div
                  key={project.title}
                  className="p-6 rounded-lg bg-card/30 border border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1 duration-300"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2">{project.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.stack.slice(0, 4).map((t) => (
                      <span key={t} className="px-2 py-1 text-xs font-mono bg-card/60 border border-border/50 rounded text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm mt-auto"
                    >
                      <Github className="w-4 h-4" /> Source
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
