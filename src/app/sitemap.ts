import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const b = 'https://gimenez.dev';
  return [
    { url: b, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: b + '/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: b + '/work', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: b + '/writing', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: b + '/writing/2026-06-01-inferencia-router-deep-dive', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: b + '/writing/2026-06-04-watchdog-that-doesnt-bark', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: b + '/writing/2026-06-07-rate-limit-postmortem', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: b + '/writing/2026-06-10-file-based-rag-without-apology', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: b + '/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: b + '/architecture', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: b + '/chat', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: b + '/war-room', lastModified: new Date(), changeFrequency: 'daily', priority: 0.5 },
  ];
}
