import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || "true"];
  })
);

const inputPath = args.get("input");
const countsPath = args.get("counts") || "docs/data/occupation-counts.json";
const batchSize = Number(args.get("batch") || 1000);
const dryRun = args.get("dry-run") === "true";

if (!inputPath) {
  console.error("Usage: node scripts/import-skillsmp-mirror.mjs --input=skillsmp-export.jsonl [--counts=docs/data/occupation-counts.json] [--batch=1000] [--dry-run]");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or run with --dry-run.");
  process.exit(1);
}

const supabase = dryRun ? null : createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const occupationCounts = JSON.parse(await readFile(countsPath, "utf8"));
const occupations = occupationCounts.occupations.map((occupation) => ({
  id: String(occupation.id).padStart(2, "0"),
  soc_code: socCodeFor(occupation.id),
  label: occupation.label,
  indexed_count: Number(occupation.count || 0),
  mirrored_count: 0,
  source_url: occupation.sourceUrl,
  mirror_status: "running",
}));
const occupationIds = new Set(occupations.map((occupation) => occupation.id));
const localCounts = Object.fromEntries(occupations.map((occupation) => [occupation.id, 0]));

if (supabase) {
  await upsert("skillsmp_occupation_groups", occupations, "id");
}

let seen = 0;
let upserted = 0;
let batch = [];

for await (const rawSkill of readInput(inputPath)) {
  const row = normalizeSkill(rawSkill);
  if (!row) continue;
  seen += 1;
  batch.push(row);
  for (const occupationId of row.occupation_ids) localCounts[occupationId] = (localCounts[occupationId] ?? 0) + 1;
  if (batch.length >= batchSize) {
    upserted += await flush(batch);
    batch = [];
    console.log(JSON.stringify({ seen, upserted }));
  }
}
upserted += await flush(batch);

const updatedOccupations = occupations.map((occupation) => {
  const mirroredCount = localCounts[occupation.id] ?? 0;
  return {
    ...occupation,
    mirrored_count: mirroredCount,
    mirror_status: mirroredCount >= occupation.indexed_count ? "complete" : mirroredCount > 0 ? "partial" : "queued",
    last_mirrored_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
});

if (supabase) {
  await upsert("skillsmp_occupation_groups", updatedOccupations, "id");
}

console.log(JSON.stringify({
  dryRun,
  seen,
  upserted,
  occupations: updatedOccupations.map((occupation) => ({
    id: occupation.id,
    indexed: occupation.indexed_count,
    mirrored: occupation.mirrored_count,
    status: occupation.mirror_status,
  })),
}, null, 2));

async function flush(rows) {
  if (!rows.length) return 0;
  if (dryRun) return rows.length;
  await upsert("skillsmp_mirror_skills", rows, "id");
  return rows.length;
}

async function upsert(table, rows, onConflict) {
  for (let index = 0; index < rows.length; index += batchSize) {
    const chunk = rows.slice(index, index + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict });
    if (error) throw error;
  }
}

async function* readInput(filePath) {
  if (filePath.endsWith(".jsonl") || filePath.endsWith(".ndjson")) {
    const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      yield JSON.parse(trimmed);
    }
    return;
  }

  const parsed = JSON.parse(await readFile(filePath, "utf8"));
  if (Array.isArray(parsed)) {
    yield* parsed;
    return;
  }
  if (Array.isArray(parsed.skills)) {
    yield* parsed.skills;
    return;
  }
  throw new Error("Input must be JSONL, a JSON array, or an object with skills[].");
}

function normalizeSkill(raw) {
  const id = stringValue(raw.id) || stringValue(raw.slug) || slug(stringValue(raw.name) || stringValue(raw.title) || "");
  const name = stringValue(raw.name) || stringValue(raw.title) || id;
  if (!id || !name) return null;
  const occupationIds = normalizeOccupationIds(raw.occupationId || raw.occupation_id || raw.occupationIds || raw.occupation_ids || raw.occupations || raw.socMajorGroups);
  const primaryOccupationId = occupationIds[0] || "01";
  const rawPayload = raw.raw_payload || raw;
  return {
    id,
    name,
    skillsmp_url: stringValue(raw.skillsmpUrl) || stringValue(raw.skillsmp_url) || stringValue(raw.url),
    author: stringValue(raw.author) || stringValue(raw.authorName) || "community",
    author_url: stringValue(raw.authorUrl) || stringValue(raw.author_url),
    github_url: stringValue(raw.githubUrl) || stringValue(raw.github_url),
    date_modified: dateValue(raw.dateModified || raw.date_modified || raw.updatedAt || raw.updated_at),
    description: stringValue(raw.description) || stringValue(raw.summary) || "SkillsMP mirrored skill.",
    categories: stringArray(raw.categories),
    tags: stringArray(raw.tags),
    readme: stringValue(raw.readme),
    stars: numberValue(raw.stars || raw.starCount || raw.star_count),
    install_command: stringValue(raw.installCommand) || stringValue(raw.install_command),
    occupation_ids: occupationIds,
    primary_occupation_id: primaryOccupationId,
    similar_skills: stringArray(raw.similarSkills || raw.similar_skills),
    raw_payload: rawPayload,
    content_hash: hash(rawPayload),
    last_seen_at: new Date().toISOString(),
    source_updated_at: dateValue(raw.sourceUpdatedAt || raw.source_updated_at || raw.dateModified || raw.updatedAt),
  };
}

function normalizeOccupationIds(value) {
  const values = stringArray(value)
    .map((item) => {
      const twoDigit = item.match(/^(\d{2})$/)?.[1];
      if (twoDigit && occupationIds.has(twoDigit)) return twoDigit;
      const soc = item.match(/^(\d{2})-\d{4}$/)?.[1];
      return soc ? occupationIdForSocPrefix(soc) : undefined;
    })
    .filter(Boolean);
  return [...new Set(values)].sort();
}

function socCodeFor(id) {
  const map = {
    "01": "15-0000", "02": "13-0000", "03": "27-0000", "04": "43-0000", "05": "23-0000",
    "06": "19-0000", "07": "25-0000", "08": "11-0000", "09": "41-0000", "10": "17-0000",
    "11": "29-0000", "12": "39-0000", "13": "21-0000", "14": "55-0000", "15": "35-0000",
    "16": "53-0000", "17": "31-0000", "18": "33-0000", "19": "45-0000", "20": "47-0000",
    "21": "51-0000", "22": "49-0000", "23": "37-0000",
  };
  return map[String(id).padStart(2, "0")];
}

function occupationIdForSocPrefix(prefix) {
  const found = occupations.find((occupation) => occupation.soc_code?.startsWith(`${prefix}-`));
  return found?.id;
}

function stringValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function stringArray(value) {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function dateValue(value) {
  const text = stringValue(value);
  if (!text) return undefined;
  const millis = Date.parse(text);
  return Number.isFinite(millis) ? new Date(millis).toISOString() : undefined;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
