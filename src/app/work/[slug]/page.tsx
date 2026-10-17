import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { getProject, projects } from "@/lib/projects";
import { GatewayDiagram, PaymentsDiagram, SaucerDiagram, SiteDiagram, TelemetryDiagram } from "@/components/site/diagrams";

const DIAGRAMS: Record<string, () => React.JSX.Element> = {
  "home-services-reliability": TelemetryDiagram,
  "enterprise-payments": PaymentsDiagram,
  inferencia: GatewayDiagram,
  lgportfolio: SiteDiagram,
  saucerjam: SaucerDiagram,
};

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: `${p.summary} ${p.role}`,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: { url: `/work/${p.slug}` },
  };
}

/** "Public repo / Public" repeats itself; when one label contains the other, show the longer one once. */
function eyebrow(kind: string, status: string): string {
  const k = kind.trim().toLowerCase();
  const st = status.trim().toLowerCase();
  if (k.includes(st)) return kind;
  if (st.includes(k)) return status;
  return `${kind} / ${status}`;
}

export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const i = projects.findIndex((x) => x.slug === slug);
  const next = projects[(i + 1) % projects.length];
  const Diagram = DIAGRAMS[slug];

  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="border-b border-hairline px-4 pb-12 pt-10 sm:px-8 sm:pt-14">
        <Link href="/work" className="link-under inline-flex min-h-11 items-center gap-2 text-sm text-ink-soft hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> All work
        </Link>
        <p className="eyebrow mt-6">{eyebrow(p.kind, p.status)}</p>
        <h1 className="mt-4 max-w-4xl text-[clamp(40px,7vw,88px)] font-medium leading-[1.05] tracking-[-0.045em]">{p.title}</h1>
        <p className="mt-6 max-w-2xl text-xl leading-snug">{p.summary}</p>
        <p className="mt-3 text-sm text-ink-soft">{p.where}</p>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="border-b border-hairline px-4 py-10 sm:px-8 lg:border-b-0 lg:border-r">
          <p className="border-l-2 border-brand pl-4 text-[17px] leading-relaxed">
            <span className="font-medium">Role. </span>
            {p.role}
          </p>
          {p.scope && (
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              {p.scope.mine && (
                <div>
                  <dt className="eyebrow">My scope</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed">{p.scope.mine}</dd>
                </div>
              )}
              {p.scope.team && (
                <div>
                  <dt className="eyebrow">Team scope</dt>
                  <dd className="mt-2 text-[15px] leading-relaxed">{p.scope.team}</dd>
                </div>
              )}
            </dl>
          )}
          {p.story && (
            <dl className="mt-10 space-y-6">
              {p.story.map((s) => (
                <div key={s.label} className="grid gap-1 border-t border-hairline pt-5 sm:grid-cols-[140px_1fr] sm:gap-8">
                  <dt className="eyebrow pt-1">{s.label}</dt>
                  <dd className="text-[17px] leading-relaxed">{s.text}</dd>
                </div>
              ))}
            </dl>
          )}
          {Diagram && (
            <div className="mt-12 max-w-xl">
              <Diagram />
            </div>
          )}
        </div>

        <aside className="px-4 py-10 sm:px-8">
          <h2 className="eyebrow">Stack</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <li key={s} className="rounded-full border border-hairline px-3 py-1 font-mono text-xs">{s}</li>
            ))}
          </ul>
          {p.teamStack && (
            <p className="mt-4 font-mono text-xs leading-relaxed text-ink-soft">
              Team stack: {p.teamStack.join(", ")}
            </p>
          )}
          <h2 className="eyebrow mt-10">Verify</h2>
          {p.links && (p.links.github || p.links.demo || p.links.secondary) ? (
            <ul className="mt-2">
              {p.links.demo && (
                <li><a href={p.links.demo} target="_blank" rel="noopener noreferrer" className="link-under inline-flex min-h-11 items-center gap-1 text-sm font-medium">Play SaucerJam <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
              )}
              {p.links.invite && (
                <li><a href={p.links.invite} target="_blank" rel="noopener noreferrer" className="link-under inline-flex min-h-11 items-center gap-1 text-sm font-medium">Invite Luis to play <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
              )}
              {p.links.github && (
                <li><a href={p.links.github} target="_blank" rel="noopener noreferrer" className="link-under inline-flex min-h-11 items-center gap-1 text-sm font-medium">GitHub <ArrowUpRight className="size-3.5" aria-hidden /></a></li>
              )}
              {p.links.secondary && (
                <li>
                  <a
                    href={p.links.secondary.href}
                    {...(p.links.secondary.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="link-under inline-flex min-h-11 items-center gap-1 text-sm font-medium"
                  >
                    {p.links.secondary.label} <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              {p.kind === "Professional"
                ? "Enterprise work has no public link. Ask me about it in the chat or in an interview."
                : "The code is private. Ask me about it in the chat."}
            </p>
          )}
          <Link href={`/chat?q=${encodeURIComponent(`Tell me about ${p.title}.`)}`} className="btn-pill mt-8">
            Ask the chat about this <ArrowRight className="size-4" aria-hidden />
          </Link>
        </aside>
      </div>

      <nav aria-label="Next case study" className="border-t border-hairline px-4 py-8 sm:px-8">
        <Link href={`/work/${next.slug}`} className="group inline-flex min-h-11 items-center gap-3 text-lg font-medium">
          Next: {next.title} <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </nav>
    </div>
  );
}
