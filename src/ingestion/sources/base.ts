import { normalizeGenericRawItem } from "../normalize";
import type { FetchResult, NormalizedComponent, RawSourceItem, SourceAdapter, SourceType } from "../types";
import { extractEmbeddedJson } from "../extractors/embeddedJsonExtractor";
import { extractRegistryJson } from "../extractors/registryJsonExtractor";
import { extractStaticHtml } from "../extractors/staticHtmlExtractor";
import { extractMarkdownLinks } from "../extractors/githubRepoExtractor";

export class GenericSourceAdapter implements SourceAdapter {
  private checkpoint: Record<string, unknown> = {};

  constructor(
    public readonly sourceName: string,
    public readonly baseUrl: string,
    public readonly sourceType: SourceType,
    private readonly urls: string[],
    public readonly rateLimitConfig = { requestsPerMinute: 20 },
    public readonly supportsIncrementalSync = true,
    private readonly marketplaceName = sourceName
  ) {}

  async discoverUrls(): Promise<string[]> {
    return this.urls.length ? this.urls : [this.baseUrl];
  }

  async fetchRaw(url: string): Promise<FetchResult> {
    const res = await fetch(url, { headers: { "User-Agent": "SkillscaleBot/0.1 (+https://skillscale.local)" } });
    return { url, status: res.status, contentType: res.headers.get("content-type"), body: await res.text() };
  }

  async extractItems(raw: FetchResult): Promise<RawSourceItem[]> {
    if (raw.status >= 400) throw new Error(`Fetch failed with HTTP ${raw.status}`);
    const contentType = raw.contentType ?? "";
    if (contentType.includes("json") || raw.body.trim().startsWith("{") || raw.body.trim().startsWith("[")) {
      return extractRegistryJson({ sourceName: this.sourceName, sourceUrl: raw.url, body: raw.body, marketplaceName: this.marketplaceName });
    }
    if (raw.url.includes("github.com") || raw.url.includes("raw.githubusercontent.com") || /^\s*#/.test(raw.body)) {
      const links = extractMarkdownLinks({ sourceName: this.sourceName, sourceUrl: raw.url, body: raw.body, marketplaceName: this.marketplaceName });
      if (links.length) return links;
    }
    const embedded = extractEmbeddedJson({ sourceName: this.sourceName, sourceUrl: raw.url, body: raw.body, marketplaceName: this.marketplaceName });
    if (embedded.length) return embedded;
    return extractStaticHtml({ sourceName: this.sourceName, sourceUrl: raw.url, body: raw.body, marketplaceName: this.marketplaceName });
  }

  async normalizeItem(item: RawSourceItem): Promise<NormalizedComponent> {
    return normalizeGenericRawItem(item, this.marketplaceName);
  }

  async getCheckpoint(): Promise<Record<string, unknown>> {
    return this.checkpoint;
  }

  async saveCheckpoint(checkpoint: Record<string, unknown>): Promise<void> {
    this.checkpoint = checkpoint;
  }
}
