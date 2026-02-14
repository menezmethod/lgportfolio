'use client';

import { Cloud, Database, Cpu, GitBranch, Box, Activity, Shield, Zap, Server, Code, Layout, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Architecture() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        
        {/* Header Section */}
        <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-wider mb-6">
            <Activity className="size-3.5" />
            <span>Live System Case Study</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
            Production-Grade <span className="text-primary">Cloud Architecture</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed whitespace-pre-wrap">
            This portfolio is more than a website—it's a demonstration of modern, scalable, and cost-efficient engineering. 
            Built with a "serverless-first" mindset on Google Cloud Platform.
          </p>
        </div>

        {/* Architecture Grid */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
            <Server className="text-primary size-8" />
            System Design
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Frontend/Edge */}
            <Card className="p-8 border-border/50 bg-card/30 backdrop-blur-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Layout className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Edge & Frontend</h3>
                  <p className="text-sm text-muted-foreground">Global Delivery Network</p>
                </div>
              </div>
              
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1 size-8 rounded-lg bg-background/50 border border-white/5 flex items-center justify-center shrink-0">
                    <Zap className="size-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Next.js 15 (App Router)</h4>
                    <p className="text-sm text-muted-foreground mt-1">Leveraging React Server Components for hydration-free interactivity and superior SEO.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 size-8 rounded-lg bg-background/50 border border-white/5 flex items-center justify-center shrink-0">
                    <Cloud className="size-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Cloud Run (SSR)</h4>
                    <p className="text-sm text-muted-foreground mt-1">Containerized serverless deployment auto-scales to zero, effectively eliminating idle costs.</p>
                  </div>
                </li>
              </ul>
            </Card>

            {/* Backend/AI */}
            <Card className="p-8 border-border/50 bg-card/30 backdrop-blur-sm relative overflow-hidden group hover:border-secondary/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-4 mb-8">
                <div className="size-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <Cpu className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl">AI & Backend</h3>
                  <p className="text-sm text-muted-foreground">Intelligent Processing</p>
                </div>
              </div>

              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1 size-8 rounded-lg bg-background/50 border border-white/5 flex items-center justify-center shrink-0">
                    <Activity className="size-4 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Gemini 1.5 Pro</h4>
                    <p className="text-sm text-muted-foreground mt-1">Advanced reasoning model integrated via streaming edge functions for real-time chat.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 size-8 rounded-lg bg-background/50 border border-white/5 flex items-center justify-center shrink-0">
                    <Database className="size-4 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Supabase (pgvector)</h4>
                    <p className="text-sm text-muted-foreground mt-1">PostgreSQL coupled with vector embeddings enables semantic search context injection (RAG).</p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* Cost Analysis - Reframed from "Free Tier" to "Efficiency" */}
        <section className="mb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 flex items-center gap-3">
             <Shield className="text-secondary size-8" />
             Economic Architecture
          </h2>
          <Card className="overflow-hidden border-border/50 bg-card/30 backdrop-blur-sm">
             <div className="p-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-muted/20">
                    <th className="p-4 md:p-6 font-medium text-muted-foreground">Infrastructure Component</th>
                    <th className="p-4 md:p-6 font-medium text-muted-foreground">Optimization Strategy</th>
                    <th className="p-4 md:p-6 font-medium text-muted-foreground min-w-[120px]">Monthly Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 md:p-6 font-medium">Google Cloud Run</td>
                    <td className="p-4 md:p-6 text-muted-foreground text-sm">Scale-to-zero configuration; pay only for active request milliseconds.</td>
                    <td className="p-4 md:p-6 text-primary font-mono font-medium">$0.10 - $2.00</td>
                  </tr>
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 md:p-6 font-medium">Vector Database</td>
                    <td className="p-4 md:p-6 text-muted-foreground text-sm">Managed PostgreSQL with compute separation.</td>
                    <td className="p-4 md:p-6 text-primary font-mono font-medium">$0.00 (Tier)</td>
                  </tr>
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 md:p-6 font-medium">LLM Inference</td>
                    <td className="p-4 md:p-6 text-muted-foreground text-sm">Google Gemini Flash optimized for high-throughput/low-cost reasoning.</td>
                    <td className="p-4 md:p-6 text-primary font-mono font-medium">$0.00 (Tier)</td>
                  </tr>
                </tbody>
                <tfoot className="bg-primary/5">
                    <tr>
                        <td colSpan={2} className="p-4 md:p-6 font-semibold text-right text-foreground">Total Operational Cost</td>
                        <td className="p-4 md:p-6 font-mono font-bold text-primary text-lg">~$2.00 / mo</td>
                    </tr>
                </tfoot>
              </table>
             </div>
          </Card>
        </section>

        {/* IaC Section */}
        <section className="mb-20">
           <div className="grid md:grid-cols-5 gap-8">
              <div className="md:col-span-2 space-y-4">
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <GitBranch className="text-primary size-8" />
                    Infrastructure as Code
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Zero manual provisioning. The entire stack is defined in Terraform and automated via GitHub Actions, ensuring reproducibility and drift detection.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                     {['Terraform', 'Docker', 'GCP Artifact Registry', 'GitHub Actions'].map(tag => (
                         <span key={tag} className="px-3 py-1 bg-secondary/10 text-secondary text-xs rounded-full border border-secondary/20">
                            {tag}
                         </span>
                     ))}
                  </div>
              </div>
              <div className="md:col-span-3">
                 <div className="rounded-xl border border-border/60 bg-[#050508] p-4 shadow-2xl overflow-hidden coding-block">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                        <div className="size-3 rounded-full bg-red-500/80" />
                        <div className="size-3 rounded-full bg-yellow-500/80" />
                        <div className="size-3 rounded-full bg-green-500/80" />
                        <span className="ml-2 text-xs text-muted-foreground font-mono">main.tf</span>
                    </div>
                    <pre className="text-xs sm:text-sm font-mono text-muted-foreground overflow-x-auto">
                        <code className="block">
{`resource "google_cloud_run_v2_service" "portfolio" {
  name     = "gimenez-portfolio"
  location = var.region
  
  template {
    containers {
      image = var.container_image
      resources {
        limits = {
          cpu    = "1000m"
          memory = "512Mi"
        }
      }
    }
  }
}`}
                        </code>
                    </pre>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA */}
        <div className="flex justify-center mt-12">
            <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary">
                <Link href="/contact">Discuss Architecture Opportunities</Link>
            </Button>
        </div>

      </div>
    </div>
  );
}
