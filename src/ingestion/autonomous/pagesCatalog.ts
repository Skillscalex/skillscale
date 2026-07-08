import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z, ZodError } from "zod";
import { normalizeGenericRawItem, slugify } from "../normalize";
import type { RawSourceItem } from "../types";
import { buildMarketSeedSkills } from "./marketSeeds";
import type { AutonomousSkillCandidate, AutonomousSkillLoopRun } from "./types";

export type PagesSkillAuditStatus = "approved" | "needs_review" | "blocked";

export type PagesSkill = {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly stars: number;
  readonly description: string;
  readonly tags: readonly string[];
  readonly updatedAt: string;
  readonly occupationId: string;
  readonly githubUrl?: string;
  readonly source: string;
  readonly secureScore: number;
  readonly auditStatus: PagesSkillAuditStatus;
};

export type PagesSkillCatalog = {
  readonly generatedAt: string;
  readonly refreshSeconds: number;
  readonly mode: "live-fetch" | "governed-dry-run";
  readonly totalSkills: number;
  readonly scannerSummary: AutonomousSkillLoopRun["scannerSummary"];
  readonly sourceCoverage: AutonomousSkillLoopRun["sourceCoverage"];
  readonly governance: AutonomousSkillLoopRun["governance"];
  readonly strategy: readonly string[];
  readonly skills: readonly PagesSkill[];
};

export type BuildPagesSkillCatalogInput = {
  readonly run: AutonomousSkillLoopRun;
  readonly cacheComponents: readonly CacheSkillComponent[];
  readonly existingSkills?: readonly PagesSkill[];
  readonly generatedAt?: string;
};

const CacheComponentProvenanceSchema = z.object({
  sourceName: z.string(),
  sourceUrl: z.string().optional(),
  extractionMethod: z.string().optional(),
  confidenceScore: z.number().optional(),
  contentHash: z.string().optional(),
});

const CacheComponentSchema = z.object({
  canonicalSlug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default("Governed skill catalog entry."),
  longDescription: z.string().optional(),
  componentType: z.string().default("unknown"),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  authorName: z.string().optional(),
  authorUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  packageUrl: z.string().optional(),
  installCommand: z.string().optional(),
  installCount: z.number().optional(),
  license: z.string().optional(),
  lastSeenAt: z.string().optional(),
  marketplaceName: z.string().optional(),
  officialVerified: z.boolean().optional(),
  provenance: z.array(CacheComponentProvenanceSchema).optional(),
  riskFlags: z.array(z.string()).default([]),
  securityNotes: z.string().optional(),
  compatibility: z.array(z.string()).optional(),
  sourceUrls: z.array(z.string()).optional(),
  sourceUpdatedAt: z.string().optional(),
  starCount: z.number().optional(),
  updatedAt: z.string().optional(),
});

const LocalStoreSchema = z.object({
  components: z.array(z.unknown()).optional(),
  rawItems: z.array(z.unknown()).optional(),
});

export type CacheSkillComponent = z.infer<typeof CacheComponentSchema>;

const CREATED_SKILLS = [
  {
    id: "agentic-civilization-loop",
    name: "agentic-civilization-loop",
    author: "skillscale",
    stars: 512,
    description:
      "Sense-to-evolve agent civilization loop that preserves diversity, produces trusted deltas, governs simulated actions, and records memory karma.",
    tags: ["agentic", "civilization", "governance", "memory", "simulation"],
    updatedAt: epochSeconds("2026-06-08T00:00:00Z"),
    occupationId: "01",
    source: "skillscale",
    secureScore: 96,
    auditStatus: "approved",
  },
  {
    id: "autonomous-skill-harvester",
    name: "autonomous-skill-harvester",
    author: "skillscale",
    stars: 420,
    description:
      "Governed continuous skill discovery with SkillSpector-compatible scanning, dry-run defaults, and Agentic Civilization review before publication.",
    tags: ["agentic", "ingestion", "skillspector", "security", "scraping"],
    updatedAt: epochSeconds("2026-06-08T00:00:00Z"),
    occupationId: "01",
    source: "skillscale",
    secureScore: 97,
    auditStatus: "approved",
  },
] as const satisfies readonly PagesSkill[];

export function buildPagesSkillCatalog(input: BuildPagesSkillCatalogInput): PagesSkillCatalog {
  const cacheSkills = input.cacheComponents.map(componentToSkill);
  const loopSkills = input.run.candidates.map(loopCandidateToSkill);
  const marketSeedSkills = buildMarketSeedSkills();
  const skills = dedupeSkills([...CREATED_SKILLS, ...marketSeedSkills, ...(input.existingSkills ?? []), ...cacheSkills, ...loopSkills]);

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    refreshSeconds: 15,
    mode: input.run.externalExecution ? "live-fetch" : "governed-dry-run",
    totalSkills: skills.length,
    scannerSummary: input.run.scannerSummary,
    sourceCoverage: input.run.sourceCoverage,
    governance: input.run.governance,
    strategy: input.run.strategy,
    skills,
  };
}

