import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const skillsHtml = await readFile("docs/skills.html", "utf8");
const authExample = JSON.parse(await readFile("docs/data/auth-config.example.json", "utf8"));
const catalog = JSON.parse(await readFile("docs/data/skills-catalog.json", "utf8"));
const manifest = JSON.parse(await readFile("docs/data/skills-index/manifest.json", "utf8"));

assert.match(skillsHtml, /AUTH_CONFIG_URL\s*=\s*'data\/auth-config\.json'/, "skills.html should load public Supabase config");
assert.match(skillsHtml, /public_skillsmp_occupation_counts/, "skills.html should read Supabase occupation counts view");
assert.match(skillsHtml, /public_skillsmp_skills/, "skills.html should read Supabase skills view");
assert.match(skillsHtml, /PAGES_CATALOG_URL\s*=\s*'data\/skills-catalog\.json'/, "skills.html should keep static catalog fallback");
assert.match(skillsHtml, /SKILLS_INDEX_URL\s*=\s*'data\/skills-index'/, "skills.html should keep static shard fallback");
assert.equal(typeof authExample.supabaseUrl, "string", "auth-config example documents Supabase URL");
assert.equal(typeof authExample.supabaseAnonKey, "string", "auth-config example documents anon key");
assert.ok(Array.isArray(catalog.skills) && catalog.skills.length > 0, "static fallback catalog should include skills");
assert.ok(Number(manifest.totalSkills) > 0, "static shard manifest should expose local total");
assert.ok(Number(manifest.upstreamTotal) >= Number(manifest.totalSkills), "manifest should distinguish upstream total from local fallback total");

console.log("ok - GitHub Pages skills shell has Supabase mirror and static fallback contracts");
