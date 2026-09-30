import Link from "next/link";
import LiveDot from "./LiveDot";

const LINKS = [
  { href: "https://github.com/menezmethod", label: "GitHub", external: true },
  { href: "https://linkedin.com/in/gimenezdev", label: "LinkedIn", external: true },
  { href: "mailto:luisgimenezdev@gmail.com", label: "Email", external: false },
  { href: "/Luis-Gimenez-Resume.pdf", label: "Resume (PDF)", external: false },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-8">
        <p className="text-sm leading-relaxed text-ink-soft">
          Personal site. Views are my own and do not represent The Home Depot. Personal projects are built on personal equipment.
        </p>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-10 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="eyebrow">
          Luis Gimenez / Tampa Bay, FL / Remote U.S.
        </p>
        <ul className="flex flex-wrap items-center gap-x-6">
          {LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="link-under inline-flex min-h-11 items-center text-sm"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link href="/privacy" className="link-under inline-flex min-h-11 items-center text-sm">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/chat" className="link-under inline-flex min-h-11 items-center text-sm">
              Chat
            </Link>
          </li>
          <li>
            <Link href="/war-room" className="link-under inline-flex min-h-11 items-center gap-2 text-sm">
              <LiveDot /> War room
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
