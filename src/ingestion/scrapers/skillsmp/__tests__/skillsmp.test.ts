import assert from "node:assert/strict";

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}:`, e);
    process.exitCode = 1;
  }
}

// ── Rate Limiter ─────────────────────────────────────────────────
import { TokenBucket } from "../rateLimit";

console.log("\nRate Limiter");

await test("acquires immediately when tokens available", async () => {
  const bucket = new TokenBucket(10, 3);
  const start = Date.now();
  await bucket.acquire();
  assert.ok(Date.now() - start < 50, "should be instant");
});

await test("throttles to ratePerSec", async () => {
  const bucket = new TokenBucket(10, 1); // 10/sec, burst 1
  await bucket.acquire(); // burns the 1 token
  const start = Date.now();
  await bucket.acquire(); // must wait ~100ms for 1 new token at 10/sec
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 80, `expected >=80ms wait, got ${elapsed}ms`);
});

await test("pause drains tokens and blocks acquire", async () => {
  const bucket = new TokenBucket(100, 3);
  const pauseMs = 200;
  const start = Date.now();
  const pausePromise = bucket.pause(pauseMs);
  // acquire should wait until pause is done
  await Promise.all([pausePromise, bucket.acquire()]);
  assert.ok(Date.now() - start >= pauseMs - 20);
});

// ── Storage ──────────────────────────────────────────────────────
import { skillShard, skillFilePath, skillFileExists, saveSkill, loadSkill, appendIndex, CACHE_DIR } from "../storage";
import type { SkillsmpSkill } from "../types";

const testSkill: SkillsmpSkill = {
  id: "test-author-repo-skills-foo-skill-md",
  name: "Foo Skill",
  skillsmpUrl: "https://skillsmp.com/skills/test-author-repo-skills-foo-skill-md",
  author: "test-author",
  authorUrl: "https://github.com/test-author",
  githubUrl: "https://github.com/test-author/repo",
  dateModified: "2026-01-01T00:00:00.000Z",
  description: "A test skill",
  categories: ["testing", "development"],
  tags: ["testing", "development", "foo"],
  readme: "# Foo\n\nDoes foo things.",
  stars: 42,
  installCommand: "",
  occupations: [],
  similarSkills: [],
  scrapedAt: "2026-06-05T00:00:00.000Z",
  phase: 1,
};

console.log("\nStorage");

await test("skillShard produces 2-char prefix", () => {
  assert.equal(skillShard("nikolaj-lat-foo"), "ni");
  assert.equal(skillShard("abc-skill"), "ab");
  assert.match(skillShard("-foo"), /^[a-z0-9_]{2}$/);
});

await test("skillFilePath has shard subdirectory", () => {
  const p = skillFilePath("nikolaj-lat-foo");
  assert.ok(p.includes("/skills/ni/nikolaj-lat-foo.json"));
});

await test("save and load round-trip", async () => {
  await saveSkill(testSkill);
  assert.ok(skillFileExists(testSkill.id));
  const loaded = await loadSkill(testSkill.id);
  assert.equal(loaded?.name, "Foo Skill");
  assert.equal(loaded?.stars, 42);
  const { unlink } = await import("node:fs/promises");
  await unlink(skillFilePath(testSkill.id)).catch(() => {});
});

await test("appendIndex writes valid JSONL", async () => {
  const path = await import("node:path");
  const { readFile, unlink } = await import("node:fs/promises");
  const indexPath = path.join(CACHE_DIR, "index.jsonl");
  await unlink(indexPath).catch(() => {});
  await appendIndex(testSkill);
  const line = (await readFile(indexPath, "utf8")).trim();
  const parsed = JSON.parse(line);
  assert.equal(parsed.id, testSkill.id);
  assert.equal(parsed.stars, 42);
  assert.equal(parsed.readme, undefined, "index must not contain readme");
  await unlink(indexPath).catch(() => {});
});
