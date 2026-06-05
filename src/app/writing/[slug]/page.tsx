import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const allPosts = [
  { slug:"2026-06-01-inferencia-router-deep-dive", title:"Inferencia: A Smart LLM Router in Go", description:"Building a Go-based LLM proxy.", date:"2026-06-01", tags:["Go","Infrastructure","Edge Computing"], content:"## The Problem\n\nI needed a single API endpoint that could front multiple AI backends.\n\n## The Architecture\n\nThe router is a Go binary that parses OpenAI-compatible API paths and routes to backends by capability tags.\n\nAdding a new backend is a registration, not a routing table change.\n" },
  { slug:"2026-06-04-watchdog-that-doesnt-bark", title:"The Watchdog That Doesn't Bark", description:"A self-healing monitor.", date:"2026-06-04", tags:["Infrastructure","Self-Healing","Edge Computing"], content:"## The Incident\n\nMy portfolio chat went down when Coolify recreated the container with a new IP.\n\n## The Architecture\n\nA Python watchdog checks 6 links in the health chain. If recovery succeeds, nobody hears about it.\n" },
  { slug:"2026-06-07-rate-limit-postmortem", title:"Rate Limit Postmortem", description:"How setting CHAT_MAX_RPM_PER_IP to 2 broke my chat.", date:"2026-06-07", tags:["Infrastructure","API Design"], content:"## The Setup\n\nThree-layer rate limiting: per-IP RPM, session cap, daily budget.\n\n## The Failure\n\nWith RPM=2, a follow-up within 30 seconds hits the limit.\n\n## The Fix\n\nData-driven from War Room analytics: 6 RPM, 30 msgs/session, 150 daily budget.\n" },
  { slug:"2026-06-10-file-based-rag-without-apology", title:"File-Based RAG Without Apology", description:"Why 200 lines beats pgvector.", date:"2026-06-10", tags:["Architecture","RAG","AI Infrastructure"], content:"## The Default Move\n\nScrape into a vector database. Add pgvector.\n\n## Why I Reverted\n\n200 lines of text. The model 128K context handles it trivially.\n\n## The Tradeoff\n\nIn-context RAG: zero infra. Vector DB: handles millions. Pick the right tool.\n" },
];

export const dynamic = "force-static";
export const dynamicParams = false;

const md: Partial<Components> = {
  code({ className, children, ...p }) { return className ? <pre className="overflow-x-auto rounded-xl border border-border/40 bg-black/40 p-4 text-sm"><code {...p}>{children}</code></pre> : <code className="text-primary bg-primary/10 px-1 py-0.5 rounded text-sm font-mono" {...p}>{children}</code>; },
  h2({ children, ...p }) { return <h2 className="text-xl font-semibold mt-10 mb-4" {...p}>{children}</h2>; },
  p({ children, ...p }) { return <p className="text-[15px] leading-relaxed text-foreground/85 mb-5" {...p}>{children}</p>; },
};

export default function Page({ params }: { params: { slug: string } }) {
  const post = allPosts.find(p => p.slug === params.slug);
  if (!post) notFound();
  return (
    <article className="mx-auto max-w-3xl px-4 pt-32 pb-24">
      <Link href="/writing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8"><ArrowLeft className="size-4" /> Back</Link>
      <header className="mb-10">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span><Calendar className="size-3.5 inline mr-1" />{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          {post.tags.map(t => <span key={t} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{t}</span>)}
        </div>
        <h1 className="text-3xl font-bold">{post.title}</h1>
      </header>
      <div className="prose prose-invert max-w-none"><ReactMarkdown components={md}>{post.content}</ReactMarkdown></div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = allPosts.find(p => p.slug === params.slug);
  if (!post) return { title: "Not Found" };
  return { title: post.title + " — Luis Gimenez", description: post.description };
}

export async function generateStaticParams() {
  return allPosts.map(p => ({ slug: p.slug }));
}
