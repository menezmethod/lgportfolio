import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Luis Gimenez | Systems Architect — Golang, GCP, Edge AI",
  description:
    "Systems Architect and Backend Engineer. GCP Certified Cloud Architect. I fix broken distributed systems, lead zero-downtime migrations, and build local AI pipelines on edge hardware.",
  keywords: [
    "Systems Architect",
    "GCP Cloud Architect",
    "Golang",
    "Edge AI",
    "Distributed Systems",
    "OpenTelemetry",
    "Payment Systems",
    "Backend Engineer",
    "Local RAG",
  ],
  authors: [{ name: "Luis Gimenez" }],
  openGraph: {
    title: "Luis Gimenez | Systems Architect — Golang, GCP, Edge AI",
    description:
      "I fix broken distributed systems and build local AI pipelines. GCP Certified Cloud Architect with production-scale payment infrastructure experience.",
    url: "https://gimenez.dev",
    siteName: "Luis Gimenez",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${jetbrainsMono.variable}`}>
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
              className="text-muted-foreground hover:text-primary transition-all hover:-translate-y-1"
              aria-label={social.label}
            >
              <social.icon className="w-6 h-6" />
            </a>
          ))}
          <div className="w-px h-24 bg-primary/20 mx-auto mt-2"></div>
        </div>

        <a
          href="/contact"
          className="fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000"
          aria-label="Connect now"
        >
          <Mail className="w-5 h-5" />
          <span className="hidden sm:inline">Connect</span>
        </a>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
