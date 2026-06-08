import { readFile } from "node:fs/promises";
import { z, ZodError } from "zod";
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
  description: z.string().min(1),
  componentType: z.string().default("unknown"),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  authorName: z.string().optional(),
  githubUrl: z.string().optional(),
  installCount: z.number().optional(),
  lastSeenAt: z.string().optional(),
  marketplaceName: z.string().optional(),
  provenance: z.array(CacheComponentProvenanceSchema).optional(),
  riskFlags: z.array(z.string()).default([]),
  sourceUpdatedAt: z.string().optional(),
  starCount: z.number().optional(),
  updatedAt: z.string().optional(),
});

const LocalStoreSchema = z.object({
  components: z.array(CacheComponentSchema).optional(),
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
  const skills = dedupeSkills([...CREATED_SKILLS, ...cacheSkills, ...loopSkills]);

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
    return parseLocalStoreComponents(JSON.parse(await readFile(localStorePath, "utf8")));
  } catch (error) {
    if (isExpectedCacheReadError(error)) return [];
    throw error;
  }
}

export function parseLocalStoreComponents(value: unknown): readonly CacheSkillComponent[] {
  return LocalStoreSchema.parse(value).components ?? [];
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
  for (const skill of skills) {
    const existing = byId.get(skill.id);
    if (!existing || skill.secureScore > existing.secureScore) byId.set(skill.id, skill);
  }
  return [...byId.values()].sort((left, right) => right.stars - left.stars || left.name.localeCompare(right.name));
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
