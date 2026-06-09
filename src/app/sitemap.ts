import fs from 'fs';
import path from 'path';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gimenez.dev';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/experience`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/skills`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/work`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/writing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/architecture`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/chat`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/war-room`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
  ];

  const postsDir = path.join(process.cwd(), 'src/content/posts');
  let postPages: MetadataRoute.Sitemap = [];
  if (fs.existsSync(postsDir)) {
    postPages = fs.readdirSync(postsDir)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => {
        const raw = fs.readFileSync(path.join(postsDir, f), 'utf-8');
        const dateMatch = raw.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
        return !dateMatch || new Date(dateMatch[1]) <= new Date();
      })
      .map((file) => ({
        url: `${baseUrl}/writing/${file.replace(/\.md$/, '')}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
  }

  return [...staticPages, ...postPages];
}
