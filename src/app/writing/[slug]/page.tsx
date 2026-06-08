import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

export const dynamic = "force-static";
export const dynamicParams = false;

interface PostData {
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
}

function getPost(slug: string): PostData | null {
  const filePath = path.join(process.cwd(), "src/content/posts", `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    title: data.title || "Untitled",
    description: data.description || "",
    date: data.date || "",
    tags: data.tags || [],
    content,
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-6 lg:px-8">
      <Link
        href="/writing"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="size-4" />
        Back to Writing
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {post.tags.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Tag className="size-3.5" />
              <span className="flex gap-1.5">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded"
                  >
                    {t}
                  </span>
                ))}
              </span>
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
      </header>

      <div className="prose prose-invert max-w-none prose-pre:border-border/40 prose-pre:bg-black/40 prose-code:text-primary prose-a:text-primary hover:prose-a:underline prose-table:text-sm">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code({ className, children, ...props }) {
              const isInline = !className;
              return isInline ? (
                <code className="text-primary bg-primary/10 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="overflow-x-auto rounded-xl border border-border/40 bg-black/40 p-4 text-sm">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
            h2({ children, ...props }) {
              return (
                <h2 className="text-xl font-semibold mt-10 mb-4 scroll-mt-24" {...props}>
                  {children}
                </h2>
              );
            },
            h3({ children, ...props }) {
              return (
                <h3 className="text-lg font-semibold mt-8 mb-3 scroll-mt-24" {...props}>
                  {children}
                </h3>
              );
            },
            p({ children, ...props }) {
              return (
                <p className="text-[15px] leading-relaxed text-foreground/85 mb-5" {...props}>
                  {children}
                </p>
              );
            },
            ul({ children, ...props }) {
              return <ul className="list-disc pl-6 mb-5 space-y-2 text-[15px] text-foreground/85" {...props}>{children}</ul>;
            },
            ol({ children, ...props }) {
              return <ol className="list-decimal pl-6 mb-5 space-y-2 text-[15px] text-foreground/85" {...props}>{children}</ol>;
            },
            blockquote({ children, ...props }) {
              return (
                <blockquote className="border-l-2 border-primary/30 pl-4 italic text-muted-foreground my-6" {...props}>
                  {children}
                </blockquote>
              );
            },
            a({ children, href, ...props }) {
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" {...props}>
                  {children}
                </a>
              );
            },
            table({ children, ...props }) {
              return (
                <div className="overflow-x-auto my-6 rounded-xl border border-border/40">
                  <table className="w-full text-sm border-collapse" {...props}>
                    {children}
                  </table>
                </div>
              );
            },
            th({ children, ...props }) {
              return (
                <th className="px-4 py-3 text-left font-semibold bg-muted/30 text-foreground border-b border-border/40" {...props}>
                  {children}
                </th>
              );
            },
            td({ children, ...props }) {
              return (
                <td className="px-4 py-3 border-b border-border/20 text-foreground/85" {...props}>
                  {children}
                </td>
              );
            },
            img({ src, alt, ...props }) {
              return (
                <img
                  src={src}
                  alt={alt || ""}
                  className="rounded-xl border border-border/40 my-6 max-w-full"
                  loading="lazy"
                  {...props}
                />
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <div className="mt-16 pt-8 border-t border-border/40">
        <Link
          href="/writing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Writing
        </Link>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: `${post.title} — Luis Gimenez`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), "src/content/posts");
  if (!fs.existsSync(postsDir)) return [];

  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => ({
      slug: file.replace(/\.md$/, ""),
    }));
}
