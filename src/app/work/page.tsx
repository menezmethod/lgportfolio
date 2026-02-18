'use client';

import { ExternalLink, Github, Building2, Lock } from 'lucide-react';
import Link from 'next/link';

const projects = [
  {
    title: 'Payment Card Tender System',
    company: 'The Home Depot',
    description: 'Backend engineering for the critical path processing credit, debit, and gift card transactions.',
    // Behavioral Patch: Narrative Storytelling (The "Hero's Journey" structure)
    challenge: 'Black Friday traffic spikes (100x load) with zero margin for error.',
    solution: 'Designed a distributed buffering architecture using Pub/Sub & Cloud Run to decouple ingestion.',
    impact: 'Zero downtime and sub-50ms latency during peak volume (5M+ daily transactions).',
    stack: ['Go', 'GCP Pub/Sub', 'Cloud Run', 'CockroachDB', 'Redis', 'Prometheus'],
    architecture: 'Event-Driven Distributed Systems',
    gcp: 'High-scale serverless orchestration',
    metrics: { scale: '5M+ Daily Txn', availability: '99.99%', latency: 'p99 < 50ms' },
    featured: true,
    type: 'professional'
  },

  {
    title: 'Churnistic',
    description: 'Automated ML pipeline for customer churn prediction.',
    // Behavioral Patch: Narrative Storytelling
    challenge: 'Manual ML retraining was a bottleneck, causing model degradation and stale predictions.',
    solution: 'Automated the entire pipeline using TensorFlow.js & Firebase Functions with drift detection.',
    impact: 'Improved model accuracy by 15% and saved 5+ hours/week of manual engineering time.',
    stack: ['TypeScript', 'React', 'Firebase', 'TensorFlow'],
    architecture: 'Event-driven microservices',
    gcp: 'Serverless ML Pipeline',
    github: 'https://github.com/menezmethod/churnistic',
    demo: 'https://churnistic.vercel.app',
    metrics: { accuracy: '+15%', saved: '5h/week' },
    featured: true,
    type: 'personal'
  },
  {
    title: 'Stock Trading Journal',
    description: 'Real-time trading platform with WebSocket updates and portfolio analytics.',
    stack: ['Go', 'React', 'WebSockets', 'PostgreSQL'],
    architecture: 'Microservices with gRPC',
    gcp: 'Cloud Run capable',
    github: 'https://github.com/menezmethod/st-server',
    metrics: { realtime: 'WebSocket Data', users: 'N/A' },
    featured: true,
    type: 'personal'
  },
  {
    title: 'KiwiBug',
    description: 'Full-stack issue tracking system with role-based access control.',
    stack: ['Java', 'Spring Boot', 'React', 'PostgreSQL'],
    architecture: 'RESTful API Monolith',
    gcp: 'Cloud SQL integration',
    github: 'https://github.com/menezmethod/KiwiBugBack',
    metrics: { features: 'Auth/RBAC', ui: 'Responsive' },
    featured: true,
    type: 'personal'
  },
  {
    title: 'Inventory Management',
    description: 'Comprehensive inventory tracking system for business operations.',
    stack: ['Spring Boot', 'React', 'MySQL'],
    architecture: 'N-Tier Architecture',
    gcp: 'Containerized deployment',
    github: 'https://github.com/menezmethod/inventorysystemreact',
    metrics: { efficiency: '+25%', type: 'Business App' },
    featured: false,
    type: 'personal'
  },
];

export default function Work() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-32 px-4 md:px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 animate-fadeIn">
          <span className="text-primary font-mono">[1]</span> Selected Work
        </h1>

        {/* Featured Projects */}
        <div className="space-y-16 md:space-y-24">
          {projects.filter(p => p.featured).map((project, idx) => (
            <div key={project.title} className="group">
              <div className={`grid md:grid-cols-2 gap-12 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    {project.type === 'professional' && (
                      <span className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full border border-secondary/20">
                        Professional Architecture
                      </span>
                    )}
                    <h3 className="text-2xl font-semibold text-primary group-hover:text-primary/80 transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  
                  {/* Behavioral Patch: Narrative Rendering */}
                  {(project as any).challenge ? (
                    <div className="space-y-4 my-6 p-5 rounded-lg bg-primary/5 border border-primary/10">
                      <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">The Challenge</h4>
                        <p className="text-foreground/90 leading-relaxed">{(project as any).challenge}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">The Solution</h4>
                        <p className="text-foreground/90 leading-relaxed">{(project as any).solution}</p>
                      </div>
                       <div>
                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">The Impact</h4>
                        <p className="text-foreground/90 leading-relaxed">{(project as any).impact}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-lg leading-relaxed">{project.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((t) => (
                      <span key={t} className="px-3 py-1 text-sm bg-primary/5 border border-primary/10 rounded-full text-foreground/80">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="glass-card p-6 rounded-xl border border-white/5 space-y-3 bg-card/50">
                    <p className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px] font-medium">Architecture:</span>
                      <span className="text-foreground/90">{project.architecture}</span>
                    </p>
                    <p className="text-sm flex items-start gap-2">
                      <span className="text-muted-foreground min-w-[100px] font-medium">GCP Impact:</span>
                      <span className="text-primary">{project.gcp}</span>
                    </p>
                  </div>

                  <div className="flex gap-4 pt-2">
                    {project.type === 'professional' ? (
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-2 text-muted-foreground text-sm cursor-not-allowed">
                          <Lock className="w-4 h-4" /> Proprietary Code
                        </span>
                        <Link 
                          href="/architecture"
                          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
                        >
                           <Building2 className="w-4 h-4" /> View Architecture Case Study
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
                            <ExternalLink className="w-5 h-5" /> Live Demo
                          </a>
                        )}
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Github className="w-5 h-5" /> Code
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className={`rounded-xl border border-white/10 aspect-video flex items-center justify-center relative overflow-hidden ${project.type === 'professional' ? 'bg-gradient-to-br from-primary/20 via-background to-background' : 'bg-card/50'}`}>
                  {project.type === 'professional' && (
                     <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                  )}
                  
                  <div className="text-center z-10 p-6">
                    <p className="text-muted-foreground mb-4 font-mono text-sm tracking-widest uppercase">{project.company || "Personal Project"}</p>
                    <p className="text-2xl md:text-3xl font-bold text-foreground mb-6">{project.title}</p>
                    {project.metrics && (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm text-left">
                        {Object.entries(project.metrics).map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">{key}</span>
                            <span className="text-primary font-mono font-bold text-lg">
                              {value}
                            </span>
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

        {/* Other Projects */}
        <h2 className="text-2xl font-semibold mt-24 mb-12 flex items-center gap-4">
          <span className="w-8 h-px bg-primary/50"></span>
          Other Experiments
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.filter(p => !p.featured).map((project) => (
            <div
              key={project.title}
              className="glass-card p-6 hover:border-primary/30 transition-all hover:-translate-y-1 duration-300 rounded-xl bg-card/30"
            >
              <h3 className="text-lg font-semibold text-foreground mb-2">{project.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.stack.slice(0, 3).map((t) => (
                  <span key={t} className="px-2 py-1 text-xs bg-primary/5 border border-primary/10 rounded text-muted-foreground">
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
                  <Github className="w-4 h-4" /> View Code
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
