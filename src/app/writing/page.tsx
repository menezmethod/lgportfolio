import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { Calendar, Tag } from "lucide-react";

interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

function getPosts(): PostMeta[] {
  const postsDir = path.join(process.cwd(), "src/content/posts");
  if (!fs.existsSync(postsDir)) return [];

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const now = new Date();

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || "",
        tags: data.tags || [],
      };
    })
    .filter((post) => post.date && new Date(post.date) <= now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function WritingPage() {
  const posts = getPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Writing</h1>
      <p className="text-muted-foreground mb-12 text-lg">
        Architecture notes, production incidents, and engineering decisions from real projects.
      </p>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {posts.map((post) => (
            <article key={post.slug} className="group">
              <Link href={`/writing/${post.slug}`} className="block">
                <div className="border border-border/40 rounded-xl p-6 hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-200">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
                  <h2 className="text-xl font-semibold group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {post.description}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
