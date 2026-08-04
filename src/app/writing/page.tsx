import fs from 'fs';
import path from 'path';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
}

function getPosts(): Post[] {
  const postsDir = path.join(process.cwd(), 'src/content/posts');
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

  return files.map(file => {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    const dateMatch = content.match(/^date:\s*(.+)$/m);
    const summaryMatch = content.match(/^summary:\s*(.+)$/m);

    return {
      slug: file.replace('.md', ''),
      title: titleMatch?.[1] || file,
      date: String(dateMatch?.[1] || ''),
      summary: String(summaryMatch?.[1] || ''),
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function Writing() {
  const posts = getPosts();

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
                  {post.summary}
                </p>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
