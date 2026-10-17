import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { projects } from "@/lib/projects";

const main = projects.filter((p) => p.featured);
const also = projects.filter((p) => !p.featured);

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected work: Go payment services, Home Services reliability, an LLM gateway, and firmware and apps. Each entry states what I owned and what I contributed to.",
  alternates: { canonical: "/work" },
  openGraph: { url: "/work" },
};

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="link-under inline-flex min-h-11 items-center gap-1 text-sm font-medium"
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden />
    </a>
  );
}

export default function WorkPage() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="border-b border-hairline px-4 pb-12 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow rise">Work</p>
        <h1 className="rise mt-5 max-w-4xl text-[clamp(40px,7vw,88px)] font-medium leading-[1.05] tracking-[-0.045em]" style={{ animationDelay: "60ms" }}>
          Things I built, and what I owned in each.
        </h1>
        <p className="rise mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft" style={{ animationDelay: "120ms" }}>
          Personal work links to a repo or a live site. Personal projects are built on personal equipment. Each entry says whether I authored it, owned a piece, or contributed.
        </p>
        <ul className="mt-8 flex flex-wrap gap-x-6">
          {projects.map((p) => (
            <li key={p.slug}>
              <a href={`#${p.slug}`} className="link-under inline-flex min-h-11 items-center font-mono text-[12px] text-ink-soft hover:text-foreground">
                {p.title}
              </a>
            </li>
          ))}
        </ul>
      </header>

      <ol>
        {main.map((p, i) => (
          <li
            key={p.slug}
            id={p.slug}
            className="scroll-mt-20 border-b border-hairline px-4 py-10 sm:px-8 sm:py-14 lg:grid lg:grid-cols-[260px_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12"
          >
            <div className="flex items-start justify-between gap-4 lg:block">
              <p className="font-mono text-xs text-ink-soft">{String(i + 1).padStart(2, "0")}</p>
              <div className="lg:mt-6">
                <p className="eyebrow">{p.kind}</p>
                <p className="mt-2 text-sm leading-snug text-ink-soft">{p.where}</p>
                <p className="mt-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em]">
                  <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                  {p.status}
                </p>
              </div>
            </div>

            <div className="mt-6 lg:mt-0">
              <h2 className="text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{p.title}</h2>
              <p className="mt-3 text-lg leading-snug">{p.summary}</p>
              <p className="mt-4 border-l-2 border-brand pl-4 text-[15px] leading-relaxed text-ink-soft">
                <span className="font-medium text-foreground">Role. </span>
                {p.role}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Stack">
                {p.stack.map((s) => (
                  <li key={s} className="rounded-full border border-hairline px-3 py-1 font-mono text-xs">
                    {s}
                  </li>
                ))}
              </ul>
              {p.links && (
                <div className="mt-4 flex flex-wrap gap-x-6">
                  {p.links.demo && <ExtLink href={p.links.demo}>Play SaucerJam</ExtLink>}
                  {p.links.invite && <ExtLink href={p.links.invite}>Invite Luis to play</ExtLink>}
                  {p.links.github && <ExtLink href={p.links.github}>GitHub</ExtLink>}
                  {p.links.secondary && <ExtLink href={p.links.secondary.href}>{p.links.secondary.label}</ExtLink>}
                </div>
              )}
              <Link href={`/work/${p.slug}`} className="link-under mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium">
                Open case study <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>

            {p.story && (
              <dl className="mt-8 space-y-5 lg:mt-0">
                {p.story.map((s) => (
                  <div key={s.label} className="grid gap-1 border-t border-hairline pt-4 sm:grid-cols-[110px_minmax(0,1fr)] sm:gap-6">
                    <dt className="eyebrow pt-0.5">{s.label}</dt>
                    <dd className="break-words text-[15px] leading-relaxed">{s.text}</dd>
                  </div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ol>

      <section aria-labelledby="also" className="px-4 py-12 sm:px-8">
        <h2 id="also" className="eyebrow">Also built</h2>
        <ul className="mt-6 grid border-t border-hairline md:grid-cols-3">
          {also.map((p) => (
            <li key={p.slug} id={p.slug} className="scroll-mt-20 border-b border-hairline py-6 md:border-b-0 md:pr-8">
              <p className="eyebrow">{p.kind}</p>
              <h3 className="mt-3 text-xl font-medium tracking-[-0.02em]"><Link href={`/work/${p.slug}`} className="link-under">{p.title}</Link></h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{p.summary}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{p.role}</p>
              <p className="mt-3 font-mono text-xs leading-relaxed text-ink-soft">{p.stack.join(" / ")}</p>
              {p.links && (
                <div className="mt-2 flex flex-wrap gap-x-6">
                  {p.links.github && <ExtLink href={p.links.github}>GitHub</ExtLink>}
                  {p.links.secondary && <ExtLink href={p.links.secondary.href}>{p.links.secondary.label}</ExtLink>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
