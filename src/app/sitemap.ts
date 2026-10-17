import type { MetadataRoute } from 'next';

import { projects } from '@/lib/projects';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gimenez.dev';

  const cases = projects.map((p) => ({ url: `https://gimenez.dev/work/${p.slug}`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/work`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/war-room`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/chat`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    ...cases,
  ];
}
