import { Eye, Shield, GitBranch } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { getAboutContent, getSkillsContent } from '@/lib/page-content';

const buildIcons = {
  eye: Eye,
  shield: Shield,
  'git-branch': GitBranch,
} as const;

export default function About() {
  const about = getAboutContent();
  const skills = getSkillsContent();

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-20 text-foreground md:px-6 md:pt-24">
      <div className="mx-auto max-w-5xl">
        <div className="section-indicator mb-6">
          <span>{about.title}</span>
        </div>
        <h1 className="mb-10 text-3xl font-bold md:mb-16 md:text-5xl">
          {about.headline}{' '}
          <span className="text-primary">{about.headlineAccent}</span>
        </h1>

        <div className="grid gap-10 md:grid-cols-3 md:gap-16">
          <div className="space-y-8 text-lg leading-relaxed text-muted-foreground md:col-span-2">
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-foreground prose-strong:font-semibold">
              <ReactMarkdown>{about.body}</ReactMarkdown>
            </div>

            <h2 className="mt-10 mb-6 flex items-center gap-3 text-2xl font-bold text-foreground">
              <span className="h-8 w-1 rounded-full bg-primary" />
              What I Build
            </h2>
            <ul className="space-y-6">
              {about.buildItems.map((item) => {
                const Icon = buildIcons[item.icon];
                return (
                  <li key={item.title} className="group">
                    <div className="flex items-start gap-4 rounded-lg border border-transparent p-4 transition-colors hover:border-border/50 hover:bg-card/50">
                      <div className="mt-1 rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <span className="mb-1 block text-lg font-semibold text-foreground">
                          {item.title}
                        </span>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <h2 className="mt-12 mb-6 flex items-center gap-3 text-2xl font-bold text-foreground">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Operating Principles
            </h2>
            <div className="grid gap-6">
              {about.principles.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-border/50 bg-card/30 p-6 transition-colors hover:border-primary/20"
                >
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-base">
              <Link href="/experience" className="font-medium text-primary hover:text-primary/80">
                View full experience →
              </Link>
            </p>
          </div>

          <div className="md:col-span-1">
            <div className="terminal-window sticky top-24">
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red" />
                <div className="terminal-dot terminal-dot-yellow" />
                <div className="terminal-dot terminal-dot-green" />
                <span className="terminal-title">stack.yml</span>
              </div>
              <div className="space-y-6 p-5">
                {skills.categories.slice(0, 4).map((category) => (
                  <div key={category.name}>
                    <h4 className="mb-3 border-b border-primary/20 pb-1 text-xs font-mono uppercase tracking-wider text-primary">
                      {category.name}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {category.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded border border-border/50 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                <Link
                  href="/skills"
                  className="block text-center text-xs font-mono text-primary hover:text-primary/80"
                >
                  view all skills →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
