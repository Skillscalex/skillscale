export function extractSitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)].map((m) => m[1].trim()).filter(Boolean);
}
