import type { Metadata } from 'next';
import { getSkillsContent } from '@/lib/page-content';

export const metadata: Metadata = {
  title: 'Skills | Luis Gimenez',
  description:
    'Production skills across Go, GCP, observability, platform engineering, and distributed systems.',
};

export default function SkillsPage() {
  const skills = getSkillsContent();

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-20 text-foreground md:px-6 md:pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="section-indicator mb-6">
          <span>{skills.title}</span>
        </div>
        <h1 className="mb-4 text-3xl font-bold md:text-5xl">Technical Skills</h1>
        <p className="mb-12 max-w-2xl text-lg text-muted-foreground">{skills.description}</p>

        <div className="grid gap-8 md:grid-cols-2">
          {skills.categories.map((category) => (
            <div
              key={category.name}
              className="rounded-lg border border-border/50 bg-card/30 p-6 transition-colors hover:border-primary/20"
            >
              <h2 className="mb-4 border-b border-primary/20 pb-2 font-mono text-sm uppercase tracking-wider text-primary">
                {category.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded border border-border/50 bg-card/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
