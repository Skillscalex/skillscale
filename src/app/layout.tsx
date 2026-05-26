import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
const geistMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Skillscale — AI Skills Marketplace",
  description:
    "Discover, buy, sell, and mint AI skills — tiered by gems, audited by agents, with live Polymarket-style pricing.",
  keywords: ["AI skills", "Claude Code", "plugins", "marketplace", "agentic"],
  openGraph: {
    title: "Skillscale",
    description: "The marketplace for Claude Code plugins.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf8f3",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full`}>
      <body
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-primary)",
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
