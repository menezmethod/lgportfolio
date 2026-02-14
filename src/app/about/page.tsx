'use client';

import { Code2, Cloud, Database, Cpu } from 'lucide-react';

const skills = {
  languages: ['Go', 'Java', 'TypeScript', 'Rust', 'Python'],
  cloud: ['Cloud Run', 'GKE', 'BigQuery', 'Pub/Sub', 'Cloud CDN'],
  frameworks: ['React', 'Next.js', 'Node.js', 'Spring Boot'],
  tools: ['Docker', 'Kubernetes', 'Terraform', 'Git', 'CI/CD'],
  domains: ['Payment Systems', 'Microservices', 'System Architecture', 'AI/ML'],
};

export default function About() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">
          <span className="text-[#32c0f4] font-mono">[0]</span> About Me
        </h1>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-10 text-gray-300">
            <p>
              I am a results-driven Software Engineer II at <span className="text-[#32c0f4]">The Home Depot</span>, 
              where I architect and maintain mission-critical payment processing infrastructures handling 
              <span className="text-[#32c0f4]"> billions in annual transactions</span>.
            </p>
            <p>
              My role focuses on both modernizing legacy payment systems and building new payment solutions 
              using primarily <strong>Go</strong> and <strong>Java</strong> on <strong>Google Cloud Platform</strong>.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">Impact at Home Depot</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-[#32c0f4] mt-1">▹</span>
                <div>
                  <span className="text-white font-medium">Payment Platform Reliability</span>
                  <p className="text-gray-400 text-sm">Maintained 99.99% uptime for payment services processing 20M+ daily transactions</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#32c0f4] mt-1">▹</span>
                <div>
                  <span className="text-white font-medium">Legacy Modernization</span>
                  <p className="text-gray-400 text-sm">Led migration of core payment services to cloud-native architecture, reducing latency by 40%</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#32c0f4] mt-1">▹</span>
                <div>
                  <span className="text-white font-medium">PCI-DSS Compliance</span>
                  <p className="text-gray-400 text-sm">Architected compliant payment workflows meeting strict security standards</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#32c0f4] mt-1">▹</span>
                <div>
                  <span className="text-white font-medium">Developer Velocity</span>
                  <p className="text-gray-400 text-sm">Built internal tooling reducing deployment time from hours to minutes</p>
                </div>
              </li>
            </ul>
            
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">Beyond Code</h2>
            <p className="text-gray-300">
              When I'm not building payment systems, I'm exploring new technologies and contributing to open source. 
              I'm also preparing for the arrival of my first child — learning that <span className="text-[#32c0f4]">patience and iteration</span> are just as important in parenting as they are in software.
            </p>

            <h2 className="text-xl font-semibold text-white mt-8 mb-4">Personal Projects</h2>
            <p>
              In my personal time, I explore cutting-edge technologies and build innovative solutions. 
              My latest project, <span className="text-[#32c0f4]">Churnistic</span>, demonstrates my passion 
              for TypeScript, AI/ML integration, and modern web technologies. I also experiment with 
              systems programming in Rust and explore emerging tech trends to stay ahead of the curve.
            </p>
          </div>

          <div className="md:col-span-1">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Core Technologies</h3>
              <div className="space-y-10">
                {Object.entries(skills).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-sm font-mono text-[#32c0f4] mb-2 capitalize">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {items.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-1 text-xs bg-white/5 rounded text-gray-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
