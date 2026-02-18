'use client';

import { Mail, Github, Linkedin, Twitter, Sparkles, FileText, Download } from 'lucide-react';

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
        <h1 className="text-3xl md:text-5xl font-bold mb-10 md:mb-16 animate-fadeIn">
          <span className="text-primary font-mono">[2]</span> Get In Touch
        </h1>

        <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
          I am selectively accepting interviews for <span className="text-foreground font-semibold">Staff Engineer</span> or <span className="text-foreground font-semibold">Architect</span> roles. Whether you have a question or just want to say hi, I'll try my best to get back to you!
        </p>

        {/* Resume Download CTA */}
        <div className="mb-12 p-8 bg-muted/20 rounded-xl border border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Resume / CV
              </h2>
              <p className="text-muted-foreground">
                Get the full details on my experience, including architectural diagrams and deep-dive case studies.
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

        <div className="space-y-6">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-6 p-6 bg-card/40 rounded-xl border border-border/50 hover:border-primary/50 transition-all group hover:bg-card/60 hover:-translate-y-1"
            >
              <div className="p-3 bg-background rounded-lg border border-white/5 group-hover:border-primary/20 group-hover:text-primary transition-colors text-muted-foreground">
                <link.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">{link.label}</p>
                <p className="text-foreground text-lg group-hover:text-primary transition-colors">{link.text}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-transparent rounded-xl border border-primary/10 text-center">
          <h2 className="text-xl font-semibold mb-4">Have questions about specific architectures?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            You can chat with my AI assistant to get instant answers about my background, technical decisions, and project details.
          </p>
          <a
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 bg-background border border-primary/30 text-primary rounded-lg hover:bg-primary/5 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Chat with RAG Agent
          </a>
        </div>
      </div>
    </div>
  );
}
