'use client';

import { ArrowRight, Github, Linkedin, Twitter, Mail } from 'lucide-react';
import Link from 'next/link';

const socialLinks = [
  { href: 'https://github.com/menezmethod', icon: Github, label: 'GitHub' },
  { href: 'https://twitter.com/menezmethod', icon: Twitter, label: 'Twitter' },
  { href: 'https://www.linkedin.com/in/gimenezdev/', icon: Linkedin, label: 'LinkedIn' },
  { href: 'mailto:luisgimenezdev@gmail.com', icon: Mail, label: 'Email' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white pt-16">
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-400 font-mono mb-4">Hi, my name is</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Luis Gimenez.
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-400 mb-6">
            I architect <span className="text-cyan-400">enterprise payment systems</span> that process millions daily.
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Software Engineer II at The Home Depot building mission-critical payment infrastructures 
            using Go and Java on Google Cloud Platform. GCP Professional Architect certified, 
            specializing in both legacy system modernization and new payment solutions at enterprise scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 px-6 py-3 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-colors"
            >
              View my work <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white transition-colors"
            >
              More about me
            </Link>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <div className="fixed left-4 bottom-0 hidden md:flex flex-col gap-6">
        {socialLinks.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-cyan-400 transition-colors"
            aria-label={social.label}
          >
            <social.icon className="w-5 h-5" />
          </a>
        ))}
      </div>
    </div>
  );
}
