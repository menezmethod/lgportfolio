import ReactMarkdown from "react-markdown";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Components } from "react-markdown";
import { getPostBySlug, getPostSlugs } from "@/lib/posts-data";

const markdownComponents: Partial<Components> = {
  code({ className, children, ...props }) {
    return className
      ? <pre className="overflow-x-auto rounded-xl border border-border/40 bg-black/40 p-4 text-sm"><code {...props}>{children}</code></pre>
      : <code className="text-primary bg-primary/10 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
  },
  h2({ children, ...props }) { return <h2 className="text-xl font-semibold mt-10 mb-4" {...props}>{children}</h2>; },
  p({ children, ...props }) { return <p className="text-[15px] leading-relaxed text-foreground/85 mb-5" {...props}>{children}</p>; },
};

export default function Page({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
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
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown components={markdownComponents}>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: "Not Found" };
  return { title: post.title + " — Luis Gimenez", description: post.description };
}

export async function generateStaticParams() {
  return getPostSlugs().map(slug => ({ slug }));
}
