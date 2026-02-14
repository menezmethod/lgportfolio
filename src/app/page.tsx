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
    <div className="min-h-screen bg-black text-white pt-16 pb-20">
      {/* Hero Section */}
      <section className="min-h-[85vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <p className="text-[#32c0f4] font-mono text-lg mb-6">Hi, my name is</p>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Luis Gimenez.
          </h1>
          
          {/* Animated subtitle */}
          <div className="h-[60px] md:h-[72px] mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-400">
              I{' '}
              <span className="text-[#32c0f4] transition-all duration-500">
                {titles[currentTitle]}
              </span>
            </h2>
          </div>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            I build production-grade cloud architectures at enterprise scale. 
            Software Engineer II at The Home Depot building mission-critical payment 
            infrastructures using Go and Java on Google Cloud Platform.
          </p>

          {/* Cert badge */}
          <div className="flex justify-center mb-12">
            <span className="px-6 py-3 bg-[#32c0f4]/10 border border-[#32c0f4]/30 rounded-full text-[#32c0f4] text-sm font-mono">
              GCP Professional Cloud Architect ✅
            </span>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#32c0f4] text-black font-semibold rounded-lg hover:bg-[#32c0f4]/90 transition-colors text-lg shadow-lg shadow-[#32c0f4]/20"
              aria-label="Get in touch - open to opportunities"
            >
              Get in Touch <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-[#32c0f4] text-[#32c0f4] rounded-lg hover:bg-[#32c0f4]/10 transition-colors text-lg"
            >
              View Architecture
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#32c0f4]/10 text-[#32c0f4] rounded-lg hover:bg-[#32c0f4]/20 transition-colors text-lg"
            >
              <Sparkles className="w-5 h-5" />
              AI Chat
            </Link>
          </div>

          <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#32c0f4]/10 border border-[#32c0f4]/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32c0f4] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#32c0f4]" />
            </span>
            <p className="text-[#32c0f4] font-medium text-sm">
              Open to opportunities • The Home Depot
            </p>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <div className="fixed left-4 bottom-0 hidden md:flex flex-col gap-6">
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
            className="text-gray-400 hover:text-[#32c0f4] transition-colors"
            aria-label={social.label}
          >
            <social.icon className="w-5 h-5" />
          </a>
        ))}
      </div>
    </div>
  );
}
