import {
  Archive,
  ArrowUpRight,
  Building2,
  Cloud,
  Construction,
  Cpu,
  ExternalLink,
  Github,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import {
  archivedProjects,
  featuredProjects,
  supportingProjects,
  type Project,
} from '@/lib/projects';

const statusStyles: Record<Project['status'], { label: string; className: string }> = {
  production: {
    label: 'PRODUCTION',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  live: {
    label: 'LIVE',
    className: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  },
  building: {
    label: 'BUILDING NOW',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  },
  archived: {
    label: 'ARCHIVED',
    className: 'border-border/70 bg-card/50 text-muted-foreground',
  },
};

function ProjectActions({ project }: { project: Project }) {
  if (project.origin === 'professional') {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <span className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground">
          <Lock className="size-4" />
          proprietary system
        </span>
        {project.links?.caseStudy ? (
          <Link
            href={project.links.caseStudy}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Building2 className="size-4" />
            Architecture case study
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {project.links?.demo ? (
        <a
          href={project.links.demo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          <ExternalLink className="size-4" />
          Live system
        </a>
      ) : null}
      {project.links?.github ? (
        <a
          href={project.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Github className="size-4" />
          Source
        </a>
      ) : null}
      {project.links?.caseStudy ? (
        <Link
          href={project.links.caseStudy}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowUpRight className="size-4" />
          Case study
        </Link>
      ) : null}
    </div>
  );
}

export default function Work() {
  const productionCount = featuredProjects.filter(
    (project) => project.status === 'production' || project.status === 'live',
  ).length;
  const buildingCount = featuredProjects.filter(
    (project) => project.status === 'building',
  ).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pt-20 pb-16 text-foreground md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(62,160,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,161,58,0.08),transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="font-mono text-sm text-emerald-400">$</span>
          <span className="font-mono text-sm text-muted-foreground">cat ./src/content/projects.json</span>
        </div>

        <div className="max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-mono uppercase tracking-[0.24em] text-primary">
            <Construction className="size-3.5" />
            portfolio audit complete
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Systems with <span className="text-primary">architectural weight</span>.
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            This page no longer reads like a startup app gallery. It leads with production-scale
            payment systems, introduces three hardware-backed hero builds, and archives work that
            does not strengthen the principal systems and AI architecture narrative.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { label: 'production proof', value: String(productionCount) },
            { label: 'hero builds queued', value: String(buildingCount) },
            { label: 'commodity demos archived', value: String(archivedProjects.length) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/60 bg-card/35 p-5 backdrop-blur-sm"
            >
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-3 text-4xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-16 space-y-8 md:mt-20">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-primary/60" />
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Featured systems
            </p>
          </div>

          <div className="space-y-10">
            {featuredProjects.map((project) => (
              <article
                key={project.slug}
                className="rounded-[1.75rem] border border-border/60 bg-card/35 p-6 backdrop-blur-sm md:p-8"
              >
                <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-mono tracking-[0.2em] ${statusStyles[project.status].className}`}
                      >
                        {statusStyles[project.status].label}
                      </span>
                      <span className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                        {project.eyebrow}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        {project.company || 'Independent build'}
                      </p>
                      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                        {project.title}
                      </h2>
                      <p className="max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
                        {project.summary}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { label: 'Constraint', value: project.narrative.problem },
                        { label: 'Trade-off', value: project.narrative.tradeoff },
                        { label: 'Decision', value: project.narrative.decision },
                        { label: 'Outcome', value: project.narrative.outcome },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-border/50 bg-background/40 p-5"
                        >
                          <p className="mb-2 font-mono text-xs uppercase tracking-[0.24em] text-primary">
                            {item.label}
                          </p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {project.stack.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-border/60 bg-background/45 px-3 py-1 text-xs font-mono text-muted-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    {project.nextMilestone ? (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4">
                        <p className="font-mono text-xs uppercase tracking-[0.24em] text-amber-300">
                          Next milestone
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {project.nextMilestone}
                        </p>
                      </div>
                    ) : null}

                    <ProjectActions project={project} />
                  </div>

                  <aside className="space-y-5 rounded-[1.5rem] border border-border/60 bg-background/45 p-5">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Architecture
                      </p>
                      <p className="mt-3 text-xl font-semibold text-foreground">
                        {project.architecture}
                      </p>
                    </div>

                    <div className="space-y-4 border-y border-border/50 py-5">
                      <div className="flex items-start gap-3">
                        <Cloud className="mt-0.5 size-4 text-primary" />
                        <div>
                          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Cloud surface
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {project.cloud}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Cpu className="mt-0.5 size-4 text-primary" />
                        <div>
                          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Hardware surface
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {project.hardware}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Proof points
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        {project.metrics.map((metric) => (
                          <div
                            key={metric.label}
                            className="rounded-2xl border border-border/50 bg-card/40 p-4"
                          >
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                              {metric.label}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-primary">
                              {metric.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              </article>
            ))}
          </div>
        </section>

        {supportingProjects.length > 0 ? (
          <section className="mt-20 space-y-8">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-primary/60" />
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                Supporting systems
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {supportingProjects.map((project) => (
                <article
                  key={project.slug}
                  className="rounded-[1.5rem] border border-border/60 bg-card/30 p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-mono tracking-[0.2em] ${statusStyles[project.status].className}`}
                    >
                      {statusStyles[project.status].label}
                    </span>
                    <span className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                      {project.eyebrow}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">{project.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {project.summary}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.stack.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs font-mono text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6">
                    <ProjectActions project={project} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-20 space-y-8">
          <div className="flex items-center gap-3">
            <Archive className="size-4 text-primary" />
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Archived from headline rotation
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {archivedProjects.map((project) => (
              <article
                key={project.slug}
                className="rounded-[1.5rem] border border-border/60 bg-card/20 p-6"
              >
                <h2 className="text-xl font-semibold text-foreground">{project.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {project.summary}
                </p>
                <div className="mt-5 rounded-2xl border border-border/50 bg-background/40 p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">
                    Why archived
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {project.archiveReason}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.stack.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs font-mono text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                {project.links?.github ? (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Github className="size-4" />
                    Source
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
