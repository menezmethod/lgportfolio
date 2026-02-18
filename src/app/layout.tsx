import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Luis Gimenez | GCP Cloud Architect & AI Engineer",
  description: "Portfolio of Luis Gimenez - Distributed Systems Architect & AI Engineer at The Home Depot. Specializing in high-throughput payment systems, Go microservices, and enterprise GCP architecture.",
  keywords: ["GCP", "Cloud Architect", "AI", "Payment Systems", "Go", "Distributed Systems", "TypeScript", "Home Depot"],
  authors: [{ name: "Luis Gimenez" }],
  openGraph: {
    title: "Luis Gimenez | GCP Cloud Architect & AI Engineer",
    description: "Portfolio showing distributed systems architecture, AI/ML integration, and mission-critical payment infrastructure expertise.",
    url: "https://gimenez.dev",
    siteName: "Luis Gimenez Portfolio",
    locale: "en_US",
    type: "website",
  },
};

import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#32c0f4] focus:text-black focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content">{children}</main>

        {/* Social Links - Global */}
        <div className="fixed left-6 bottom-0 hidden lg:flex flex-col gap-6 z-50">
          {[
            { href: 'https://github.com/menezmethod', icon: Github, label: 'GitHub' },
            { href: 'https://twitter.com/menezmethod', icon: Twitter, label: 'Twitter' },
            { href: 'https://www.linkedin.com/in/gimenezdev/', icon: Linkedin, label: 'LinkedIn' },
            { href: 'mailto:luisgimenezdev@gmail.com', icon: Mail, label: 'Email' },
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

        {/* Behavioral Patch: Sticky FAB for Mobile/Conversion */}
        <a
          href="/contact"
          className="fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10 inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000"
          aria-label="Connect now"
        >
          <Mail className="w-5 h-5" />
          <span className="hidden sm:inline">Connect</span>
        </a>
        <Analytics />
      </body>
    </html>
  );
}
