import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Open to Senior Platform, Infrastructure, and Go backend roles. Tampa Bay, FL. Remote U.S. preferred.",
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact" },
};

const CHANNELS = [
  { n: "01", label: "Email", value: "luisgimenezdev@gmail.com", href: "mailto:luisgimenezdev@gmail.com", note: "Best for roles and intros." },
  { n: "02", label: "LinkedIn", value: "linkedin.com/in/gimenezdev", href: "https://linkedin.com/in/gimenezdev", note: "Message me directly." },
  { n: "03", label: "Resume", value: "Download the PDF", href: "/Luis-Gimenez-Resume.pdf", note: "Two pages. Same facts as this site." },
  { n: "04", label: "GitHub", value: "github.com/menezmethod", href: "https://github.com/menezmethod", note: "Public repos: inferencia, openclaw-cursor, and this site." },
];

const FACTS = [
  ["Roles", "Senior Platform, Infrastructure, and Go backend"],
  ["Location", "Tampa Bay, FL"],
  ["Work mode", "Remote U.S. preferred. Light hybrid near Tampa is fine."],
  ["Authorization", "U.S. citizen"],
];

export default function Contact() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="border-b border-hairline px-4 pb-12 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow rise">Contact</p>
        <h1 className="rise mt-5 max-w-4xl text-[clamp(44px,8vw,104px)] font-medium leading-[1.02] tracking-[-0.05em]" style={{ animationDelay: "60ms" }}>
          Open to Senior Platform, Infrastructure, and Go backend roles<span className="text-brand">.</span>
        </h1>
      </header>

      <div className="grid lg:grid-cols-[1fr_420px]">
        <ul className="border-b border-hairline lg:border-b-0 lg:border-r">
          {CHANNELS.map((c) => (
            <li key={c.n} className="border-b border-hairline last:border-b-0">
              <a
                href={c.href}
                {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...(c.href.endsWith(".pdf") ? { download: true } : {})}
                className="group flex min-h-28 items-center justify-between gap-6 px-4 py-6 transition-colors hover:bg-card sm:px-8"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-soft">{c.n} / {c.label}</p>
                  <p className="mt-2 break-words text-2xl font-medium tracking-[-0.02em] sm:text-3xl">{c.value}</p>
                  <p className="mt-1 text-sm text-ink-soft">{c.note}</p>
                </div>
                <ArrowUpRight className="size-6 shrink-0 text-ink-soft transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand-text" aria-hidden />
              </a>
            </li>
          ))}
        </ul>

        <dl className="px-4 py-8 sm:px-8">
          {FACTS.map(([k, v]) => (
            <div key={k} className="border-b border-hairline py-5 first:pt-0 last:border-b-0">
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-2 text-[17px] leading-snug">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="border-t border-hairline px-4 py-6 text-sm text-ink-soft sm:px-8">
        Personal site. Views are my own and do not represent The Home Depot.
      </p>
    </div>
  );
}
