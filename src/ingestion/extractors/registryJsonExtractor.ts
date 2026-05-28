import type { RawSourceItem } from "../types";

export function extractRegistryJson(args: {
  sourceName: string;
  sourceUrl: string;
  body: string;
  marketplaceName?: string;
}): RawSourceItem[] {
  const parsed = JSON.parse(args.body) as unknown;
  const registry = parsed as {
    items?: unknown[];
    plugins?: unknown[];
    agents?: unknown[];
    data?: { skills?: unknown[] };
  };
  const records = Array.isArray(parsed)
    ? parsed
    : Array.isArray(registry.items)
      ? registry.items
      : Array.isArray(registry.data?.skills)
        ? registry.data.skills
        : Array.isArray(registry.plugins)
          ? registry.plugins
          : Array.isArray(registry.agents)
            ? registry.agents
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
