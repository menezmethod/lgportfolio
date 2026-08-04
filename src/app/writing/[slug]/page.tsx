import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

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
    title: String(data.title || "Untitled"),
    description: String(data.description || ""),
    date: String(data.date || ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    content,
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 pt-20 pb-24">
      <Link
        href="/writing"
        className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        ← Back to Writing
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>{post.date}</span>
          {post.tags.length > 0 && (
            <span className="flex gap-2">
              {post.tags.map((t) => (
                <span key={t} className="font-mono text-xs bg-card border border-border px-2 py-0.5 rounded">
                  {t}
                </span>
              ))}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {post.title}
        </h1>
      </header>

      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <div className="mt-16 pt-8 border-t border-border">
        <Link
          href="/writing"
          className="inline-block text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          ← Back to Writing
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
