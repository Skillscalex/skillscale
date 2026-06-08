import { existsSync, mkdirSync } from "node:fs";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SkillIndexEntry, SkillsmpSkill } from "./types";

export const CACHE_DIR = path.join(process.cwd(), ".ingestion-cache", "skillsmp");
const SKILLS_DIR = path.join(CACHE_DIR, "skills");

export function skillShard(id: string): string {
  const normalized = id.toLowerCase().replace(/[^a-z0-9]/g, "_");
  return normalized.padEnd(2, "_").slice(0, 2);
}

export function skillFilePath(id: string): string {
  return path.join(SKILLS_DIR, skillShard(id), `${id}.json`);
}

export function skillFileExists(id: string): boolean {
  return existsSync(skillFilePath(id));
}

export async function saveSkill(skill: SkillsmpSkill): Promise<void> {
  const filePath = skillFilePath(skill.id);
  mkdirSync(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(skill, null, 2)}\n`, "utf8");
}

export async function loadSkill(id: string): Promise<SkillsmpSkill | null> {
  try {
    const body = await readFile(skillFilePath(id), "utf8");
    return JSON.parse(body) as SkillsmpSkill;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function appendIndex(skill: SkillsmpSkill): Promise<void> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const entry: SkillIndexEntry = {
    id: skill.id,
    name: skill.name,
    author: skill.author,
    description: skill.description,
    stars: skill.stars,
    categories: skill.categories,
    tags: skill.tags,
    githubUrl: skill.githubUrl,
    dateModified: skill.dateModified,
    scrapedAt: skill.scrapedAt,
    phase: skill.phase,
  };
  await appendFile(path.join(CACHE_DIR, "index.jsonl"), `${JSON.stringify(entry)}\n`, "utf8");
}
