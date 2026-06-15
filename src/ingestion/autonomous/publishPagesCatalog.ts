import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runIngestion } from "../index";
import { addLocalCoverage, buildOccupationCountsCatalog } from "./occupationCounts";
import { runAutonomousSkillLoop } from "./loop";
import { buildPagesSkillCatalog, readLocalStoreComponents, readSkillsmpShardComponents } from "./pagesCatalog";
import { publishSkillShards } from "./skillShards";

const outputPath = path.join(process.cwd(), "docs", "data", "skills-catalog.json");
const occupationCountsPath = path.join(process.cwd(), "docs", "data", "occupation-counts.json");
const skillsIndexPath = path.join(process.cwd(), "docs", "data", "skills-index");
const localStorePath = path.join(process.cwd(), ".ingestion-cache", "local-store.json");
const skillsmpCachePath = path.join(process.cwd(), ".ingestion-cache", "skillsmp");
const shouldIngestLive = process.argv.includes("--ingest-live");
const allowExternalFetch = process.argv.includes("--allow-external-fetch");

if (shouldIngestLive) {
  await runIngestion({
    dryRun: false,
    resume: process.argv.includes("--resume"),
  });
}

const run = await runAutonomousSkillLoop({
  allowExternalFetch,
  dryRun: !process.argv.includes("--live"),
});
const cacheComponents = [
  ...(await readLocalStoreComponents(localStorePath)),
  ...(await readSkillsmpShardComponents(skillsmpCachePath)),
];
const catalog = buildPagesSkillCatalog({ run, cacheComponents });
const occupationCounts = addLocalCoverage(await buildOccupationCountsCatalog({
  allowExternalFetch,
  fallbackPath: occupationCountsPath,
}), catalog.skills);
const skillsIndex = await publishSkillShards({
  outputDir: skillsIndexPath,
  skills: catalog.skills,
  occupationIds: occupationCounts.occupations.map((occupation) => occupation.id),
  upstreamTotals: Object.fromEntries(occupationCounts.occupations.map((occupation) => [occupation.id, occupation.count])),
  generatedAt: catalog.generatedAt,
});

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
await writeFile(occupationCountsPath, `${JSON.stringify(occupationCounts, null, 2)}\n`, "utf8");

console.log(`Published ${catalog.skills.length} skills to ${path.relative(process.cwd(), outputPath)}`);
console.log(`Published ${occupationCounts.occupations.length} occupation groups to ${path.relative(process.cwd(), occupationCountsPath)}`);
console.log(`Published ${skillsIndex.groups.length} skill shard groups to ${path.relative(process.cwd(), skillsIndexPath)}`);
