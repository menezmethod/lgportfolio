import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "War room",
  description:
    "Live telemetry from this site: request metrics, latency, and health, from in-app telemetry and structured logs, plus Prometheus when one is configured.",
  alternates: { canonical: "/war-room" },
  openGraph: { url: "/war-room" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