export async function readLocalStoreComponents(localStorePath: string): Promise<readonly CacheSkillComponent[]> {
  try {
    return parseLocalStoreSkillComponents(JSON.parse(await readFile(localStorePath, "utf8")));
  } catch (error) {
    if (isExpectedCacheReadError(error)) return [];
    throw error;
  }
}

export function parseLocalStoreComponents(value: unknown): readonly CacheSkillComponent[] {
  return parseLocalStoreSkillComponents(value);
}

export function parseLocalStoreSkillComponents(value: unknown): readonly CacheSkillComponent[] {
  const store = LocalStoreSchema.parse(value);
  return dedupeComponents([
    ...(store.components ?? []).flatMap(cacheComponentFromUnknown),
    ...(store.rawItems ?? []).flatMap(rawItemToComponent),
  ]);
}

export async function readSkillsmpShardComponents(cacheDir: string): Promise<readonly CacheSkillComponent[]> {
  const skillsDir = path.join(cacheDir, "skills");
  try {
    const files = await listJsonFiles(skillsDir);
    const skills = await Promise.all(
      files.map(async (file) => parseSkillsmpShardSkill(JSON.parse(await readFile(file, "utf8"))))
    );
    return dedupeComponents(skills.filter((skill): skill is CacheSkillComponent => Boolean(skill)));
  } catch (error) {
    if (isExpectedCacheReadError(error)) return [];
    throw error;
  }
}

function componentToSkill(component: CacheSkillComponent): PagesSkill {
  const secureScore = scoreFromRiskFlags(component.riskFlags);
  const githubUrl = component.githubUrl;
  return {
    id: component.canonicalSlug,
    name: component.name,
    author: component.authorName ?? component.marketplaceName ?? "community",
    stars: component.starCount ?? component.installCount ?? 0,
    description: component.description,
    tags: Array.from(new Set([...component.tags, ...component.categories])).slice(0, 8),
    updatedAt: epochSeconds(component.lastSeenAt ?? component.updatedAt ?? component.sourceUpdatedAt ?? new Date().toISOString()),
    occupationId: classifyOccupation([...component.tags, ...component.categories, component.componentType]),
    ...(githubUrl ? { githubUrl } : {}),
    source: component.provenance?.[0]?.sourceName ?? component.marketplaceName ?? "ingestion-cache",
    secureScore,
    auditStatus: secureScore >= 85 ? "approved" : secureScore >= 65 ? "needs_review" : "blocked",
  };
}

function rawItemToComponent(value: unknown): CacheSkillComponent[] {
  const raw = value as Partial<RawSourceItem> | null;
  if (!raw || typeof raw !== "object") return [];
  if (!raw.rawPayload || typeof raw.rawPayload !== "object") return [];
  if (typeof raw.sourceName !== "string" || typeof raw.sourceUrl !== "string") return [];
  try {
    const normalized = normalizeGenericRawItem(raw as RawSourceItem, String((raw.rawPayload as Record<string, unknown>).marketplaceName ?? raw.sourceName));
    return CacheComponentSchema.safeParse(normalized).success ? [normalized as CacheSkillComponent] : [];
  } catch {
    return [];
  }
}

function cacheComponentFromUnknown(value: unknown): CacheSkillComponent[] {
  const parsed = CacheComponentSchema.safeParse(value);
  return parsed.success ? [parsed.data] : [];
}

