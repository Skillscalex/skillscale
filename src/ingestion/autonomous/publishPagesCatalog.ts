import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runAutonomousSkillLoop } from "./loop";
import { buildPagesSkillCatalog, readLocalStoreComponents } from "./pagesCatalog";

const outputPath = path.join(process.cwd(), "docs", "data", "skills-catalog.json");
const localStorePath = path.join(process.cwd(), ".ingestion-cache", "local-store.json");

const run = await runAutonomousSkillLoop({
  allowExternalFetch: process.argv.includes("--allow-external-fetch"),
  dryRun: !process.argv.includes("--live"),
});
const cacheComponents = await readLocalStoreComponents(localStorePath);
const catalog = buildPagesSkillCatalog({ run, cacheComponents });

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(`Published ${catalog.skills.length} skills to ${path.relative(process.cwd(), outputPath)}`);
