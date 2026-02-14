import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Luis Gimenez | GCP Cloud Architect & AI Engineer",
  description: "Portfolio of Luis Gimenez - Software Engineer II at The Home Depot, GCP Professional Architect, specializing in enterprise payment systems, AI/ML, and cloud architecture.",
  keywords: ["GCP", "Cloud Architect", "AI", "Payment Systems", "Go", "Java", "TypeScript", "Portfolio"],
  authors: [{ name: "Luis Gimenez" }],
  openGraph: {
    title: "Luis Gimenez | GCP Cloud Architect & AI Engineer",
    description: "Portfolio showcasing enterprise payment systems, AI/ML integration, and cloud architecture expertise.",
    url: "https://gimenez.dev",
    siteName: "Luis Gimenez Portfolio",
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
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
