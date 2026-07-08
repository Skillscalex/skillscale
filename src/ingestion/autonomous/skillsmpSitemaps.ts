import type { PagesSkill } from "./pagesCatalog";

const SITEMAP_URLS = [
  "https://skillsmp.com/sitemaps/skills-popular.xml",
  "https://skillsmp.com/sitemaps/skills-discovered.xml",
] as const;

export async function fetchSkillsmpSitemapSkills(options: {
  readonly allowExternalFetch?: boolean;
  readonly generatedAt?: string;
} = {}): Promise<readonly PagesSkill[]> {
  if (!options.allowExternalFetch) return [];
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const pages = await Promise.all(
    SITEMAP_URLS.map(async (url) => {
      const response = await fetch(url, {
        headers: { "User-Agent": "SkillscaleBot/0.1 (+https://skillscalex.github.io/skillscale/)" },
      });
      if (!response.ok) throw new Error(`SkillsMP sitemap HTTP ${response.status}: ${url}`);
      return response.text();
    })
  );

  return parseSkillsmpSitemapSkills(pages, generatedAt);
}

export function parseSkillsmpSitemapSkills(pages: readonly string[], generatedAt = new Date().toISOString()): readonly PagesSkill[] {
  return dedupeSkills(
    pages
      .flatMap((xml) => extractLocs(xml))
      .filter((url) => url.includes("/creators/"))
      .map((url) => sitemapUrlToSkill(url, generatedAt))
  );
}

function extractLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => decodeXml(match[1]?.trim() ?? "")).filter(Boolean);
}

function sitemapUrlToSkill(url: string, generatedAt: string): PagesSkill {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  const creator = parts[1] ?? "community";
  const repo = parts[2] ?? "skill";
  const rawSkillSlug = parts.slice(3).join("-") || repo;
  const id = slugify(`skillsmp-${creator}-${repo}-${rawSkillSlug}`);
  const name = readableName(rawSkillSlug);
  const occupationId = classifyOccupation(`${creator} ${repo} ${rawSkillSlug}`);
  return {
    id,
    name: slugify(name),
    author: creator,
    stars: 0,
    description: `SkillsMP public sitemap skill from ${creator}/${repo}. Mirrored from the public SkillsMP sitemap for browsing and indexing.`,
    tags: Array.from(new Set(["skillsmp", "sitemap", ...tokenTags(repo), ...tokenTags(rawSkillSlug)])).slice(0, 8),
    updatedAt: epochSeconds(generatedAt),
    occupationId,
    skillsmpUrl: url,
    source: "skillsmp-sitemap",
    secureScore: 84,
    auditStatus: "needs_review",
  };
}

function classifyOccupation(text: string): string {
  const value = text.toLowerCase();
  if (/design|media|video|audio|music|image|creative|brand|content|writing|writer|ppt|slide|presentation|translation|game|artist|ux|ui/.test(value)) return "03";
  if (/finance|trading|invest|revenue|sales|business|marketing|market|crm|proposal/.test(value)) return "02";
  if (/legal|law|contract|compliance|policy/.test(value)) return "05";
  if (/education|lesson|teach|learn|quiz|academic|research|paper|science|lab/.test(value)) return "07";
  if (/health|medical|clinical|patient|fitness|wellness/.test(value)) return "11";
  if (/logistics|transport|route|warehouse|fleet/.test(value)) return "16";
  if (/construction|facility|maintenance|repair|field-service/.test(value)) return "22";
  if (/security|incident|threat|protect/.test(value)) return "18";
  return "01";
}

function dedupeSkills(skills: readonly PagesSkill[]): readonly PagesSkill[] {
  const byId = new Map<string, PagesSkill>();
  for (const skill of skills) byId.set(skill.id, skill);
  return [...byId.values()].sort((left, right) => left.occupationId.localeCompare(right.occupationId) || left.name.localeCompare(right.name));
}

function tokenTags(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !["skills", "skill", "claude", "agent"].includes(token))
    .slice(0, 4);
}

function readableName(value: string): string {
  return value
    .replace(/^skills?-?/i, "")
    .replace(/^agents?-skills?-?/i, "")
    .replace(/-?skill-md$/i, "")
    .replace(/-?skill$/i, "")
    .replace(/^-+|-+$/g, "") || "skillsmp-skill";
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function epochSeconds(value: string): string {
  const millis = Date.parse(value);
  return String(Math.floor((Number.isFinite(millis) ? millis : Date.now()) / 1000));
}

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
