import Link from 'next/link';
import { getAllPosts } from '@/lib/posts-data';

export default function Writing() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-2xl mx-auto px-6 py-20 md:py-32">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
          Writing
        </h1>

        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link href={`/writing/${post.slug}`} className="group">
                <p className="text-sm text-muted-foreground font-mono mb-1">
                  {post.date}
                </p>
                <h2 className="text-lg font-medium group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground mt-1">
                  {post.description}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
