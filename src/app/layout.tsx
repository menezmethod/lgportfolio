import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import "./globals.css";
import "highlight.js/styles/a11y-dark.css";
import Navbar from "@/components/Navbar";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import PageViewTracker from "@/components/PageViewTracker";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Luis Gimenez | Senior Platform Engineer — Go, GCP, Observability, Infrastructure",
  description:
    "Senior platform engineer building payment infrastructure at Fortune 50 scale. Go microservices, OpenTelemetry pipelines, and zero-downtime migrations. GCP Professional Cloud Architect. Tampa Bay / remote.",
  keywords: [
    "Senior Platform Engineer",
    "Go",
    "GCP",
    "Cloud Infrastructure",
    "Terraform",
    "Kubernetes",
    "Observability",
    "OpenTelemetry",
    "Distributed Systems",
    "Payment Systems",
    "Platform Engineering",
    "Infrastructure as Code",
  ],
  authors: [{ name: "Luis Gimenez" }],
  openGraph: {
    title: "Luis Gimenez | Senior Platform Engineer — Go, GCP, Observability, Infrastructure",
    description:
      "Senior platform engineer — Go, GCP, observability, and payment infrastructure. GCP-certified with production-scale payment systems experience at Fortune 50.",
    url: "https://gimenez.dev",
    siteName: "Luis Gimenez",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Luis Gimenez",
            jobTitle: "Senior Platform Engineer",
            description:
              "Senior platform engineer building payment infrastructure at Fortune 50 scale. Go microservices, OpenTelemetry pipelines, and zero-downtime migrations. GCP Professional Cloud Architect.",
            url: "https://gimenez.dev",
            sameAs: [
              "https://github.com/menezmethod",
              "https://www.linkedin.com/in/gimenezdev/",
              "https://twitter.com/menezmethod",
            ],
            knowsAbout: [
              "Go",
              "GCP",
              "Cloud Infrastructure",
              "Terraform",
              "Kubernetes",
              "OpenTelemetry",
              "Distributed Systems",
              "Payment Systems",
              "Platform Engineering",
            ],
          }),
        }}
      />
      <body className={`${plexSans.className} ${plexMono.variable}`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content">{children}</main>

        <div className="fixed left-6 bottom-0 hidden lg:flex flex-col gap-6 z-50">
          {[
            { href: "https://github.com/menezmethod", icon: Github, label: "GitHub" },
            { href: "https://twitter.com/menezmethod", icon: Twitter, label: "Twitter" },
            { href: "https://www.linkedin.com/in/gimenezdev/", icon: Linkedin, label: "LinkedIn" },
            { href: "mailto:luisgimenezdev@gmail.com", icon: Mail, label: "Email" },
          ].map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/60 hover:text-primary transition-all hover:-translate-y-1"
              aria-label={social.label}
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
          <div className="w-px h-24 bg-gradient-to-b from-primary/30 to-transparent mx-auto" />
        </div>

        <a
          href="/contact"
          className="fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-lg glow-primary hover:scale-105 transition-transform duration-200"
          aria-label="Connect now"
        >
          <Mail className="w-5 h-5" />
          <span className="hidden sm:inline">Connect</span>
        </a>
        <GoogleAnalytics />
        <PageViewTracker />
      </body>
    </html>
  );
}
