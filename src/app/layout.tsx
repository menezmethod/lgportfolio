import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import PageViewTracker from "@/components/PageViewTracker";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

const sans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans-x",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-x",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gimenez.dev"),
  title: {
    default: "Luis Gimenez | Software engineer, platform and reliability",
    template: "%s | Luis Gimenez",
  },
  description:
    "Software engineer building Go services, telemetry, and release paths on GCP. About 5 years in enterprise payments and reliability.",
  openGraph: {
    title: "Luis Gimenez | Software engineer, platform and reliability",
    description:
      "Go, distributed systems, observability, GCP. Enterprise payments and production reliability at The Home Depot.",
    siteName: "gimenez.dev",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// Runs before paint: class on <html> follows the saved choice, else the system setting.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-foreground focus:px-4 focus:py-3 focus:text-background"
        >
          Skip to content
        </a>
        <SiteHeader />
        <PageViewTracker />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
