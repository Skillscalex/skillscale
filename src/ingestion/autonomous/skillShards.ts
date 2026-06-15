import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PagesSkill } from "./pagesCatalog";

export type SkillsIndexManifest = {
  readonly generatedAt: string;
  readonly shardSize: number;
  readonly totalSkills: number;
  readonly upstreamTotal?: number;
  readonly projectedShardCount?: number;
  readonly missingShardCount?: number;
  readonly mirrorQueue?: readonly MirrorQueueItem[];
  readonly groups: readonly SkillGroupManifest[];
};

export type SkillGroupManifest = {
  readonly occupationId: string;
  readonly totalSkills: number;
  readonly upstreamTotal?: number;
  readonly shardSize: number;
  readonly shardCount: number;
  readonly projectedShardCount?: number;
  readonly missingShardRanges?: readonly ShardRange[];
  readonly nextMissingShard?: number;
  readonly shards: readonly string[];
};

export type ShardRange = {
  readonly start: number;
  readonly end: number;
};

export type MirrorQueueItem = {
  readonly occupationId: string;
  readonly nextMissingShard: number;
  readonly missingShardCount: number;
  readonly missingShardRanges: readonly ShardRange[];
};

export async function publishSkillShards(options: {
  readonly outputDir: string;
  readonly skills: readonly PagesSkill[];
  readonly occupationIds?: readonly string[];
  readonly upstreamTotals?: Readonly<Record<string, number>>;
  readonly generatedAt?: string;
  readonly shardSize?: number;
}): Promise<SkillsIndexManifest> {
  const shardSize = options.shardSize ?? 500;
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const groups = groupByOccupation(options.skills);
  const groupManifests: SkillGroupManifest[] = [];

  await rm(options.outputDir, { recursive: true, force: true });
  await mkdir(options.outputDir, { recursive: true });

  const occupationIds = Array.from(new Set([...(options.occupationIds ?? []), ...groups.keys()])).sort();
  for (const occupationId of occupationIds) {
    const skills = groups.get(occupationId) ?? [];
    const upstreamTotal = options.upstreamTotals?.[occupationId];
    const groupDir = path.join(options.outputDir, occupationId);
    await mkdir(groupDir, { recursive: true });
    const shards: string[] = [];
    for (let index = 0; index < skills.length; index += shardSize) {
      const shardSkills = skills.slice(index, index + shardSize);
      const shardName = `page-${String(shards.length + 1).padStart(6, "0")}.json`;
      shards.push(`${occupationId}/${shardName}`);
      await writeFile(path.join(groupDir, shardName), `${JSON.stringify({ generatedAt, occupationId, skills: shardSkills }, null, 2)}\n`, "utf8");
    }
    const manifest: SkillGroupManifest = {
      occupationId,
      totalSkills: skills.length,
      ...(Number.isFinite(upstreamTotal) ? { upstreamTotal } : {}),
      shardSize,
      shardCount: shards.length,
      ...(Number.isFinite(upstreamTotal) ? { projectedShardCount: Math.ceil(Number(upstreamTotal) / shardSize) } : {}),
      ...(Number.isFinite(upstreamTotal) ? missingShardFields(shards.length, Math.ceil(Number(upstreamTotal) / shardSize)) : {}),
      shards,
    };
    groupManifests.push(manifest);
    await writeFile(path.join(groupDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }

  const manifest: SkillsIndexManifest = {
    generatedAt,
    shardSize,
    totalSkills: options.skills.length,
    ...(options.upstreamTotals ? { upstreamTotal: sumValues(options.upstreamTotals) } : {}),
    ...(options.upstreamTotals ? { projectedShardCount: sumProjectedShards(options.upstreamTotals, shardSize) } : {}),
    ...(options.upstreamTotals ? { missingShardCount: sumMissingShards(groupManifests) } : {}),
    ...(options.upstreamTotals ? { mirrorQueue: buildMirrorQueue(groupManifests) } : {}),
    groups: groupManifests,
  };
  await writeFile(path.join(options.outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

function sumValues(values: Readonly<Record<string, number>>): number {
  return Object.values(values).reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

function sumProjectedShards(values: Readonly<Record<string, number>>, shardSize: number): number {
  return Object.values(values).reduce((sum, value) => sum + (Number.isFinite(value) ? Math.ceil(value / shardSize) : 0), 0);
}

function missingShardFields(shardCount: number, projectedShardCount: number): Pick<SkillGroupManifest, "missingShardRanges" | "nextMissingShard"> {
  if (shardCount >= projectedShardCount) return { missingShardRanges: [] };
  return {
    missingShardRanges: [{ start: shardCount + 1, end: projectedShardCount }],
    nextMissingShard: shardCount + 1,
  };
}

function sumMissingShards(groups: readonly SkillGroupManifest[]): number {
  return groups.reduce((sum, group) => sum + missingShardCount(group.missingShardRanges ?? []), 0);
}

function buildMirrorQueue(groups: readonly SkillGroupManifest[]): MirrorQueueItem[] {
  return groups
    .flatMap((group) => {
      const ranges = group.missingShardRanges ?? [];
      if (!group.nextMissingShard || ranges.length === 0) return [];
      return [{
        occupationId: group.occupationId,
        nextMissingShard: group.nextMissingShard,
        missingShardCount: missingShardCount(ranges),
        missingShardRanges: ranges,
      }];
    })
    .sort((left, right) => left.occupationId.localeCompare(right.occupationId));
}

function missingShardCount(ranges: readonly ShardRange[]): number {
  return ranges.reduce((sum, range) => sum + Math.max(0, range.end - range.start + 1), 0);
}

function groupByOccupation(skills: readonly PagesSkill[]): Map<string, PagesSkill[]> {
  const groups = new Map<string, PagesSkill[]>();
  for (const skill of skills) {
    const occupationId = skill.occupationId || "01";
    const existing = groups.get(occupationId) ?? [];
    existing.push(skill);
    groups.set(occupationId, existing);
  }
  for (const groupSkills of groups.values()) {
    groupSkills.sort((left, right) => right.stars - left.stars || left.name.localeCompare(right.name));
  }
  return groups;
}
