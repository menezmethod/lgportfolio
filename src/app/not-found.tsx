import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[1440px] flex-col px-4 py-20 sm:px-8 sm:py-28">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 text-[clamp(56px,12vw,160px)] font-medium leading-[1] tracking-[-0.055em]">
        Not found<span className="text-brand">.</span>
      </h1>
      <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-soft">
        This page does not exist, or it moved. The work, about, and chat pages are a click away.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link href="/" className="btn-pill">
          Back home <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link href="/work" className="btn-ghost">
          See the work <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
