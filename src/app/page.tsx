import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Download } from "lucide-react";
import PromptBar from "@/components/site/PromptBar";
import TraceWaterfall from "@/components/site/TraceWaterfall";
import { PaymentsDiagram, SaucerDiagram, TelemetryDiagram } from "@/components/site/diagrams";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

type Case = {
  n: string;
  kind: string;
  slug: string;
  title: string;
  text: string;
  Diagram: () => React.JSX.Element;
  label: string;
  facts: { v: string; l: string }[];
  tags: string;
  extra?: { href: string; label: string; external?: boolean }[];
};

const CASES: Case[] = [
  {
    n: "01",
    kind: "Operate",
    slug: "home-services-reliability",
    title: "Home Services telemetry and deployment",
    text: "The Home Services telemetry apps, and the deployment path I built that lets non-developers ship to production through the gates.",
    Diagram: TelemetryDiagram,
    label: "Scope",
    facts: [
      { v: "Telemetry apps", l: "Python and Go services that ingest Salesforce data into BigQuery for Grafana" },
      { v: "Deploy path", l: "I built it. The first app went through it and it became the pattern." },
      { v: "SLOs", l: "and Critical User Journeys, defined with the team" },
    ],
    tags: "Python / Go / BigQuery / GKE / Cloud Run. Team stack: OpenTelemetry / Prometheus / Grafana",
    extra: [{ href: "/work/deployment-path", label: "Deployment path case study" }],
  },
  {
    n: "02",
    kind: "Build",
    slug: "enterprise-payments",
    title: "Enterprise Payments",
    text: "Go authorization services on CockroachDB. I contributed to a card-authorization broker service and worked a gift-card tender API from initial design.",
    Diagram: PaymentsDiagram,
    label: "Scope and tech",
    facts: [
      { v: "Broker service", l: "I contributed to request validation, duplicate detection, and format conversion between upstream clients and downstream processors." },
      { v: "Gift-card API", l: "Worked from initial design: implementation, production-readiness review, alerting, and on-call." },
      { v: "2,300+", l: "stores in the retail environment the platform runs in" },
    ],
    tags: "Go / CockroachDB / GKE / Pivotal Cloud Foundry",
  },
  {
    n: "03",
    kind: "Ship",
    slug: "saucerjam",
    title: "SaucerJam, inferencia, and this site",
    text: "A browser multiplayer game you can play now, a Go LLM gateway, and the site you are reading. The game's code is private. The other two are public.",
    Diagram: SaucerDiagram,
    label: "Built with",
    facts: [
      { v: "60 Hz", l: "fixed-step simulation shared by the server and offline practice" },
      { v: "Inputs only", l: "clients never send health, damage, or positions (SaucerJam)" },
      { v: "Go", l: "OpenAI-compatible gateway with health-aware routing (inferencia)" },
    ],
    tags: "Node.js / Socket.IO / Three.js / Go / Next.js",
    extra: [
      { href: "/work/inferencia", label: "inferencia case study (Go)" },
      { href: "https://github.com/menezmethod/inferencia", label: "inferencia source on GitHub", external: true },
      { href: "https://saucerjam.com/?utm_source=portfolio&utm_medium=case_study&utm_campaign=launch", label: "Play SaucerJam", external: true },
      { href: "https://saucerjam.com/?host=1&utm_source=portfolio&utm_medium=recruiter_invite&utm_campaign=launch", label: "Invite Luis to play", external: true },
    ],
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-10 sm:px-8 sm:pt-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-14 lg:gap-y-12">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <p className="eyebrow rise">Software engineer / Platform + reliability</p>
              <h1
                className="rise mt-6 text-[clamp(64px,10vw,148px)] font-medium leading-[0.9] tracking-[-0.055em]"
                style={{ animationDelay: "60ms" }}
              >
                Luis
                <br />
                Gimenez<span className="text-brand">.</span>
              </h1>
              <p
                className="rise mt-8 max-w-lg text-balance text-2xl font-medium leading-tight tracking-[-0.02em] sm:text-[28px]"
                style={{ animationDelay: "140ms" }}
              >
                I build and run systems that have to keep working.
              </p>
              <p className="rise mt-4 max-w-lg text-[17px] leading-relaxed" style={{ animationDelay: "200ms" }}>
                Go authorization services on CockroachDB for The Home Depot&apos;s payments platform, now primary owner (with team input) of the telemetry apps, and I built the production deployment path for Home Services.
              </p>
              <p className="rise mt-3 font-mono text-sm text-ink-soft" style={{ animationDelay: "240ms" }}>
                Go / GCP / Kubernetes / OpenTelemetry
              </p>
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-4 lg:col-span-2 lg:row-start-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <a href="#systems" className="btn-pill">
                  See the work <ArrowDown className="size-4" aria-hidden />
                </a>
                <a href="/Luis-Gimenez-Resume.pdf" download className="btn-ghost">
                  Download résumé <Download className="size-4" aria-hidden />
                </a>
              </div>
              <div className="text-sm leading-relaxed sm:text-right">
                <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] sm:justify-end">
                  <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                  Open to opportunities
                </p>
                <p className="text-ink-soft">Senior Platform, Infrastructure, and Go backend roles. Tampa Bay, FL (Remote U.S.)</p>
                <div className="flex flex-wrap items-center gap-x-5 sm:justify-end">
                  <a href="https://github.com/menezmethod/inferencia" target="_blank" rel="noopener noreferrer" className="link-under inline-flex min-h-11 items-center gap-1 text-sm text-foreground">
                    inferencia on GitHub <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                  <a href="mailto:luisgimenezdev@gmail.com" className="link-under inline-flex min-h-11 items-center font-mono text-foreground">
                    luisgimenezdev@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-2 lg:row-start-3">
              <PromptBar />
            </div>

            <div className="rise min-w-0 lg:col-start-2 lg:row-start-1 lg:pt-2" style={{ animationDelay: "120ms" }}>
              <TraceWaterfall />
            </div>
          </div>
        </div>
      </section>

      {/* Systems */}
      <section id="systems" aria-labelledby="systems-h" className="scroll-mt-16 border-b border-hairline">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-4 px-4 pb-8 pt-12 sm:px-8 md:grid-cols-2 md:items-end">
            <h2 id="systems-h" className="text-4xl font-medium tracking-[-0.035em] sm:text-5xl">
              Work I can walk you through.
            </h2>
            <p className="max-w-md text-[17px] leading-relaxed text-ink-soft md:justify-self-end">
              Three places to look. Each one opens to the problem, the decision, what I did, and where to verify it.
            </p>
          </div>

          <ol className="border-t border-hairline">
            {CASES.map((c) => (
              <li key={c.slug} className="border-b border-hairline last:border-b-0 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-x-10 lg:px-8 xl:grid-cols-[300px_minmax(0,1fr)_240px]">
                <div className="px-4 py-8 sm:px-8 lg:row-span-2 lg:px-0 lg:py-10">
                  <p className="flex gap-6 font-mono text-xs uppercase tracking-[0.16em] text-ink-soft">
                    <span>{c.n}</span>
                    <span>{c.kind}</span>
                  </p>
                  <h3 className="mt-5 text-2xl font-medium leading-tight tracking-[-0.025em] sm:text-[28px]">{c.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{c.text}</p>
                  <div className="mt-3 flex flex-col items-start">
                    <Link href={`/work/${c.slug}`} className="link-under inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                      Open case study <ArrowRight className="size-4" aria-hidden />
                    </Link>
                    {c.extra?.map((x) =>
                      x.external ? (
                        <a key={x.label} href={x.href} target="_blank" rel="noopener noreferrer" className="link-under inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                          {x.label} <ArrowUpRight className="size-4" aria-hidden />
                        </a>
                      ) : (
                        <Link key={x.label} href={x.href} className="link-under inline-flex min-h-11 items-center gap-2 text-sm font-medium">
                          {x.label} <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      ),
                    )}
                  </div>
                </div>
                <div className="px-4 pb-2 sm:px-8 lg:px-0 lg:py-10">
                  <div className="mx-auto max-w-[460px] lg:mx-0"><c.Diagram /></div>
                </div>
                <div className="px-4 py-8 sm:px-8 lg:col-start-2 lg:px-0 lg:pb-10 lg:pt-0 xl:col-start-3 xl:py-10">
                  <p className="eyebrow">{c.label}</p>
                  <dl className="mt-3 lg:grid lg:grid-cols-3 lg:gap-6 xl:block">
                    {c.facts.map((f) => (
                      <div key={f.v} className="border-t border-hairline py-3 first:border-t-0 first:pt-0 lg:border-t-0 lg:py-0 xl:border-t xl:py-3 xl:first:border-t-0 xl:first:pt-0">
                        <dt className="text-2xl font-medium tracking-[-0.02em]">{f.v}</dt>
                        <dd className="mt-1 text-sm leading-snug text-ink-soft">{f.l}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 font-mono text-xs leading-relaxed text-ink-soft">{c.tags}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Live infrastructure */}
      <section aria-labelledby="live-h">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 id="live-h" className="text-lg font-medium">This site is live infrastructure.</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
              Next.js 16 deployed with Coolify on a free-tier cloud VM, behind Cloudflare. CI runs on GitHub Actions. The chat retrieves from Cloudflare Vectorize and generates on Workers AI. War Room counters live in memory and reset on restart.
            </p>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-3">
            <li>
              <Link href="/war-room" className="group flex min-h-14 flex-col justify-center border-t border-hairline py-2 lg:border-l lg:border-t-0 lg:pl-6">
                <span className="text-sm font-medium">War Room</span>
                <span className="text-sm text-ink-soft group-hover:text-foreground">Live status <ArrowRight className="inline size-3.5" aria-hidden /></span>
              </Link>
            </li>
            <li>
              <Link href="/work/lgportfolio" className="group flex min-h-14 flex-col justify-center border-t border-hairline py-2 lg:border-l lg:border-t-0 lg:pl-6">
                <span className="text-sm font-medium">How it&apos;s built</span>
                <span className="text-sm text-ink-soft group-hover:text-foreground">Case study <ArrowRight className="inline size-3.5" aria-hidden /></span>
              </Link>
            </li>
            <li>
              <a href="https://github.com/menezmethod/lgportfolio" target="_blank" rel="noopener noreferrer" className="group flex min-h-14 flex-col justify-center border-t border-hairline py-2 lg:border-l lg:border-t-0 lg:pl-6">
                <span className="text-sm font-medium">Source</span>
                <span className="text-sm text-ink-soft group-hover:text-foreground">View on GitHub <ArrowUpRight className="inline size-3.5" aria-hidden /></span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
