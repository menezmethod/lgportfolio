import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface PostData {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
}

const POSTS_DIR = path.join(process.cwd(), "src/content/posts");

let cachedPosts: PostData[] | null = null;

export function getAllPosts(): PostData[] {
  if (cachedPosts) return cachedPosts;
  if (!fs.existsSync(POSTS_DIR)) return [];
  
  cachedPosts = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug: f.replace(/\.md$/, ""),
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || "",
        tags: (data.tags || []) as string[],
        content,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return cachedPosts;
}

export function getPostBySlug(slug: string): PostData | undefined {
  return getAllPosts().find(p => p.slug === slug);
}

export function getPostSlugs(): string[] {
  return getAllPosts().map(p => p.slug);
}
