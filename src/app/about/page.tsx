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
    <div className="min-h-screen bg-black text-white pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">
          <span className="text-[#32c0f4] font-mono">[0]</span> About Me
        </h1>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-6 text-gray-300">
            <p>
              I am a results-driven Software Engineer II at <span className="text-[#32c0f4]">The Home Depot</span>, 
              where I architect and maintain mission-critical payment processing infrastructures handling 
              <span className="text-[#32c0f4]"> millions in daily transactions</span>.
            </p>
            <p>
              My role focuses on both modernizing legacy payment systems and building new payment solutions 
              using primarily <strong>Go</strong> and <strong>Java</strong> on <strong>Google Cloud Platform</strong>.
            </p>
            
            <h2 className="text-xl font-semibold text-white mt-8 mb-4">Professional Work</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#32c0f4]">▹</span>
                Leading payment system modernization initiatives using Go and Java
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#32c0f4]">▹</span>
                Architecting scalable solutions on GCP (Professional Cloud Architect certified)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#32c0f4]">▹</span>
                Maintaining and enhancing legacy payment processing systems
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#32c0f4]">▹</span>
                Working with enterprise-scale transaction volumes and compliance requirements
              </li>
            </ul>

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
              <div className="space-y-6">
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
