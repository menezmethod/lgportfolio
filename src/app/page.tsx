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
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#32c0f4] font-mono mb-4">Hi, my name is</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Luis Gimenez.
          </h1>
          
          {/* Animated subtitle */}
          <div className="h-[60px] md:h-[72px] mb-6">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-400">
              I{' '}
              <span className="text-[#32c0f4] transition-all duration-500">
                {titles[currentTitle]}
              </span>
            </h2>
          </div>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            I build production-grade cloud architectures at enterprise scale. 
            Software Engineer II at The Home Depot building mission-critical payment 
            infrastructures using Go and Java on Google Cloud Platform.
          </p>

          {/* Cert badge */}
          <div className="flex justify-center mb-8">
            <span className="px-4 py-2 bg-[#32c0f4]/10 border border-[#32c0f4]/30 rounded-full text-[#32c0f4] text-sm font-mono">
              GCP Professional Cloud Architect ✅
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/architecture"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#32c0f4] text-[#32c0f4] rounded-lg hover:bg-[#32c0f4]/10 transition-colors"
            >
              Explore Architecture <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#32c0f4]/10 text-[#32c0f4] rounded-lg hover:bg-[#32c0f4]/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Chat with AI
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              More about me
            </Link>
          </div>

          <p className="text-gray-500 mt-8">
            Currently at The Home Depot • Open to Opportunities
          </p>
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
