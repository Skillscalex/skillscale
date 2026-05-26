import type { RawSourceItem } from "../types";

export function extractMarkdownLinks(args: { sourceName: string; sourceUrl: string; body: string; marketplaceName?: string }): RawSourceItem[] {
  const rows = [...args.body.matchAll(/^\s*[-*]\s+\[([^\]]+)\]\((https?:\/\/[^)]+)\)\s*(?:[-:]\s*)?(.+)?$/gm)];
  return rows.map((row) => ({
    sourceName: args.sourceName,
    sourceUrl: row[2],
    canonicalUrl: row[2],
    rawTitle: row[1],
    rawDescription: row[3]?.trim() ?? "",
    rawPayload: {
      name: row[1],
      description: row[3]?.trim() ?? "",
      url: row[2],
      github_url: row[2].includes("github.com") ? row[2] : undefined,
      marketplaceName: args.marketplaceName,
    },
    extractionMethod: "github",
    confidenceScore: 0.82,
  }));
}
