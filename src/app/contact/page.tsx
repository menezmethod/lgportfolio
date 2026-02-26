'use client';

import { Mail, Github, Linkedin, Twitter, Terminal, FileText, Download } from 'lucide-react';

const socialLinks = [
  { href: 'mailto:luisgimenezdev@gmail.com', icon: Mail, label: 'Email', text: 'luisgimenezdev@gmail.com' },
  { href: 'https://github.com/menezmethod', icon: Github, label: 'GitHub', text: '@menezmethod' },
  { href: 'https://www.linkedin.com/in/gimenezdev/', icon: Linkedin, label: 'LinkedIn', text: 'linkedin.com/in/gimenezdev' },
  { href: 'https://twitter.com/menezmethod', icon: Twitter, label: 'Twitter', text: '@menezmethod' },
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 px-6 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-emerald-400 font-mono text-sm">$</span>
          <span className="font-mono text-sm text-muted-foreground">cat contact.md</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 animate-fadeIn">
          Get In <span className="text-primary">Touch</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
          Selectively accepting interviews for{' '}
          <span className="text-foreground font-semibold">Senior</span>,{' '}
          <span className="text-foreground font-semibold">Staff</span>, and{' '}
          <span className="text-foreground font-semibold">Architect</span> roles.
          If you have a hard distributed systems problem or need someone to
          stabilize your observability stack, let&apos;s talk.
        </p>

        <div className="mb-12 p-8 bg-card/30 rounded-xl border border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Resume / CV
              </h2>
              <p className="text-muted-foreground">
                Full experience details, architectural case studies, and certifications.
              </p>
            </div>
            <a
              href="https://docs.google.com/document/d/1YkK8dF8N7M9xX5qZ2vT1uO8r6pS4cE9gH0iL3mN2Q4/export?format=pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105 whitespace-nowrap"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </a>
          </div>
        </div>

        <div className="space-y-4">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-6 p-5 bg-card/30 rounded-lg border border-border/50 hover:border-primary/30 transition-all group hover:-translate-y-0.5"
            >
              <div className="p-3 bg-background rounded-lg border border-border/50 group-hover:border-primary/20 group-hover:text-primary transition-colors text-muted-foreground">
                <link.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">{link.label}</p>
                <p className="text-foreground text-lg group-hover:text-primary transition-colors">{link.text}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-16 p-8 bg-card/30 rounded-xl border border-border/50 text-center">
          <h2 className="text-xl font-semibold mb-4">Want specifics on my architecture decisions?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            My AI assistant can answer technical questions about my background, system design
            approach, and project details. It runs on a self-hosted LLM with RAG retrieval.
          </p>
          <a
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 bg-background border border-primary/30 text-primary rounded-lg hover:bg-primary/5 transition-colors font-mono text-sm"
          >
            <Terminal className="w-4 h-4" />
            ./chat --ask
          </a>
        </div>
      </div>
    </div>
  );
}
