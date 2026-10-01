import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat",
  description:
    "Ask an AI assistant about Luis's experience and projects. Answers come from his CV and notes, with retrieval on Cloudflare Vectorize and generation on Workers AI.",
  alternates: { canonical: "/chat" },
  openGraph: { url: "/chat" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
