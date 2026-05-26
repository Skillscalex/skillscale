import type { ComponentType, NormalizedComponent, RawSourceItem } from "./types";

const TYPE_KEYWORDS: Array<[ComponentType, RegExp]> = [
  ["mcp_server", /\b(mcp|model context protocol)\b/i],
  ["lsp_server", /\b(lsp|language server)\b/i],
  ["slash_command", /\bslash command|\/[a-z0-9_-]+/i],
  ["command", /\bcommand\b/i],
  ["hook", /\bhook\b/i],
  ["subagent", /\bsub-?agent\b/i],
  ["agent", /\bagent\b/i],
  ["skill", /\bskill\b/i],
  ["plugin", /\bplugin\b/i],
  ["template", /\btemplate\b/i],
  ["theme", /\btheme\b/i],
  ["style", /\bstyle\b/i],
  ["workflow", /\bworkflow\b/i],
  ["settings", /\bsettings?\b/i],
  ["monitor", /\bmonitor\b/i],
  ["marketplace", /\bmarketplace|directory\b/i],
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "unknown";
}

export function classifyComponentType(input: {
  type?: unknown;
  category?: unknown;
  tags?: unknown;
  name?: unknown;
  description?: unknown;
  sourceUrl?: string;
}): ComponentType {
  const text = [
    input.type,
    input.category,
    Array.isArray(input.tags) ? input.tags.join(" ") : input.tags,
    input.name,
    input.description,
    input.sourceUrl,
  ]
    .filter(Boolean)
    .join(" ");

  for (const [type, pattern] of TYPE_KEYWORDS) {
    if (pattern.test(text)) return type;
  }
  return "unknown";
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[,|]/).map((v) => v.trim()).filter(Boolean);
  return [];
}

function asNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function normalizeGenericRawItem(raw: RawSourceItem, marketplaceName?: string): NormalizedComponent {
  const payload = raw.rawPayload;
  const name =
    asString(payload.name) ??
    asString(payload.title) ??
    raw.rawTitle ??
    new URL(raw.canonicalUrl ?? raw.sourceUrl).pathname.split("/").filter(Boolean).pop() ??
    "Unknown component";
  const description = asString(payload.description) ?? raw.rawDescription ?? "";
  const categories = asStringArray(payload.categories ?? payload.category);
  const tags = Array.from(new Set([...asStringArray(payload.tags), ...categories]));
  const componentType = classifyComponentType({
    type: payload.component_type ?? payload.type,
    category: payload.category ?? payload.categories,
    tags,
    name,
    description,
    sourceUrl: raw.sourceUrl,
  });
  const githubUrl = asString(payload.github_url ?? payload.githubUrl ?? payload.repo ?? payload.repository);
  const installCommand = asString(payload.install_command ?? payload.installCommand ?? payload.command);
  const authorName = asString(payload.author_name ?? payload.author ?? payload.owner);
  const slugBasis = githubUrl ?? installCommand ?? `${name}-${authorName ?? marketplaceName ?? raw.sourceName}-${componentType}`;

  return {
    canonicalSlug: slugify(slugBasis),
    name,
    description,
    longDescription: asString(payload.long_description ?? payload.readme ?? payload.content),
    componentType,
    categories,
    tags,
    authorName,
    authorUrl: asString(payload.author_url ?? payload.authorUrl),
    githubUrl,
    packageUrl: asString(payload.package_url ?? payload.packageUrl ?? payload.url),
    installCommand,
    marketplaceName,
    officialVerified: Boolean(payload.official_verified ?? payload.official ?? raw.sourceName.includes("official")),
    installCount: asNumber(payload.install_count ?? payload.downloads ?? payload.installs),
    starCount: asNumber(payload.star_count ?? payload.stars ?? payload.stargazers_count),
    license: asString(payload.license),
    riskFlags: asStringArray(payload.risk_flags),
    securityNotes: asString(payload.security_notes),
    compatibility: asStringArray(payload.compatibility),
    sourceUrls: Array.from(new Set([raw.canonicalUrl ?? raw.sourceUrl, raw.sourceUrl].filter(Boolean))),
    sourceUpdatedAt: raw.sourceUpdatedAt,
    provenance: [
      {
        sourceName: raw.sourceName,
        sourceUrl: raw.sourceUrl,
        extractionMethod: raw.extractionMethod,
        confidenceScore: raw.confidenceScore,
      },
    ],
  };
}
