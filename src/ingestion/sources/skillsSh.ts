import { normalizeGenericRawItem } from "../normalize";
import type { FetchResult, NormalizedComponent, RawSourceItem, SourceAdapter } from "../types";

type SkillsShPage = {
  data?: Array<Record<string, unknown>>;
  pagination?: {
    page?: number;
    perPage?: number;
    total?: number;
    hasMore?: boolean;
  };
};

const BASE_URL = "https://skills.sh";
const API_BASE_URL = `${BASE_URL}/api/v1/skills`;
const DEFAULT_PER_PAGE = 500;

function bearerToken(): string | undefined {
  return process.env.SKILLS_SH_BEARER_TOKEN ?? process.env.VERCEL_OIDC_TOKEN;
}

function maxPages(): number | undefined {
  const value = Number(process.env.SKILLS_SH_MAX_PAGES);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function authHeaders(): HeadersInit {
  const token = bearerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiUrl(page: number): string {
  const params = new URLSearchParams({
    view: "all-time",
    page: String(page),
    per_page: String(DEFAULT_PER_PAGE),
  });
  return `${API_BASE_URL}?${params.toString()}`;
}

async function fetchJsonPage(page: number): Promise<SkillsShPage> {
  const res = await fetch(apiUrl(page), { headers: authHeaders() });
  if (!res.ok) throw new Error(`skills.sh API failed with HTTP ${res.status}`);
  return (await res.json()) as SkillsShPage;
}

export class SkillsShSourceAdapter implements SourceAdapter {
  readonly sourceName = "skills.sh";
  readonly baseUrl = BASE_URL;
  readonly sourceType = "api" as const;
  readonly rateLimitConfig = { requestsPerMinute: 120 };
  readonly supportsIncrementalSync = true;

  async discoverUrls(): Promise<string[]> {
    if (!bearerToken()) return [BASE_URL];

    const firstPage = await fetchJsonPage(0);
    const total = firstPage.pagination?.total ?? firstPage.data?.length ?? 0;
    const perPage = firstPage.pagination?.perPage ?? DEFAULT_PER_PAGE;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const boundedPages = Math.min(pages, maxPages() ?? pages);
    return Array.from({ length: boundedPages }, (_, page) => apiUrl(page));
  }

  async fetchRaw(url: string): Promise<FetchResult> {
    const res = await fetch(url, {
      headers: url.startsWith(API_BASE_URL)
        ? authHeaders()
        : { "User-Agent": "SkillscaleBot/0.1 (+https://skillscale.local)" },
    });
    return { url, status: res.status, contentType: res.headers.get("content-type"), body: await res.text() };
  }

  async extractItems(raw: FetchResult): Promise<RawSourceItem[]> {
    if (raw.status >= 400) throw new Error(`Fetch failed with HTTP ${raw.status}`);
    if (raw.url.startsWith(API_BASE_URL)) {
      const page = JSON.parse(raw.body) as SkillsShPage;
      return (page.data ?? []).map((record) => ({
        sourceName: this.sourceName,
        sourceUrl: String(record.url ?? raw.url),
        canonicalUrl: String(record.url ?? raw.url),
        rawTitle: String(record.name ?? record.slug ?? ""),
        rawDescription: String(record.description ?? ""),
        rawPayload: {
          ...record,
          marketplaceName: "skills.sh",
          star_count: record.installs,
          install_count: record.installs,
          githubUrl: record.installUrl,
          github_url: record.installUrl,
          packageUrl: record.url,
          package_url: record.url,
          author: typeof record.source === "string" ? record.source.split("/")[0] : undefined,
          tags: ["agent-skill", "skills.sh", record.sourceType].filter(Boolean),
          categories: ["Agent Skills"],
          type: "skill",
        },
        extractionMethod: "api",
        confidenceScore: 0.97,
      }));
    }

    return extractSkillsShLeaderboard(raw);
  }

  async normalizeItem(item: RawSourceItem): Promise<NormalizedComponent> {
    return normalizeGenericRawItem(item, "skills.sh");
  }

  async getCheckpoint(): Promise<Record<string, unknown>> {
    return {};
  }

  async saveCheckpoint(): Promise<void> {}
}

export const skillsShAdapter = () => new SkillsShSourceAdapter();

function extractSkillsShLeaderboard(raw: FetchResult): RawSourceItem[] {
  const seen = new Set<string>();
  const items: RawSourceItem[] = [];
  const anchors = raw.body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  for (const match of anchors) {
    const href = match[1];
    const url = new URL(href, raw.url);
    if (url.hostname !== "www.skills.sh" && url.hostname !== "skills.sh") continue;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2 || parts.length > 3) continue;
    if (["docs", "topics", "official", "audits", "hot", "trending"].includes(parts[0])) continue;

    const slug = parts.at(-1);
    const source = parts.slice(0, -1).join("/");
    if (!slug || !source || seen.has(url.pathname)) continue;

    const text = stripTags(match[2]);
    const installs = parseInstallCount(text.match(/([\d.]+)\s*([KMB])?\s*$/i)?.[0]);
    seen.add(url.pathname);
    items.push({
      sourceName: "skills.sh",
      sourceUrl: url.toString(),
      canonicalUrl: url.toString(),
      rawTitle: readableName(slug),
      rawDescription: `skills.sh leaderboard skill from ${source}.`,
      rawPayload: {
        id: `${source}/${slug}`,
        slug,
        name: readableName(slug),
        description: `skills.sh leaderboard skill from ${source}.`,
        source,
        sourceType: source.includes(".") ? "well-known" : "github",
        marketplaceName: "skills.sh",
        installUrl: source.includes(".") ? `https://${source}` : `https://github.com/${source}`,
        url: url.toString(),
        installs,
        install_count: installs,
        star_count: installs,
        author: source.split("/")[0],
        categories: ["Agent Skills"],
        tags: ["agent-skill", "skills.sh"],
        type: "skill",
      },
      extractionMethod: "static_html",
      confidenceScore: 0.86,
    });
  }
  return items;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function readableName(slug: string): string {
  return slug.replace(/-/g, " ");
}

function parseInstallCount(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.trim().match(/^([\d.]+)\s*([KMB])?$/i);
  if (!match) return undefined;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return undefined;
  const multiplier = match[2]?.toUpperCase() === "B" ? 1_000_000_000 : match[2]?.toUpperCase() === "M" ? 1_000_000 : match[2]?.toUpperCase() === "K" ? 1_000 : 1;
  return Math.round(base * multiplier);
}
