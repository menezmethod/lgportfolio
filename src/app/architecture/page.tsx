'use client';

import { Cloud, Database, Cpu, GitBranch, Box, Activity, Shield, Zap } from 'lucide-react';

export default function Architecture() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-[#32c0f4] font-mono">[0]</span> Architecture
        </h1>
        <p className="text-xl text-gray-400 mb-12">
          This portfolio itself is a case study in cloud architecture.
        </p>

        {/* Architecture Overview */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">System Architecture</h2>
          
          {/* Main Architecture Diagram */}
          <div className="glass-card p-8 mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - User Facing */}
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#32c0f4]/20 flex items-center justify-center">
                    <Box className="w-6 h-6 text-[#32c0f4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">User</h3>
                    <p className="text-sm text-gray-400">Browser / Mobile</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#32c0f4]/20 flex items-center justify-center">
                    <Cloud className="w-6 h-6 text-[#32c0f4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cloud Run</h3>
                    <p className="text-sm text-gray-400">Next.js 15 SSR</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#32c0f4]/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-[#32c0f4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Gemini API</h3>
                    <p className="text-sm text-gray-400">AI Chat (free tier)</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Backend */}
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#e97124]/20 flex items-center justify-center">
                    <Database className="w-6 h-6 text-[#e97124]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Supabase</h3>
                    <p className="text-sm text-gray-400">pgvector RAG</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#e97124]/20 flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-[#e97124]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Vertex AI</h3>
                    <p className="text-sm text-gray-400">Embeddings</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#e97124]/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[#e97124]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Secret Manager</h3>
                    <p className="text-sm text-gray-400">API Keys</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RAG Pipeline */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">RAG Pipeline</h2>
          <div className="glass-card p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {[
                { icon: Box, label: 'User Query', color: 'cyan' },
                { icon: Cpu, label: 'Embedding', color: 'cyan' },
                { icon: Database, label: 'Vector Search', color: 'orange' },
                { icon: Activity, label: 'Gemini', color: 'cyan' },
                { icon: Zap, label: 'Response', color: 'green' },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg bg-${step.color === 'cyan' ? '[#32c0f4]/20' : '[#e97124]/20'} flex items-center justify-center`}>
                    <step.icon className={`w-5 h-5 ${step.color === 'cyan' ? 'text-[#32c0f4]' : 'text-[#e97124]'}`} />
                  </div>
                  <span className="text-sm text-gray-400">{step.label}</span>
                  {idx < 4 && <span className="text-gray-600">→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cost Breakdown */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Cost Optimization</h2>
          <div className="overflow-x-auto">
            <table className="w-full glass-card">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-gray-400">Service</th>
                  <th className="text-left p-4 text-gray-400">Cost</th>
                  <th className="text-left p-4 text-gray-400">Optimization</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { service: 'Cloud Run', cost: '$0-5/mo', opt: 'Scale to 0, pay per request' },
                  { service: 'Supabase', cost: '$0', opt: 'Free tier pgvector' },
                  { service: 'Gemini API', cost: '$0-3/mo', opt: 'Free tier, rate limiting, caching' },
                  { service: 'Cloud CDN', cost: '$0-2/mo', opt: 'Static asset caching' },
                  { service: 'Secret Manager', cost: '<$1/mo', opt: 'Minimal secrets' },
                ].map((row) => (
                  <tr key={row.service} className="border-b border-white/5">
                    <td className="p-4">{row.service}</td>
                    <td className="p-4 text-[#32c0f4]">{row.cost}</td>
                    <td className="p-4 text-gray-400">{row.opt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            Total estimated cost: <span className="text-[#32c0f4]">$1-11/month</span>
          </p>
        </section>

        {/* Terraform Module */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Infrastructure as Code</h2>
          <div className="glass-card p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-[#32c0f4]/20 flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-[#32c0f4]" />
              </div>
              <div>
                <h3 className="font-semibold">Terraform Modules</h3>
                <p className="text-sm text-gray-400">GCP Cloud Run deployment</p>
              </div>
            </div>
            <div className="bg-black rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
              <pre>{`resource "google_cloud_run_v2_service" "portfolio" {
  name     = "gimenez-portfolio"
  location = var.region
  
  template {
    containers {
      image = var.container_image
      ports { container_port = 3000 }
      env {
        name  = "GOOGLE_API_KEY"
        value = var.gemini_api_key
      }
    }
    scaling { min_instance_count = 0 }
  }
}`}</pre>
            </div>
          </div>
        </section>

        {/* CI/CD Pipeline */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">CI/CD Pipeline</h2>
          <div className="glass-card p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {[
                { label: 'Git Push', icon: GitBranch },
                { label: 'Lint & Build', icon: Activity },
                { label: 'Docker Build', icon: Box },
                { label: 'Cloud Build', icon: Cloud },
                { label: 'Deploy', icon: Zap },
              ].map((step, idx) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-400">{step.label}</span>
                  {idx < 4 && <span className="text-gray-600">→</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* This page is the case study */}
        <section className="p-8 bg-gradient-to-r from-[#32c0f4]/10 to-[#e97124]/10 rounded-xl border border-[#32c0f4]/20">
          <h2 className="text-2xl font-semibold mb-4">This Page is the Case Study</h2>
          <p className="text-gray-400 mb-4">
            Every technology choice in this portfolio demonstrates production-grade architecture decisions:
          </p>
          <ul className="space-y-2 text-gray-300">
            <li>• <strong>Next.js 15</strong> — Server-side rendering, API routes, React Server Components</li>
            <li>• <strong>Gemini API</strong> — Free tier AI with rate limiting and caching strategy</li>
            <li>• <strong>Supabase pgvector</strong> — Free vector database for RAG pipeline</li>
            <li>• <strong>Cloud Run</strong> — Serverless containers, auto-scaling, pay-per-use</li>
            <li>• <strong>Terraform</strong> — Infrastructure as Code, reproducible deployments</li>
            <li>• <strong>GitHub Actions</strong> — Automated CI/CD to GCP</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
