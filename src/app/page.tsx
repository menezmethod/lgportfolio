'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

const titles = [
  'GCP Cloud Architect',
  'Distributed Systems Engineer',
  'AI Systems Engineer',
  'New Dad 🍼', // Persuasion Patch: Humanizing
];

import { Suspense } from 'react';

function PortfolioContent() {
  const searchParams = useSearchParams();
  const isRecruiter = searchParams.get('ref') === 'recruiter';
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
              <span className="text-primary transition-all duration-500">
                {titles[currentTitle]}
              </span>
            </h2>
          </div>

          {/* Data Patch: Contextual Personalization */}
          {isRecruiter ? (
             <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed px-4 text-balance-header border-l-4 border-primary/50 pl-6 bg-primary/5 py-4 rounded-r-lg">
               <strong className="text-foreground">Available for Senior, Staff & Architect Roles.</strong> I combine distributed systems expertise with business impact—scaling payments at Home Depot to <strong className="text-foreground">5M+ daily transactions</strong>. Ready to lead technical direction and mentor teams.
             </p>
          ) : (
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed px-4 text-balance-header">
              Distributed Systems Architect & AI Engineer. I design and build mission-critical payment architectures at <strong className="text-foreground">The Home Depot</strong>, processing <strong className="text-foreground">5M+ daily transactions</strong> with 99.99% availability. Specializing in high-throughput Go microservices and enterprise Google Cloud Platform solutions.
            </p>
          )}

          {/* Behavioral Patch: Authority Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 py-8 border-y border-white/5 my-8">
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">5M+</div>
              <div className="text-xs md:text-sm text-muted-foreground font-mono mt-1">Daily Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">$Billions</div>
              <div className="text-xs md:text-sm text-muted-foreground font-mono mt-1">Processed Annually</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">99.99%</div>
              <div className="text-xs md:text-sm text-muted-foreground font-mono mt-1">Uptime Record</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-4xl font-bold text-foreground">~50ms</div>
              <div className="text-xs md:text-sm text-muted-foreground font-mono mt-1">p99 Latency</div>
            </div>
          </div>

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
              AI Chat (RAG Agent)
            </Link>
          </div>

          <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            <p className="text-secondary font-medium text-sm">
              Accepting Interviews • Senior, Staff & Architect Roles
            </p>
          </div>
        </div>
      </section>

      {/* Behavioral Patch: AI/Voice Optimization (Schema.org) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Luis Gimenez',
            jobTitle: 'Senior Distributed Systems Engineer',
            url: 'https://gimenez.dev',
            sameAs: [
              'https://github.com/menezmethod',
              'https://linkedin.com/in/gimenezdev',
              'https://twitter.com/menezmethod'
            ],
            alumniOf: 'The Home Depot',
            knowsAbout: ['Go', 'Distributed Systems', 'GCP', 'Payment Architecture', 'AI Engineering']
          })
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-primary">Loading...</div>}>
      <PortfolioContent />
    </Suspense>
  );
}
