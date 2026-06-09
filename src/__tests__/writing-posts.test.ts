import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { getPostBySlug } from "@/lib/posts-data";

const POST_PAGE = path.join(process.cwd(), "src/app/writing/[slug]/page.tsx");

describe("writing posts", () => {
  it("passes post content to ReactMarkdown", () => {
    const source = fs.readFileSync(POST_PAGE, "utf-8");
    expect(source).toMatch(/<ReactMarkdown[\s\S]*?\{post\.content\}[\s\S]*?<\/ReactMarkdown>/);
  });

  it("loads non-empty markdown body for published posts", () => {
    const post = getPostBySlug("2026-06-01-inferencia-router-deep-dive");
    expect(post).toBeDefined();
    expect(post!.content.trim().length).toBeGreaterThan(100);
  });

  it("parses frontmatter dates for every post file", () => {
    const postsDir = path.join(process.cwd(), "src/content/posts");
    const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
      const { data, content } = matter(raw);
      expect(data.title, file).toBeTruthy();
      const dateStr =
        data.date instanceof Date
          ? data.date.toISOString().slice(0, 10)
          : String(data.date);
      expect(dateStr, file).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(content.trim().length, file).toBeGreaterThan(0);
    }
  });
});