function parseSkillsmpShardSkill(value: unknown): CacheSkillComponent | null {
  const skill = value as Record<string, unknown> | null;
  if (!skill || typeof skill !== "object") return null;
  const id = stringValue(skill.id) ?? stringValue(skill.name);
  const name = stringValue(skill.name) ?? id;
  if (!id || !name) return null;
  const categories = stringArray(skill.categories);
  const tags = Array.from(new Set([...stringArray(skill.tags), ...categories, "skillsmp", "agent-skill"]));
  return {
    canonicalSlug: slugify(`skillsmp-${id}`),
    name,
    description: stringValue(skill.description) ?? "SkillsMP agent skill.",
    longDescription: stringValue(skill.readme),
    componentType: "skill",
    categories,
    tags,
    authorName: stringValue(skill.author),
    authorUrl: stringValue(skill.authorUrl),
    githubUrl: stringValue(skill.githubUrl),
    installCommand: stringValue(skill.installCommand),
    marketplaceName: "SkillsMP",
    officialVerified: false,
    installCount: undefined,
    starCount: numberValue(skill.stars),
    license: undefined,
    riskFlags: [],
    compatibility: [],
    sourceUrls: [stringValue(skill.skillsmpUrl), stringValue(skill.githubUrl)].filter((url): url is string => Boolean(url)),
    sourceUpdatedAt: stringValue(skill.dateModified),
    updatedAt: stringValue(skill.scrapedAt) ?? stringValue(skill.dateModified),
    provenance: [
      {
        sourceName: "skillsmp",
        sourceUrl: stringValue(skill.skillsmpUrl) ?? stringValue(skill.githubUrl) ?? "https://skillsmp.com",
        extractionMethod: "api",
        confidenceScore: 0.98,
      },
    ],
  };
}

async function listJsonFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listJsonFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    })
  );
  return nested.flat();
}

function dedupeComponents(components: readonly CacheSkillComponent[]): readonly CacheSkillComponent[] {
  const bySlug = new Map<string, CacheSkillComponent>();
  for (const component of components) {
    const existing = bySlug.get(component.canonicalSlug);
    if (!existing || (component.starCount ?? component.installCount ?? 0) > (existing.starCount ?? existing.installCount ?? 0)) {
      bySlug.set(component.canonicalSlug, component);
    }
  }
  return [...bySlug.values()];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean) : [];
}

function numberValue(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function loopCandidateToSkill(candidate: AutonomousSkillCandidate): PagesSkill {
  const blocked = candidate.scan.recommendation === "block";
  return {
    id: candidate.id,
    name: candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    author: "agentic-loop",
    stars: candidate.scan.riskScore,
    description: `${candidate.description} Scanner recommendation: ${candidate.scan.recommendation}.`,
    tags: ["agentic", "harvested", "skillspector", candidate.scan.recommendation],
    updatedAt: epochSeconds(candidate.scan.scannedAt),
    occupationId: "01",
    source: candidate.sourceProfileId,
    secureScore: candidate.scan.riskScore,
    auditStatus: blocked ? "blocked" : candidate.scan.recommendation === "review" ? "needs_review" : "approved",
  };
}

function dedupeSkills(skills: readonly PagesSkill[]): readonly PagesSkill[] {
  const byId = new Map<string, PagesSkill>();
  const idByIdentity = new Map<string, string>();
  for (const skill of skills) {
    const identity = skillIdentity(skill);
    const key = idByIdentity.get(identity) ?? skill.id;
    const existing = byId.get(key);
    if (!existing || skill.stars > existing.stars || skill.secureScore > existing.secureScore) byId.set(key, skill);
    idByIdentity.set(identity, key);
  }
  return [...byId.values()].sort((left, right) => right.stars - left.stars || left.name.localeCompare(right.name));
}

function skillIdentity(skill: PagesSkill): string {
  const name = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (skill.githubUrl) return `${skill.source}:${skill.githubUrl.toLowerCase()}:${name}`;
  return `${skill.source}:${name}`;
}

function scoreFromRiskFlags(flags: readonly string[]): number {
  if (flags.some((flag) => flag.includes("skillspector:block"))) return 45;
  if (flags.some((flag) => flag.includes("skillspector:review"))) return 72;
  if (flags.length >= 3) return 68;
  if (flags.length >= 1) return 82;
  return 91;
}

function classifyOccupation(values: readonly string[]): string {
  const text = values.join(" ").toLowerCase();
  if (/legal|contract|compliance|law/.test(text)) return "08";
  if (/health|clinical|medical|patient/.test(text)) return "11";
  if (/finance|market|business|sales/.test(text)) return "02";
  if (/writing|copy|media|design|content|seo/.test(text)) return "03";
  if (/education|lesson|quiz|learning/.test(text)) return "05";
  if (/science|research|data|statistics|ai/.test(text)) return "06";
  if (/logistics|route|transport/.test(text)) return "16";
  return "01";
}

function epochSeconds(value: string): string {
  const millis = Date.parse(value);
  return String(Math.floor((Number.isFinite(millis) ? millis : Date.now()) / 1000));
}

type FileSystemError = Error & { readonly code: unknown };

function isExpectedCacheReadError(error: unknown): boolean {
  if (error instanceof SyntaxError || error instanceof ZodError) return true;
  return isFileSystemError(error) && error.code === "ENOENT";
}

function isFileSystemError(error: unknown): error is FileSystemError {
  return error instanceof Error && "code" in error;
}
