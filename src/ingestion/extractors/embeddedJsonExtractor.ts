import type { RawSourceItem } from "../types";
import { extractRegistryJson } from "./registryJsonExtractor";

export function extractEmbeddedJson(args: { sourceName: string; sourceUrl: string; body: string; marketplaceName?: string }): RawSourceItem[] {
  const matches = [...args.body.matchAll(/<script[^>]+(?:id=["']__NEXT_DATA__["']|type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)];
  const items: RawSourceItem[] = [];
  for (const match of matches) {
    try {
      items.push(...extractRegistryJson({ ...args, body: match[1] }));
    } catch {
      continue;
    }
  }
  return items.map((item) => ({ ...item, extractionMethod: "embedded_json", confidenceScore: Math.min(item.confidenceScore, 0.88) }));
}
