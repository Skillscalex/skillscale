import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Providers } from "@/components/Providers";

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
  themeColor: "#f4fafc",
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
    <html
      lang="en"
      className="h-full"
      style={{
        "--font-inter": "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        "--font-mono": "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
      } as CSSProperties}
    >
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
