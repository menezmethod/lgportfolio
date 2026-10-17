import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, GitBranch, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  getAboutContent,
  getExperienceContent,
  getSkillsContent,
} from "@/lib/page-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Software engineer. Go backend work on Enterprise Payments, then platform and reliability work on Home Services at The Home Depot.",
  alternates: { canonical: "/about" },
  openGraph: { url: "/about" },
};

const ICONS = { eye: Eye, shield: ShieldCheck, "git-branch": GitBranch };

export default function About() {
  const about = getAboutContent();
  const exp = getExperienceContent();
  const skills = getSkillsContent();

  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="border-b border-hairline px-4 pb-12 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow rise">About</p>
        <h1 className="rise mt-5 text-[clamp(44px,8vw,104px)] font-medium leading-[1.02] tracking-[-0.05em]" style={{ animationDelay: "60ms" }}>
          {about.headline}
          <br />
          <span className="text-ink-soft">{about.headlineAccent}</span>
        </h1>
        <div className="rise mt-10 max-w-2xl space-y-5 text-[17px] leading-relaxed [&_strong]:font-medium" style={{ animationDelay: "140ms" }}>
          <ReactMarkdown>{about.body}</ReactMarkdown>
        </div>
      </header>

      {/* What I do */}
      <section aria-labelledby="do" className="border-b border-hairline">
        <h2 id="do" className="eyebrow px-4 pt-10 sm:px-8">01 / What I do</h2>
        <ul className="mt-6 grid border-t border-hairline md:grid-cols-3">
          {about.buildItems.map((b) => {
            const Icon = ICONS[b.icon] ?? Eye;
            return (
              <li key={b.title} className="border-b border-hairline px-4 py-8 sm:px-8 md:border-b-0 md:border-r md:last:border-r-0">
                <Icon className="size-5 text-brand-text" aria-hidden />
                <h3 className="mt-5 text-xl font-medium tracking-[-0.02em]">{b.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{b.description}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Experience */}
      <section aria-labelledby="exp" className="border-b border-hairline">
        <h2 id="exp" className="eyebrow px-4 pt-10 sm:px-8">02 / Experience</h2>
        <ol className="mt-6 border-t border-hairline">
          {exp.entries.map((e) => (
            <li key={e.company + e.period} className="border-b border-hairline px-4 py-8 last:border-b-0 sm:px-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
              <div>
                <p className="font-mono text-[12px]">{e.period}</p>
                <p className="mt-2 text-sm text-ink-soft">{e.location}</p>
              </div>
              <div className="mt-3 lg:mt-0">
                <h3 className="text-xl font-medium tracking-[-0.02em]">
                  {e.role}, {e.company}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{e.summary}</p>
                <ul className="mt-4 space-y-2 text-[15px] leading-relaxed">
                  {e.highlights.map((h) => (
                    <li key={h} className="flex gap-3">
                      <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-ink-soft" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Principles */}
      <section aria-labelledby="how" className="border-b border-hairline">
        <h2 id="how" className="eyebrow px-4 pt-10 sm:px-8">03 / How I work</h2>
        <ul className="mt-6 grid border-t border-hairline md:grid-cols-3">
          {about.principles.map((p) => (
            <li key={p.title} className="border-b border-hairline px-4 py-8 sm:px-8 md:border-b-0 md:border-r md:last:border-r-0">
              <h3 className="text-lg font-medium tracking-[-0.01em]">{p.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{p.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Skills */}
      <section aria-labelledby="skills" className="border-b border-hairline">
        <h2 id="skills" className="eyebrow px-4 pt-10 sm:px-8">04 / Skills</h2>
        <div className="mt-6 grid border-t border-hairline md:grid-cols-2 lg:grid-cols-3">
          {skills.categories.map((c) => (
            <div key={c.name} className="border-b border-hairline px-4 py-7 sm:px-8 lg:[&:not(:nth-child(3n))]:border-r md:[&:nth-child(odd)]:border-r lg:[&:nth-child(odd)]:border-r-0">
              <h3 className="eyebrow">{c.name}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <li key={s} className="rounded-full border border-hairline px-3 py-1 font-mono text-xs">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-12 sm:px-8">
        <Link href="/contact" className="btn-pill">
          Get in touch <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/work" className="btn-ghost">
          See the work <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/war-room" className="btn-ghost">
          Live telemetry from this site <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
      <p className="px-4 pb-12 text-sm text-ink-soft sm:px-8">Personal site. Views are my own and do not represent The Home Depot.</p>
    </div>
  );
}
