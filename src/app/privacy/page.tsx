import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site collects, where it goes, who can see it, and how to ask for deletion.",
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy" },
};

const SECTIONS: { h: string; items: string[] }[] = [
  {
    h: "What is collected",
    items: [
      "Page views. On each page navigation your browser sends the page path to the site. The server records the path, the first 200 characters of your user-agent and referrer, and a coarse category (recruiter, person, crawler, bot, or unknown) guessed from the user-agent. These are kept in server memory and counters, which reset when the app restarts. The server also writes a structured log line per page request with the coarse category, the path, a referrer truncated to 200 characters, and a short user-agent summary. API routes log a trace ID, status, and timing.",
      "Chat messages. What you type in the chat is sent to the server and to the AI services that answer it. When storage is enabled, the last 20 messages of a chat, a random session ID from your browser's session storage, and session statistics (message count, timing, and status) are saved. The code sets no automatic expiry on saved chats.",
      "Your email, only if you choose to leave it in the chat, and only when storage is enabled. It is saved on the chat session so Luis can follow up. When storage is not enabled the email box is hidden and nothing is saved.",
      "IP addresses. The app reads your IP address in memory to limit requests per minute, to compare it with Luis's own addresses, and as a hashed, truncated key held for about 30 minutes to avoid duplicate visit pings. The app does not write your IP to its logs or to saved chats. For likely-human visitors the IP is sent in the visit message described below.",
      "Cloudflare web analytics. The site is served through Cloudflare, which may add its own web analytics beacon to pages at the edge. It is not part of this site's code. On these pages it sets no cookies, and the site sets none either. Luis can switch it off in Cloudflare.",
      "Your browser's storage. If you use the theme button, your choice is saved in your browser's localStorage under the key \"theme\", on your device only. The chat uses your browser's session storage for a random session ID and a message count.",
      "Other analytics scripts. The pages do not load Google Analytics or any advertising script. The repository has an optional Google Analytics component that only loads when a measurement ID is configured and your browser is not sending Do Not Track or Global Privacy Control.",
    ],
  },
  {
    h: "Where it goes",
    items: [
      "The site is deployed with Coolify on a cloud VM, behind Cloudflare DNS and proxy, so Cloudflare sees site traffic.",
      "Chat retrieval runs on Cloudflare Vectorize and chat generation is designed to run on Cloudflare Workers AI. The site owner can also enable other model providers (OpenRouter or a self-hosted gateway); if one is enabled, your chat text is sent to it too. The chat page names the providers that are active right now.",
      "When storage is enabled, saved chats and emails are stored in Google Firestore. When it is not enabled, chats and emails are not saved at all. The chat page states which applies.",
      "Visit messages. When a visitor is classified as a person or recruiter (bots and crawlers are not), the site sends one signed message to a webhook that only Luis controls, at most once per visitor per 30 minutes. Visits from Luis's own IP addresses never send one. The message contains your IP address, the referrer (truncated to 200 characters), a short browser or app summary, the country code from the CDN when present, the page path, a coarse category (person or recruiter), and a timestamp.",
    ],
  },
  {
    h: "Who can see it",
    items: [
      "Luis, through an admin board and admin APIs that require a secret. Saved chats can contain whatever you typed, so please do not share sensitive personal information.",
      "The hosting and service providers above, as part of running the site.",
      "The War Room page is public and shows aggregate counters. It does not show visitor paths or user-agents.",
    ],
  },
  {
    h: "Deleting your data",
    items: [
      "Email luisgimenezdev@gmail.com with the approximate time of your chat, or the email address you left, and ask for it to be deleted.",
    ],
  },
  {
    h: "About this site",
    items: [
      "This is a personal site. Views are my own and do not represent The Home Depot.",
      "The chat is an AI assistant. AI-generated answers may be wrong.",
    ],
  },
];

export default function Privacy() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <header className="border-b border-hairline px-4 pb-12 pt-12 sm:px-8 sm:pt-16">
        <p className="eyebrow rise">Privacy</p>
        <h1 className="rise mt-5 max-w-4xl text-[clamp(40px,7vw,88px)] font-medium leading-[1.05] tracking-[-0.045em]" style={{ animationDelay: "60ms" }}>
          What this site collects.
        </h1>
        <p className="rise mt-6 max-w-xl text-[17px] leading-relaxed text-ink-soft" style={{ animationDelay: "120ms" }}>
          Written from what the code does. If you have a question, email luisgimenezdev@gmail.com.
        </p>
      </header>
      {SECTIONS.map((s, i) => (
        <section key={s.h} className="border-b border-hairline px-4 py-10 sm:px-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
          <h2 className="eyebrow">{String(i + 1).padStart(2, "0")} / {s.h}</h2>
          <ul className="mt-4 space-y-4 lg:mt-0">
            {s.items.map((t) => (
              <li key={t} className="max-w-3xl text-[17px] leading-relaxed">{t}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
