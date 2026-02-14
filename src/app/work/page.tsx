'use client';

import { ExternalLink, Github } from 'lucide-react';

const projects = [
  {
    title: 'Churnistic',
    description: 'AI-powered customer churn prediction platform with real-time analytics.',
    tech: ['TypeScript', 'React', 'Python', 'TensorFlow', 'FastAPI'],
    github: 'https://github.com/menezmethod/churnistic',
    live: 'https://churnistic.com',
    featured: true,
  },
  {
    title: 'VAULT',
    description: 'Privacy-first iMessage automation system with tiered access control.',
    tech: ['Python', 'AppleScript', 'GPT-4', 'Security'],
    github: 'https://github.com/menezmethod/vault',
    featured: true,
  },
  {
    title: 'Parrish Local',
    description: 'Local business directory for the Parrish, FL community.',
    tech: ['Next.js', 'Supabase', 'Tailwind'],
    github: 'https://github.com/menezmethod/parrish-local',
    live: 'https://parrishlocal.com',
    featured: true,
  },
  {
    title: 'BuilderPlug',
    description: 'SaaS platform for real estate professionals.',
    tech: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    github: 'https://github.com/menezmethod/builderplug',
    featured: false,
  },
  {
    title: 'Payment Gateway Integration',
    description: 'Enterprise payment processing system handling millions in daily transactions.',
    tech: ['Go', 'Java', 'GCP', 'Kubernetes'],
    github: '',
    featured: false,
  },
];

export default function Work() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">
          <span className="text-cyan-400 font-mono">[1]</span> My Work
        </h1>

        {/* Featured Projects */}
        <div className="space-y-12">
          {projects.filter(p => p.featured).map((project, idx) => (
            <div key={project.title} className="group relative grid md:grid-cols-2 gap-6 items-center">
              <div className={`${idx % 2 === 1 ? 'md:order-2' : ''} space-y-4`}>
                <h3 className="text-2xl font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-400">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <span key={t} className="px-3 py-1 text-sm bg-white/5 rounded-full text-gray-300">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 pt-2">
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
                  {project.live && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" /> Live
                    </a>
                  )}
                </div>
              </div>
              <div className={`${idx % 2 === 1 ? 'md:order-1' : ''} bg-gray-900/50 rounded-lg border border-white/10 aspect-video flex items-center justify-center`}>
                <span className="text-gray-500">{project.title} Preview</span>
              </div>
            </div>
          ))}
        </div>

        {/* Other Projects */}
        <h2 className="text-2xl font-semibold mt-16 mb-8">Other Projects</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.filter(p => !p.featured).map((project) => (
            <div
              key={project.title}
              className="p-6 bg-gray-900/30 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">{project.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.slice(0, 3).map((t) => (
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
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm"
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
