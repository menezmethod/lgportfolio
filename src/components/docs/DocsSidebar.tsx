"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNav, adrNav } from "@/lib/docs-config";
import { BookOpen, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-muted/30 min-h-screen sticky top-0 hidden md:block">
      <div className="p-4 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to site
        </Link>
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Documentation
          </h2>
          <nav className="space-y-0.5" aria-label="Documentation">
            {docsNav.map((doc) => {
              const href = `/docs/${doc.slug}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={doc.slug}
                  href={href}
                  className={cn(
                    "block py-1.5 px-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "text-foreground font-medium bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {doc.title}
                </Link>
              );
            })}
          </nav>
        </div>
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Architecture decisions
          </h2>
          <nav className="space-y-0.5" aria-label="Architecture decision records">
            {adrNav.map((doc) => {
              const href = `/docs/${doc.slug}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={doc.slug}
                  href={href}
                  className={cn(
                    "block py-1.5 px-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "text-foreground font-medium bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {doc.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
