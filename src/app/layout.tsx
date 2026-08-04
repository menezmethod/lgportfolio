import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Luis Gimenez — SRE at The Home Depot",
  description:
    "Site Reliability Engineer. Reliability, observability, and incident response for Home Services at The Home Depot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <nav className="max-w-2xl mx-auto px-6 py-8 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold hover:text-primary transition-colors">
            LG
          </a>
          <div className="flex items-center gap-6 text-sm">
            <a href="/writing" className="text-muted-foreground hover:text-foreground transition-colors">
              Writing
            </a>
            <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
