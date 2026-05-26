import type { RawSourceItem } from "../types";

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function attr(html: string, name: string): string | undefined {
  return html.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1];
}

export function extractStaticHtml(args: { sourceName: string; sourceUrl: string; body: string; marketplaceName?: string }): RawSourceItem[] {
  const cardMatches = [...args.body.matchAll(/<(?:article|li|div)[^>]+(?:data-component|class=["'][^"']*(?:card|plugin|agent|skill|template)[^"']*)[^>]*>([\s\S]*?)<\/(?:article|li|div)>/gi)];
  const blocks = cardMatches.length > 0 ? cardMatches.map((m) => m[0]) : [args.body];
  return blocks.map((block, index) => {
    const title = stripTags(block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1] ?? attr(block, "data-name") ?? "");
    const description =
      stripTags(block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? attr(block, "data-description") ?? "") ||
      stripTags(args.body.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? "");
    const href = block.match(/<a[^>]+href=["']([^"']+)["']/i)?.[1];
    const sourceUrl = href ? new URL(href, args.sourceUrl).toString() : args.sourceUrl;
    return {
      sourceName: args.sourceName,
      sourceUrl,
      canonicalUrl: sourceUrl,
      rawTitle: title || new URL(args.sourceUrl).hostname,
      rawDescription: description,
      rawPayload: {
        name: title,
        description,
        url: sourceUrl,
        marketplaceName: args.marketplaceName,
        index,
      },
      rawHtmlText: stripTags(block).slice(0, 10_000),
      extractionMethod: "static_html" as const,
      confidenceScore: title ? 0.72 : 0.45,
    };
  });
}
