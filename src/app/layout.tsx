import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skillscale — AI Skills Marketplace",
  description:
    "Discover, buy, sell, and mint AI skills. Powered by Claude. Gem-tier quality scores. Polymarket-style live trading.",
  keywords: ["AI skills", "Claude plugins", "marketplace", "gems", "MCP"],
  openGraph: {
    title: "Skillscale",
    description: "The AI skills marketplace",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-screen flex flex-col bg-[#0a0a0f] text-[#f8f8ff]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
