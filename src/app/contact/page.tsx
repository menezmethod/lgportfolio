'use client';

import { Mail, Github, Linkedin, Twitter, Sparkles } from 'lucide-react';

const socialLinks = [
  { href: 'mailto:luisgimenezdev@gmail.com', icon: Mail, label: 'Email', text: 'luisgimenezdev@gmail.com' },
  { href: 'https://github.com/menezmethod', icon: Github, label: 'GitHub', text: '@menezmethod' },
  { href: 'https://www.linkedin.com/in/gimenezdev/', icon: Linkedin, label: 'LinkedIn', text: 'linkedin.com/in/gimenezdev' },
  { href: 'https://twitter.com/menezmethod', icon: Twitter, label: 'Twitter', text: '@menezmethod' },
];

export default function Contact() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">
          <span className="text-[#32c0f4] font-mono">[2]</span> Get In Touch
        </h1>

        <p className="text-lg text-gray-400 mb-12">
          I am currently open to new opportunities. Whether you have a question or just want to say hi, 
          I will try my best to get back to you!
        </p>

        <div className="space-y-6">
          {socialLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-gray-900/30 rounded-lg border border-white/5 hover:border-[#32c0f4]/30 transition-colors group"
            >
              <link.icon className="w-6 h-6 text-gray-400 group-hover:text-[#32c0f4] transition-colors" />
              <div>
                <p className="text-sm text-gray-500">{link.label}</p>
                <p className="text-white group-hover:text-[#32c0f4] transition-colors">{link.text}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-900/30 rounded-lg border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Or use the AI Chat</h2>
          <p className="text-gray-400 mb-4">
            Want to learn more about my work? Try the AI-powered chat that knows my entire portfolio!
          </p>
          <a
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#32c0f4]/20 text-[#32c0f4] rounded-lg hover:bg-[#32c0f4]/30 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Start a Conversation
          </a>
        </div>
      </div>
    </div>
  );
}
