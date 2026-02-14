'use client';

import { ArrowRight, Github, Linkedin, Twitter, Mail, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const titles = [
  'GCP Cloud Architect',
  'AI Systems Engineer',
  'Payment Systems Expert',
];

export default function Home() {
  const [currentTitle, setCurrentTitle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTitle((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pt-16 pb-20">
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center justify-center px-4 md:px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-6 md:space-y-8 animate-fadeIn">
          <p className="text-base md:text-lg text-primary font-mono mb-4 tracking-wide">Hi, my name is</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Luis Gimenez.
          </h1>
          
          {/* Animated subtitle */}
          <div className="h-[50px] md:h-[60px] lg:h-[72px] mb-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-muted-foreground">
              I{' '}
              <span className="text-primary transition-all duration-500">
                {titles[currentTitle]}
              </span>
            </h2>
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed px-4 text-balance-header">
            I build production-grade cloud architectures at enterprise scale. 
            Software Engineer II at The Home Depot building mission-critical payment 
            infrastructures using Go and Java on Google Cloud Platform.
          </p>

          {/* Cert badge */}
          <div className="flex justify-center mb-12">
            <span className="px-6 py-3 bg-primary/10 border border-primary/30 rounded-full text-primary text-sm font-mono tracking-wide shadow-glow-primary">
              GCP Professional Cloud Architect ✅
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all text-lg shadow-lg shadow-primary/20 hover:scale-105 duration-200"
              aria-label="Get in touch - open to opportunities"
            >
              Get in Touch <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-8 py-4 border border-primary/50 text-primary rounded-xl hover:bg-primary/10 transition-all text-lg hover:border-primary"
            >
              View Architecture
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 bg-muted/30 text-foreground border border-white/5 rounded-xl hover:bg-muted/50 transition-all text-lg backdrop-blur-sm"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              AI Chat
            </Link>
          </div>

          <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            <p className="text-secondary font-medium text-sm">
              Open to opportunities • The Home Depot
            </p>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <div className="fixed left-6 bottom-0 hidden lg:flex flex-col gap-6 z-50">
        {[
          { href: 'https://github.com/menezmethod', icon: Github, label: 'GitHub' },
          { href: 'https://twitter.com/menezmethod', icon: Twitter, label: 'Twitter' },
          { href: 'https://www.linkedin.com/in/gimenezdev/', icon: Linkedin, label: 'LinkedIn' },
          { href: 'mailto:luisgimenezdev@gmail.com', icon: Mail, label: 'Email' },
        ].map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-all hover:-translate-y-1"
            aria-label={social.label}
          >
            <social.icon className="w-6 h-6" />
          </a>
        ))}
        <div className="w-px h-24 bg-border mx-auto mt-2"></div>
      </div>
    </div>
  );
}
