import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MirrorQueueItem, SkillsIndexManifest, ShardRange } from "./skillShards";

export type MirrorShardJob = {
  readonly occupationId: string;
  readonly shardNumber: number;
  readonly shardPath: string;
};

export async function readSkillsIndexManifest(filePath = path.join(process.cwd(), "docs", "data", "skills-index", "manifest.json")): Promise<SkillsIndexManifest> {
  return JSON.parse(await readFile(filePath, "utf8")) as SkillsIndexManifest;
}

export function planMirrorShardJobs(manifest: SkillsIndexManifest, limit = 25): MirrorShardJob[] {
  const jobs: MirrorShardJob[] = [];
  const boundedLimit = Math.max(0, Math.floor(limit));
  for (const item of manifest.mirrorQueue ?? []) {
    for (const shardNumber of expandRanges(item.missingShardRanges)) {
      jobs.push({
        occupationId: item.occupationId,
        shardNumber,
        shardPath: `${item.occupationId}/page-${String(shardNumber).padStart(6, "0")}.json`,
      });
      if (jobs.length >= boundedLimit) return jobs;
    }
  }
  return jobs;
}

function* expandRanges(ranges: readonly ShardRange[]): Generator<number> {
  for (const range of ranges) {
    for (let shard = range.start; shard <= range.end; shard++) {
      yield shard;
    }
  }
}

export function summarizeMirrorQueue(manifest: SkillsIndexManifest) {
  return {
    totalSkills: manifest.totalSkills,
    upstreamTotal: manifest.upstreamTotal ?? manifest.totalSkills,
    shardSize: manifest.shardSize,
    projectedShardCount: manifest.projectedShardCount ?? manifest.groups.length,
    missingShardCount: manifest.missingShardCount ?? 0,
    queuedOccupationGroups: (manifest.mirrorQueue ?? []).length,
  };
}
