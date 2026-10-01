"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";

const PROMPTS = [
  "Walk me through your payments work.",
  "What did you build on Home Services?",
  "How does the chat on this site work?",
  "What roles are you looking for?",
];

export default function PromptBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    if (v) router.push(`/chat?q=${encodeURIComponent(v)}`);
  };

  return (
    <div>
      <form action="/chat" method="get" onSubmit={submit} className="flex items-center gap-3 rounded-lg border border-hairline bg-card p-2 pl-5 transition-colors focus-within:border-foreground">
        <Search className="size-5 shrink-0 text-ink-soft" aria-hidden />
        <label htmlFor="ask" className="sr-only">
          Ask the assistant about Luis&apos;s work. The answer comes from the chat.
        </label>
        <input
          id="ask"
          name="q"
          maxLength={500}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask the assistant about Luis's work"
          autoComplete="off"
          className="min-h-12 min-w-0 flex-1 text-ellipsis bg-transparent text-sm outline-none placeholder:text-ink-soft sm:text-base"
        />
        <button
          type="submit"
          aria-label="Send question to chat"
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-md bg-[var(--pill-bg)] text-[var(--pill-fg)] transition-transform hover:scale-105 active:scale-95"
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </form>
      <p className="mt-2 font-mono text-xs text-ink-soft">
        Answers come from my CV and notes, generated on Cloudflare Workers AI.
      </p>
      <ul className="mt-3 grid border-t border-hairline sm:grid-cols-2 lg:grid-cols-4">
        {PROMPTS.map((p) => (
          <li key={p} className="border-b border-hairline lg:border-b-0 lg:border-r lg:last:border-r-0">
            <Link
              href={`/chat?q=${encodeURIComponent(p)}`}
              className="group flex min-h-16 items-center justify-between gap-4 px-1 py-3 text-[15px] leading-snug transition-colors hover:text-brand-text sm:px-4 sm:first:pl-1"
            >
              {p}
              <ArrowRight className="size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
