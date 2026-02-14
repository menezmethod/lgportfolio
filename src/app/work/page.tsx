'use client';

import { ExternalLink, Github } from 'lucide-react';

const projects = [
  {
    title: 'Churnistic',
    description: 'AI-powered customer churn prediction platform with real-time analytics.',
    stack: ['TypeScript', 'React', 'Firebase', 'TensorFlow'],
    architecture: 'Event-driven microservices',
    gcp: 'Demonstrates Cloud Run + Pub/Sub patterns applicable to enterprise payment systems',
    github: 'https://github.com/menezmethod/churnistic',
    demo: 'https://churnistic.vercel.app',
    metrics: { coverage: '95%', latency: 'p99 < 200ms' },
    featured: true,
  },
  {
    title: 'Trading Journal',
    description: 'Real-time trading platform with WebSocket updates and portfolio analytics.',
    stack: ['React TypeScript', 'Go gRPC', 'WebSockets', 'PostgreSQL'],
    architecture: 'Microservices with gRPC',
    gcp: 'Deployable to Cloud Run with Cloud SQL',
    github: 'https://github.com/menezmethod/trading-journal',
    metrics: { realtime: 'WebSocket updates', users: '1000+' },
    featured: true,
  },
  {
    title: 'Rythmae',
    description: 'Cross-platform audio engine built with Rust and DSP algorithms.',
    stack: ['Rust', 'DSP', 'Cross-platform'],
    architecture: 'Core audio processing library',
    gcp: 'Could leverage Cloud Run for processing',
    github: 'https://github.com/menezmethod/rythmae',
    metrics: { latency: '< 10ms', platforms: '3' },
    featured: true,
  },
  {
    title: 'URL Shortener',
    description: 'High-throughput URL shortening service built for scale.',
    stack: ['Go', 'Redis', 'Kubernetes', 'gRPC'],
    architecture: 'Distributed cache + database',
    gcp: 'GKE deployment, Cloud Memorystore',
    github: 'https://github.com/menezmethod/url-shortener',
    metrics: { rps: '10,000+', latency: 'p99 < 5ms' },
    featured: false,
  },
];

export default function Work() {
  return (
    <div className="min-h-screen bg-black text-white pt-32 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-16">
          <span className="text-[#32c0f4] font-mono">[1]</span> Projects
        </h1>

        {/* Featured Projects */}
        <div className="space-y-24">
          {projects.filter(p => p.featured).map((project, idx) => (
            <div key={project.title} className="group">
              <div className={`grid md:grid-cols-2 gap-12 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-[#32c0f4] group-hover:text-[#32c0f4]/80 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-400">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((t) => (
                      <span key={t} className="px-3 py-1 text-sm bg-white/5 rounded-full text-gray-300">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="glass-card p-4 space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500">Architecture:</span>{' '}
                      <span className="text-gray-300">{project.architecture}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500">GCP Relevance:</span>{' '}
                      <span className="text-[#32c0f4]">{project.gcp}</span>
                    </p>
                  </div>

                  <div className="flex gap-4 pt-2">
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#32c0f4] hover:text-[#32c0f4]/80 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" /> Live Demo
                      </a>
                    )}
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Github className="w-5 h-5" /> Code
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-900/50 rounded-lg border border-white/10 aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">{project.title}</p>
                    {project.metrics && (
                      <div className="flex gap-4 justify-center text-sm">
                        {Object.entries(project.metrics).map(([key, value]) => (
                          <span key={key} className="text-[#32c0f4]">
                            {key}: {value}
                          </span>
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
        <h2 className="text-2xl font-semibold mt-16 mb-12">Other Projects</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {projects.filter(p => !p.featured).map((project) => (
            <div
              key={project.title}
              className="glass-card p-6 hover:border-[#32c0f4]/30 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{project.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.stack.slice(0, 3).map((t) => (
                  <span key={t} className="px-2 py-1 text-xs bg-white/5 rounded text-gray-400">
                    {t}
                  </span>
                ))}
              </div>
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#32c0f4] hover:text-[#32c0f4]/80 text-sm"
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
