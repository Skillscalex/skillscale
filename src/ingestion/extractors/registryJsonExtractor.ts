import type { RawSourceItem } from "../types";

export function extractRegistryJson(args: {
  sourceName: string;
  sourceUrl: string;
  body: string;
  marketplaceName?: string;
}): RawSourceItem[] {
  const parsed = JSON.parse(args.body) as unknown;
  const records = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { items?: unknown[] }).items)
      ? (parsed as { items: unknown[] }).items
      : Array.isArray((parsed as { plugins?: unknown[] }).plugins)
        ? (parsed as { plugins: unknown[] }).plugins
        : Array.isArray((parsed as { agents?: unknown[] }).agents)
          ? (parsed as { agents: unknown[] }).agents
          : [parsed];

  return records
    .filter((record): record is Record<string, unknown> => Boolean(record && typeof record === "object"))
    .map((record) => ({
      sourceName: args.sourceName,
      sourceUrl: String(record.url ?? record.source_url ?? args.sourceUrl),
      canonicalUrl: String(record.canonical_url ?? record.url ?? args.sourceUrl),
      rawTitle: String(record.name ?? record.title ?? ""),
      rawDescription: String(record.description ?? ""),
      rawPayload: { marketplaceName: args.marketplaceName, ...record },
      extractionMethod: "registry",
      sourceUpdatedAt: typeof record.updated_at === "string" ? record.updated_at : undefined,
      confidenceScore: 0.94,
    }));
}
