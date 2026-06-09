import type { Metadata } from 'next';
import { Building2, MapPin } from 'lucide-react';
import { getExperienceContent } from '@/lib/page-content';

export const metadata: Metadata = {
  title: 'Experience | Luis Gimenez',
  description:
    'Career history in enterprise payments, platform engineering, and independent software consultancy.',
};

export default function ExperiencePage() {
  const experience = getExperienceContent();

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-20 text-foreground md:px-6 md:pt-24">
      <div className="mx-auto max-w-4xl">
        <div className="section-indicator mb-6">
          <span>{experience.title}</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold md:text-5xl">Experience</h1>
        <p className="mb-12 max-w-2xl text-lg text-muted-foreground">{experience.description}</p>

        <div className="space-y-10">
          {experience.entries.map((entry) => (
            <article
              key={`${entry.company}-${entry.period}`}
              className="rounded-lg border border-border/50 bg-card/30 p-6 md:p-8 transition-colors hover:border-primary/20"
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <Building2 className="size-5 text-primary" />
                    {entry.company}
                  </h2>
                  <p className="mt-1 text-lg text-primary">{entry.role}</p>
                </div>
                <div className="text-sm text-muted-foreground md:text-right">
                  <p className="font-mono">{entry.period}</p>
                  <p className="mt-1 flex items-center gap-1 md:justify-end">
                    <MapPin className="size-3.5" />
                    {entry.location}
                  </p>
                </div>
              </div>
              <p className="mb-4 leading-relaxed text-muted-foreground">{entry.summary}</p>
              <ul className="space-y-2">
                {entry.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
