import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Luis Gimenez · SRE at The Home Depot",
  description:
    "Site reliability engineer at The Home Depot. I work on Home Services: reliability, observability, and incident response.",
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
          <Link href="/" className="text-lg font-semibold hover:text-primary transition-colors">
            LG
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/writing" className="text-muted-foreground hover:text-foreground transition-colors">
              Writing
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
