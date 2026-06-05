import Link from "next/link";
import { Calendar } from "lucide-react";
import { getAllPosts } from "@/lib/posts-data";

export default function WritingPage() {
  const posts = getAllPosts();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-24">
      <h1 className="text-4xl font-bold mb-2">Writing</h1>
      <p className="text-muted-foreground mb-12 text-lg">Architecture notes and engineering decisions from real projects.</p>
      <div className="flex flex-col gap-8">
        {posts.map(post => (
          <article key={post.slug} className="group">
            <Link href={"/writing/" + post.slug} className="block border border-border/40 rounded-xl p-6 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5"><Calendar className="size-3.5" />{new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                {post.tags.map(t => <span key={t} className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{t}</span>)}
              </div>
              <h2 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">{post.title}</h2>
              <p className="text-muted-foreground">{post.description}</p>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
