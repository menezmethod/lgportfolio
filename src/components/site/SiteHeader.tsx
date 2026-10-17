"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mail, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

type Item = { href: string; label: string; external?: boolean; download?: boolean; dot?: boolean };

const NAV: Item[] = [
  { href: "/work", label: "Work" },
  { href: "/#systems", label: "Systems" },
  { href: "/about", label: "About" },
  { href: "https://github.com/menezmethod", label: "GitHub", external: true },
  { href: "/Luis-Gimenez-Resume.pdf", label: "Resume", download: true },
  { href: "/contact", label: "Contact", dot: true },
];

function NavLink({ n, current, className, onClick }: { n: Item; current: boolean; className: string; onClick?: () => void }) {
  const inner = (
    <>
      {n.label}
      {n.dot && <span className="size-1.5 rounded-full bg-brand" aria-hidden />}
    </>
  );
  if (n.external || n.download) {
    return (
      <a
        href={n.href}
        {...(n.external ? { target: "_blank", rel: "noopener noreferrer" } : { download: true })}
        className={className}
        onClick={onClick}
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={n.href} aria-current={current ? "page" : undefined} className={className} onClick={onClick}>
      {inner}
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // While the mobile menu is open: lock body scroll, and let Escape close it and return focus to its toggle.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const isActive = (href: string) => (href.startsWith("/#") || href.startsWith("http") || href.endsWith(".pdf") ? false : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" aria-label="Luis Gimenez, home" className="flex min-h-11 items-center text-2xl font-medium tracking-tight">
          LG<span className="text-brand">.</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-7">
              {NAV.map((n) => (
                <li key={n.label}>
                  <NavLink
                    n={n}
                    current={isActive(n.href)}
                    className={`link-under inline-flex min-h-11 items-center gap-2 text-sm ${isActive(n.href) ? "text-foreground" : "text-ink-soft hover:text-foreground"}`}
                  />
                </li>
              ))}
            </ul>
          </nav>
          <a
            href="mailto:luisgimenezdev@gmail.com"
            aria-label="Email Luis"
            className="inline-flex size-11 items-center justify-center rounded-full border border-hairline transition-colors hover:bg-muted md:hidden"
          >
            <Mail className="size-4" aria-hidden />
          </a>
          <div className="md:ml-5">
            <ThemeToggle />
          </div>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-hairline md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-hairline bg-background md:hidden">
          <ul className="mx-auto max-w-[1440px] px-4 py-2">
            {[...NAV, { href: "/chat", label: "Chat" }].map((n) => (
              <li key={n.label} className="border-b border-hairline last:border-0">
                <NavLink
                  n={n}
                  current={isActive(n.href)}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center gap-4 text-lg"
                />
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
