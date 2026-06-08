# SkillsMP Full Scraper — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a continuous, resumable HTTP scraper that collects all 1.5M+ skills from skillsmp.com, storing each as a JSON file with README content, metadata, and GitHub info.

**Architecture:** Pure HTTP fetch (no browser) extracts JSON-LD + RSC stream chunks + meta tags from each skill page. A persistent JSONL queue tracks pending/done URLs. Three discovery sources feed the queue: sitemaps (10K), creator pages (5K), and category pages (50+).

**Tech Stack:** Node.js 24 native `fetch`, `jiti` for running TS, Node.js `assert` for tests, no new dependencies.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/ingestion/scrapers/skillsmp/types.ts` | Create | SkillsmpSkill, ScrapeProgress, SkillIndexEntry types |
| `src/ingestion/scrapers/skillsmp/rateLimit.ts` | Create | Token bucket: 1 req/sec with burst, pause on 429 |
| `src/ingestion/scrapers/skillsmp/storage.ts` | Create | Per-skill JSON files (sharded), JSONL index/failed, progress |
| `src/ingestion/scrapers/skillsmp/queue.ts` | Create | Persistent JSONL URL queue with in-memory dedup |
| `src/ingestion/scrapers/skillsmp/extractor.ts` | Create | JSON-LD + RSC stream + meta → SkillsmpSkill |
| `src/ingestion/scrapers/skillsmp/discovery.ts` | Create | Sitemap + creator + category URL discovery |
| `src/ingestion/scrapers/skillsmp/index.ts` | Create | SkillsmpScraper orchestrator |
| `src/ingestion/scrapers/skillsmp/__fixtures__/skill-detail.html` | Create | Realistic HTML fixture for extractor tests |
| `src/ingestion/scrapers/skillsmp/__fixtures__/creators-sitemap.xml` | Create | XML fixture for discovery tests |
| `src/ingestion/scrapers/skillsmp/__fixtures__/creator-page.html` | Create | Creator listing page fixture |
| `src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts` | Create | All tests: rate limiter, storage, queue, extractor, discovery |
| `scripts/scrape-skillsmp.ts` | Create | CLI entry point with all flags |
| `src/ingestion/sources/skillsmp.ts` | Modify | Delegate to SkillsmpScraper |
| `package.json` | Modify | Add `scrape:skillsmp` script |

---

## Task 1: Types

**Files:**
- Create: `src/ingestion/scrapers/skillsmp/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/ingestion/scrapers/skillsmp/types.ts

export interface SkillsmpSkill {
  id: string;
  name: string;
  skillsmpUrl: string;
  author: string;
  authorUrl: string;
  githubUrl: string;
  dateModified: string;
  description: string;
  categories: string[];
  tags: string[];
  readme: string;
  stars: number;
  installCommand: string;
  occupations: string[];
  similarSkills: string[];
  scrapedAt: string;
  phase: 1 | 2;
  parseError?: string;
}

export interface ScrapeProgress {
  phase: 1 | 2;
  discovered: number;
  completed: number;
  failed: number;
  retryQueue: number;
  startedAt: string;
  lastUpdate: string;
  ratePerMin: number;
  etaDays: number;
}

export interface SkillIndexEntry {
  id: string;
  name: string;
  author: string;
  description: string;
  stars: number;
  categories: string[];
  tags: string[];
  githubUrl: string;
  dateModified: string;
  scrapedAt: string;
  phase: 1 | 2;
}

export interface FailedEntry {
  url: string;
  id: string;
  error: string;
  attempts: number;
  lastAttempt: string;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ingestion/scrapers/skillsmp/types.ts
git commit -m "feat(skillsmp): add scraper types"
```

---

## Task 2: Rate Limiter

**Files:**
- Create: `src/ingestion/scrapers/skillsmp/rateLimit.ts`
- Test: `src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts` (first section)

- [ ] **Step 1: Write the failing test**

Create `src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test — expect failure**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | head -10
```
Expected: `Cannot find module '../rateLimit'`

- [ ] **Step 3: Implement rate limiter**

Create `src/ingestion/scrapers/skillsmp/rateLimit.ts`:

```typescript
// src/ingestion/scrapers/skillsmp/rateLimit.ts

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private paused = false;

  constructor(
    private readonly ratePerSec: number = 1,
    private readonly capacity: number = 3,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    while (true) {
      if (this.paused) {
        await sleep(50);
        continue;
      }
      const now = Date.now();
      const elapsed = now - this.lastRefill;
      this.tokens = Math.min(
        this.capacity,
        this.tokens + (elapsed / 1000) * this.ratePerSec,
      );
      this.lastRefill = now;

      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const waitMs = Math.ceil(((1 - this.tokens) / this.ratePerSec) * 1000);
      await sleep(Math.max(waitMs, 10));
    }
  }

  async pause(ms: number): Promise<void> {
    this.paused = true;
    this.tokens = 0;
    await sleep(ms);
    this.paused = false;
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Rate"
```
Expected:
```
Rate Limiter
  ✓ acquires immediately when tokens available
  ✓ throttles to ratePerSec
  ✓ pause drains tokens and blocks acquire
```

- [ ] **Step 5: Commit**

```bash
git add src/ingestion/scrapers/skillsmp/rateLimit.ts src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts
git commit -m "feat(skillsmp): add token bucket rate limiter"
```

---

## Task 3: Storage

**Files:**
- Create: `src/ingestion/scrapers/skillsmp/storage.ts`
- Modify: `src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts` (append storage tests)

- [ ] **Step 1: Append storage tests to the test file**

Add to end of `src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts`:

```typescript
// ── Storage ──────────────────────────────────────────────────────
import { skillShard, skillFilePath, skillFileExists, saveSkill, loadSkill, appendIndex } from "../storage";
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";
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
  // Non-alphanumeric start gets replaced
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
  // Cleanup
  const { unlink } = await import("node:fs/promises");
  await unlink(skillFilePath(testSkill.id)).catch(() => {});
});

await test("appendIndex writes valid JSONL", async () => {
  const path = await import("node:path");
  const { readFile, unlink } = await import("node:fs/promises");
  const { CACHE_DIR } = await import("../storage");
  const indexPath = path.join(CACHE_DIR, "index.jsonl");
  // Remove existing to test fresh append
  await unlink(indexPath).catch(() => {});
  await appendIndex(testSkill);
  const line = (await readFile(indexPath, "utf8")).trim();
  const parsed = JSON.parse(line);
  assert.equal(parsed.id, testSkill.id);
  assert.equal(parsed.stars, 42);
  assert.equal(parsed.readme, undefined, "index must not contain readme");
  // Cleanup
  await unlink(indexPath).catch(() => {});
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Storage|Cannot"
```
Expected: `Cannot find module '../storage'`

- [ ] **Step 3: Implement storage**

Create `src/ingestion/scrapers/skillsmp/storage.ts`:

```typescript
// src/ingestion/scrapers/skillsmp/storage.ts

import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import type { SkillsmpSkill, ScrapeProgress, SkillIndexEntry, FailedEntry } from "./types";

export const CACHE_DIR = path.join(process.cwd(), ".ingestion-cache", "skillsmp");

export function skillShard(id: string): string {
  const prefix = id.slice(0, 2).toLowerCase().replace(/[^a-z0-9]/g, "_");
  return prefix.length >= 2 ? prefix : (prefix + "_").slice(0, 2);
}

export function skillFilePath(id: string): string {
  return path.join(CACHE_DIR, "skills", skillShard(id), id + ".json");
}

export function skillFileExists(id: string): boolean {
  return existsSync(skillFilePath(id));
}

export async function saveSkill(skill: SkillsmpSkill): Promise<void> {
  const p = skillFilePath(skill.id);
  await mkdir(path.dirname(p), { recursive: true });
  await writeFile(p, JSON.stringify(skill, null, 2));
}

export async function loadSkill(id: string): Promise<SkillsmpSkill | null> {
  try {
    return JSON.parse(await readFile(skillFilePath(id), "utf8")) as SkillsmpSkill;
  } catch {
    return null;
  }
}

export async function appendIndex(skill: SkillsmpSkill): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
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
  await appendFile(path.join(CACHE_DIR, "index.jsonl"), JSON.stringify(entry) + "\n");
}

export async function appendFailed(entry: Omit<FailedEntry, "lastAttempt">): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const row: FailedEntry = { ...entry, lastAttempt: new Date().toISOString() };
  await appendFile(path.join(CACHE_DIR, "failed.jsonl"), JSON.stringify(row) + "\n");
}

export async function saveProgress(progress: ScrapeProgress): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(path.join(CACHE_DIR, "progress.json"), JSON.stringify(progress, null, 2));
}

export async function loadProgress(): Promise<ScrapeProgress | null> {
  try {
    return JSON.parse(
      await readFile(path.join(CACHE_DIR, "progress.json"), "utf8"),
    ) as ScrapeProgress;
  } catch {
    return null;
  }
}

export function diskFreeBytes(): number {
  try {
    const out = execSync(`df -B1 "${CACHE_DIR}" 2>/dev/null || df -B1 .`).toString();
    const lines = out.trim().split("\n");
    const parts = lines[lines.length - 1].trim().split(/\s+/);
    return parseInt(parts[3] ?? "0", 10);
  } catch {
    return Infinity;
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Storage"
```
Expected:
```
Storage
  ✓ skillShard produces 2-char prefix
  ✓ skillFilePath has shard subdirectory
  ✓ save and load round-trip
  ✓ appendIndex writes valid JSONL
```

- [ ] **Step 5: Commit**

```bash
git add src/ingestion/scrapers/skillsmp/storage.ts src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts
git commit -m "feat(skillsmp): add file-based storage layer"
```

---

## Task 4: Queue

**Files:**
- Create: `src/ingestion/scrapers/skillsmp/queue.ts`
- Modify: `src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts` (append queue tests)

- [ ] **Step 1: Append queue tests**

Add to end of `src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts`:

```typescript
// ── Queue ─────────────────────────────────────────────────────────
import { SkillsmpQueue, urlToId } from "../queue";
import { rm } from "node:fs/promises";
import path2 from "node:path";

console.log("\nQueue");

await test("urlToId extracts slug from skill URL", () => {
  assert.equal(
    urlToId("https://skillsmp.com/skills/foo-bar-baz"),
    "foo-bar-baz",
  );
  assert.equal(urlToId("https://skillsmp.com/other"), "");
  assert.equal(urlToId("bad-url"), "");
});

await test("enqueueBatch adds new URLs, skips duplicates", async () => {
  // Use isolated cache dir for this test
  const origEnv = process.env.SKILLSMP_CACHE_DIR;
  process.env.SKILLSMP_CACHE_DIR = path2.join(process.cwd(), ".ingestion-cache", "skillsmp-test-queue");
  const { SkillsmpQueue: Q } = await import("../queue");
  const q = new Q();
  await q.init();
  const urls = [
    "https://skillsmp.com/skills/alpha-skill",
    "https://skillsmp.com/skills/beta-skill",
    "https://skillsmp.com/skills/alpha-skill", // duplicate
  ];
  const n = await q.enqueueBatch(urls);
  assert.equal(n, 2, "should add 2 unique URLs");
  const n2 = await q.enqueueBatch(["https://skillsmp.com/skills/alpha-skill"]);
  assert.equal(n2, 0, "duplicate already in queue");
  // Cleanup
  await rm(process.env.SKILLSMP_CACHE_DIR, { recursive: true, force: true });
  process.env.SKILLSMP_CACHE_DIR = origEnv;
});

await test("drain yields queued URLs and respects completedSet", async () => {
  process.env.SKILLSMP_CACHE_DIR = path2.join(process.cwd(), ".ingestion-cache", "skillsmp-test-drain");
  const { SkillsmpQueue: Q2 } = await import("../queue");
  const q2 = new Q2();
  await q2.init();
  await q2.enqueueBatch([
    "https://skillsmp.com/skills/skill-one",
    "https://skillsmp.com/skills/skill-two",
    "https://skillsmp.com/skills/skill-three",
  ]);
  await q2.markComplete("skill-one");

  const drained: string[] = [];
  for await (const batch of q2.drain(10)) {
    drained.push(...batch);
  }
  assert.ok(!drained.includes("https://skillsmp.com/skills/skill-one"), "completed should be skipped");
  assert.ok(drained.includes("https://skillsmp.com/skills/skill-two"));
  assert.ok(drained.includes("https://skillsmp.com/skills/skill-three"));
  // Cleanup
  await rm(process.env.SKILLSMP_CACHE_DIR!, { recursive: true, force: true });
  delete process.env.SKILLSMP_CACHE_DIR;
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Queue|Cannot"
```
Expected: `Cannot find module '../queue'`

- [ ] **Step 3: Implement queue**

Create `src/ingestion/scrapers/skillsmp/queue.ts`:

```typescript
// src/ingestion/scrapers/skillsmp/queue.ts

import { appendFile, mkdir, readFile } from "node:fs/promises";
import { existsSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { skillFileExists } from "./storage";

function getCacheDir(): string {
  return (
    process.env.SKILLSMP_CACHE_DIR ??
    path.join(process.cwd(), ".ingestion-cache", "skillsmp")
  );
}

export function urlToId(url: string): string {
  const m = url.match(/\/skills\/([^/?#\s]+)/);
  return m ? m[1] : "";
}

export class SkillsmpQueue {
  private completedSet = new Set<string>();
  private enqueuedSet = new Set<string>();

  private get queueFile(): string {
    return path.join(getCacheDir(), "queue.jsonl");
  }
  private get completedFile(): string {
    return path.join(getCacheDir(), "completed.txt");
  }

  async init(): Promise<void> {
    const dir = getCacheDir();
    await mkdir(dir, { recursive: true });
    await mkdir(path.join(dir, "skills"), { recursive: true });

    if (existsSync(this.completedFile)) {
      const content = await readFile(this.completedFile, "utf8");
      for (const line of content.split("\n")) {
        const id = line.trim();
        if (id) this.completedSet.add(id);
      }
    }

    if (existsSync(this.queueFile)) {
      const content = await readFile(this.queueFile, "utf8");
      for (const line of content.split("\n")) {
        const id = urlToId(line.trim());
        if (id) this.enqueuedSet.add(id);
      }
    }
  }

  isCompleted(id: string): boolean {
    return this.completedSet.has(id) || skillFileExists(id);
  }

  async enqueueBatch(urls: string[]): Promise<number> {
    const toAdd = urls.filter((url) => {
      const id = urlToId(url);
      if (!id || this.completedSet.has(id) || this.enqueuedSet.has(id)) {
        return false;
      }
      this.enqueuedSet.add(id);
      return true;
    });
    if (toAdd.length === 0) return 0;
    await mkdir(getCacheDir(), { recursive: true });
    await appendFile(this.queueFile, toAdd.join("\n") + "\n");
    return toAdd.length;
  }

  async *drain(batchSize = 50): AsyncGenerator<string[]> {
    if (!existsSync(this.queueFile)) return;

    const rl = createInterface({
      input: createReadStream(this.queueFile),
      crlfDelay: Infinity,
    });

    let batch: string[] = [];
    for await (const line of rl) {
      const url = line.trim();
      if (!url) continue;
      const id = urlToId(url);
      if (!id || this.isCompleted(id)) continue;
      batch.push(url);
      if (batch.length >= batchSize) {
        yield batch;
        batch = [];
      }
    }
    if (batch.length > 0) yield batch;
  }

  async markComplete(id: string): Promise<void> {
    this.completedSet.add(id);
    await appendFile(this.completedFile, id + "\n");
  }

  get completedCount(): number {
    return this.completedSet.size;
  }
  get enqueuedCount(): number {
    return this.enqueuedSet.size;
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Queue"
```
Expected:
```
Queue
  ✓ urlToId extracts slug from skill URL
  ✓ enqueueBatch adds new URLs, skips duplicates
  ✓ drain yields queued URLs and respects completedSet
```

- [ ] **Step 5: Commit**

```bash
git add src/ingestion/scrapers/skillsmp/queue.ts src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts
git commit -m "feat(skillsmp): add persistent JSONL queue"
```

---

## Task 5: Fixtures + Extractor

**Files:**
- Create: `src/ingestion/scrapers/skillsmp/__fixtures__/skill-detail.html`
- Create: `src/ingestion/scrapers/skillsmp/extractor.ts`
- Modify: test file (append extractor tests)

- [ ] **Step 1: Create skill-detail HTML fixture**

Create `src/ingestion/scrapers/skillsmp/__fixtures__/skill-detail.html`:

```html
<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="keywords" content="gaming,rpg,development,abilities,schema">
<meta property="og:title" content="Abilities — SkillsMP">
<meta property="og:description" content="Schema and rules for creating abilities">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"SkillsMP","url":"https://skillsmp.com"}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Abilities","description":"Schema and rules for creating abilities","url":"https://skillsmp.com/skills/nikolaj-lat-world-puppeteer-claude-skills-abilities-skill-md","author":{"@type":"Person","name":"nikolaj-lat","url":"https://github.com/nikolaj-lat"},"codeRepository":"https://github.com/nikolaj-lat/World-Puppeteer/tree/main/.claude/skills/abilities","dateModified":"2026-06-04T02:28:16.000Z"}</script>
</head><body>
<a href="https://github.com/nikolaj-lat/World-Puppeteer">View on GitHub</a>
<span>42 stars</span>
<code>claude skill install nikolaj-lat/abilities</code>
<script>self.__next_f.push([1,"\n# Abilities\n\nEdit `tabs/abilities.json`.\n\n## Required Fields\n\n| Field | Requirement |\n|-------|-------------|\n| `name` | Must match object key exactly |"])</script>
</body></html>
```

- [ ] **Step 2: Append extractor tests**

Add to end of test file:

```typescript
// ── Extractor ────────────────────────────────────────────────────
import { extractSkill, extractReadme, slugToTitle } from "../extractor";
import { readFile as rf } from "node:fs/promises";
import path3 from "node:path";

const fixtureDir = path3.join(process.cwd(), "src/ingestion/scrapers/skillsmp/__fixtures__");
const skillHtml = await rf(path3.join(fixtureDir, "skill-detail.html"), "utf8");
const skillUrl = "https://skillsmp.com/skills/nikolaj-lat-world-puppeteer-claude-skills-abilities-skill-md";

console.log("\nExtractor");

await test("slugToTitle converts slug to title case", () => {
  assert.equal(slugToTitle("foo-bar-baz"), "Foo Bar Baz");
  assert.equal(slugToTitle("react-hooks"), "React Hooks");
});

await test("extractReadme pulls markdown from RSC stream chunks", () => {
  const readme = extractReadme(skillHtml);
  assert.ok(readme.includes("# Abilities"), `readme should contain h1, got: ${readme.slice(0, 100)}`);
  assert.ok(readme.includes("## Required Fields"), "readme should contain h2");
  assert.ok(readme.includes("abilities.json"), "readme should contain file reference");
});

await test("extractSkill pulls name from JSON-LD", () => {
  const skill = extractSkill(skillHtml, skillUrl);
  assert.equal(skill.name, "Abilities");
});

await test("extractSkill pulls author and githubUrl from JSON-LD", () => {
  const skill = extractSkill(skillHtml, skillUrl);
  assert.equal(skill.author, "nikolaj-lat");
  assert.equal(skill.authorUrl, "https://github.com/nikolaj-lat");
  assert.ok(skill.githubUrl.includes("github.com/nikolaj-lat"), `githubUrl: ${skill.githubUrl}`);
});

await test("extractSkill pulls categories from meta keywords", () => {
  const skill = extractSkill(skillHtml, skillUrl);
  assert.ok(skill.categories.includes("gaming"), `categories: ${JSON.stringify(skill.categories)}`);
  assert.ok(skill.tags.includes("rpg"), `tags: ${JSON.stringify(skill.tags)}`);
});

await test("extractSkill extracts stars from rendered HTML", () => {
  const skill = extractSkill(skillHtml, skillUrl);
  assert.equal(skill.stars, 42);
});

await test("extractSkill extracts install command from code block", () => {
  const skill = extractSkill(skillHtml, skillUrl);
  assert.ok(skill.installCommand.includes("nikolaj-lat/abilities"), `installCommand: ${skill.installCommand}`);
});

await test("extractSkill sets id from URL slug", () => {
  const skill = extractSkill(skillHtml, skillUrl);
  assert.equal(skill.id, "nikolaj-lat-world-puppeteer-claude-skills-abilities-skill-md");
});

await test("extractSkill falls back gracefully on empty HTML", () => {
  const skill = extractSkill("<html><head></head><body></body></html>", "https://skillsmp.com/skills/my-skill");
  assert.equal(skill.id, "my-skill");
  assert.ok(skill.name.length > 0, "should have fallback name");
  assert.equal(skill.stars, 0);
  assert.equal(skill.readme, "");
  assert.deepEqual(skill.categories, []);
});
```

- [ ] **Step 3: Run test — expect failure**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Extractor|Cannot"
```
Expected: `Cannot find module '../extractor'`

- [ ] **Step 4: Implement extractor**

Create `src/ingestion/scrapers/skillsmp/extractor.ts`:

```typescript
// src/ingestion/scrapers/skillsmp/extractor.ts

import type { SkillsmpSkill } from "./types";

export function urlToId(url: string): string {
  const m = url.match(/\/skills\/([^/?#\s]+)/);
  return m ? m[1] : "";
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Match meta tag regardless of attribute order
function metaContent(html: string, attr: string, value: string): string | undefined {
  // attr=value before content
  const re1 = new RegExp(
    `<meta[^>]+${attr}=["']${escapeRe(value)}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  // content before attr=value
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escapeRe(value)}["']`,
    "i",
  );
  return (html.match(re1) ?? html.match(re2))?.[1];
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Extract README markdown from Next.js App Router RSC stream
// Format: self.__next_f.push([1,"<js-escaped-string>"])
export function extractReadme(html: string): string {
  const chunks: string[] = [];
  // Capture JS string content — handles \" and \\ and \n etc.
  const rscRe = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;

  for (const match of html.matchAll(rscRe)) {
    let content: string;
    try {
      // JSON.parse interprets \n \t \" etc. as in JSON string
      content = JSON.parse(`"${match[1]}"`);
    } catch {
      continue;
    }
    // README chunks contain markdown headings and have meaningful length
    if (/\n#{1,3} /.test(content) && content.length > 60) {
      chunks.push(content);
    }
  }

  const seen = new Set<string>();
  return chunks
    .filter((c) => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    })
    .join("\n")
    .trim();
}

function extractStars(html: string): number {
  // "42 stars" pattern in text content or RSC data
  const m =
    html.match(/["'>](\d{1,6})\s*stars?["'<]/i) ??
    html.match(/stars[^>]*>(\d{1,6})/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (!isNaN(n)) return n;
  }
  return 0;
}

function extractInstallCommand(html: string): string {
  const codeRe = /<code[^>]*>([\s\S]*?)<\/code>/gi;
  for (const m of html.matchAll(codeRe)) {
    const text = m[1].replace(/<[^>]*>/g, "").trim();
    if (text.includes("skill install") || text.startsWith("claude ")) return text;
  }
  return "";
}

function extractGithubLink(html: string): string {
  const m = html.match(/href=["'](https:\/\/github\.com\/[^"'\s?#]+)["']/);
  return m?.[1] ?? "";
}

export function extractSkill(html: string, url: string): SkillsmpSkill {
  const id = urlToId(url);
  let parseError: string | undefined;

  // 1. JSON-LD — find SoftwareApplication block
  let jsonLd: Record<string, unknown> = {};
  try {
    const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    for (const m of html.matchAll(ldRe)) {
      const parsed = JSON.parse(m[1].trim()) as Record<string, unknown>;
      if (parsed?.["@type"] === "SoftwareApplication") {
        jsonLd = parsed;
        break;
      }
    }
  } catch (e) {
    parseError = `JSON-LD: ${(e as Error).message}`;
  }

  // 2. Meta tags
  const keywords = metaContent(html, "name", "keywords") ?? "";
  const ogTitle = metaContent(html, "property", "og:title") ?? "";
  const ogDesc = metaContent(html, "property", "og:description") ?? "";

  // 3. README from RSC stream
  let readme = "";
  try {
    readme = extractReadme(html);
  } catch (e) {
    parseError = `README: ${(e as Error).message}`;
  }

  // 4. Engagement
  const stars = extractStars(html);
  const installCommand = extractInstallCommand(html);

  // Assemble with fallback chain
  const name =
    (jsonLd.name as string) ||
    ogTitle.replace(/ ?[—–\-].*$/, "").trim() ||
    slugToTitle(id);
  const description =
    (jsonLd.description as string) ||
    ogDesc ||
    readme.slice(0, 200).replace(/\n/g, " ").trim();
  const authorObj = jsonLd.author as Record<string, string> | undefined;
  const author = authorObj?.name ?? "";
  const authorUrl = authorObj?.url ?? "";
  const githubUrl = (jsonLd.codeRepository as string) || extractGithubLink(html);
  const dateModified = (jsonLd.dateModified as string) ?? "";

  const kwList = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const skill: SkillsmpSkill = {
    id,
    name,
    skillsmpUrl: url,
    author,
    authorUrl,
    githubUrl,
    dateModified,
    description,
    categories: kwList.slice(0, 6),
    tags: kwList,
    readme,
    stars,
    installCommand,
    occupations: [],
    similarSkills: [],
    scrapedAt: new Date().toISOString(),
    phase: 1,
  };
  if (parseError) skill.parseError = parseError;
  return skill;
}

export async function fetchSkillPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "SkillscaleBot/1.0 (+https://skillscale.ai)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const err = Object.assign(new Error(`HTTP ${res.status}`), {
      status: res.status,
      retryAfter: res.status === 429
        ? parseInt(res.headers.get("retry-after") ?? "60", 10)
        : undefined,
    });
    throw err;
  }
  return res.text();
}
```

- [ ] **Step 5: Run test — expect pass**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Extractor"
```
Expected:
```
Extractor
  ✓ slugToTitle converts slug to title case
  ✓ extractReadme pulls markdown from RSC stream chunks
  ✓ extractSkill pulls name from JSON-LD
  ✓ extractSkill pulls author and githubUrl from JSON-LD
  ✓ extractSkill pulls categories from meta keywords
  ✓ extractSkill extracts stars from rendered HTML
  ✓ extractSkill extracts install command from code block
  ✓ extractSkill sets id from URL slug
  ✓ extractSkill falls back gracefully on empty HTML
```

- [ ] **Step 6: Commit**

```bash
git add src/ingestion/scrapers/skillsmp/__fixtures__/skill-detail.html src/ingestion/scrapers/skillsmp/extractor.ts src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts
git commit -m "feat(skillsmp): add HTML extractor with JSON-LD + RSC stream parsing"
```

---

## Task 6: Fixtures + Discovery

**Files:**
- Create: `src/ingestion/scrapers/skillsmp/__fixtures__/creators-sitemap.xml`
- Create: `src/ingestion/scrapers/skillsmp/__fixtures__/creator-page.html`
- Create: `src/ingestion/scrapers/skillsmp/discovery.ts`
- Modify: test file (append discovery tests)

- [ ] **Step 1: Create XML fixture**

Create `src/ingestion/scrapers/skillsmp/__fixtures__/creators-sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://skillsmp.com/creators/alice-dev</loc></url>
  <url><loc>https://skillsmp.com/creators/bob-hacker</loc></url>
  <url><loc>https://skillsmp.com/creators/carol-coder</loc></url>
</urlset>
```

- [ ] **Step 2: Create creator page fixture**

Create `src/ingestion/scrapers/skillsmp/__fixtures__/creator-page.html`:

```html
<!DOCTYPE html><html><body>
<a href="/skills/alice-skill-one-md">Skill One</a>
<a href="/skills/alice-skill-two-md">Skill Two</a>
<a href="/skills/alice-skill-three-md">Skill Three</a>
<a href="/about">About</a>
<a href="https://github.com/alice">GitHub Profile</a>
</body></html>
```

- [ ] **Step 3: Append discovery tests**

Add to end of test file:

```typescript
// ── Discovery ────────────────────────────────────────────────────
import { extractLocUrls, extractSkillUrls } from "../discovery";
import path4 from "node:path";
import { readFile as rf2 } from "node:fs/promises";

const fixtureDir2 = path4.join(process.cwd(), "src/ingestion/scrapers/skillsmp/__fixtures__");

console.log("\nDiscovery");

await test("extractLocUrls parses XML sitemap URLs", async () => {
  const xml = await rf2(path4.join(fixtureDir2, "creators-sitemap.xml"), "utf8");
  const urls = extractLocUrls(xml);
  assert.equal(urls.length, 3);
  assert.ok(urls.includes("https://skillsmp.com/creators/alice-dev"));
  assert.ok(urls.includes("https://skillsmp.com/creators/carol-coder"));
});

await test("extractSkillUrls extracts /skills/ hrefs only", async () => {
  const html = await rf2(path4.join(fixtureDir2, "creator-page.html"), "utf8");
  const urls = extractSkillUrls(html);
  assert.equal(urls.length, 3);
  assert.ok(urls.every(u => u.startsWith("https://skillsmp.com/skills/")));
  assert.ok(!urls.some(u => u.includes("/about") || u.includes("github.com")));
});

await test("extractSkillUrls deduplicates identical hrefs", async () => {
  const html = `<a href="/skills/foo-skill">x</a><a href="/skills/foo-skill">y</a>`;
  const urls = extractSkillUrls(html);
  assert.equal(urls.length, 1);
});
```

- [ ] **Step 4: Run test — expect failure**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Discovery|Cannot"
```
Expected: `Cannot find module '../discovery'`

- [ ] **Step 5: Implement discovery**

Create `src/ingestion/scrapers/skillsmp/discovery.ts`:

```typescript
// src/ingestion/scrapers/skillsmp/discovery.ts

import type { TokenBucket } from "./rateLimit";

const UA = "SkillscaleBot/1.0 (+https://skillscale.ai)";

export const SITEMAPS = {
  skillsRecent: "https://skillsmp.com/sitemaps/skills-recent.xml",
  creators: "https://skillsmp.com/sitemaps/creators.xml",
  occupations: "https://skillsmp.com/sitemaps/occupations.xml",
  pages: "https://skillsmp.com/sitemaps/pages.xml",
};

export function extractLocUrls(xml: string): string[] {
  return Array.from(
    xml.matchAll(/<loc>(https?:\/\/[^<\s]+)<\/loc>/g),
    (m) => m[1].trim(),
  );
}

export function extractSkillUrls(html: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  for (const m of html.matchAll(/href="(\/skills\/[^"?#\s]+)"/g)) {
    const url = `https://skillsmp.com${m[1]}`;
    if (!seen.has(url)) {
      seen.add(url);
      results.push(url);
    }
  }
  return results;
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export async function discoverFromSitemaps(): Promise<string[]> {
  const xml = await fetchText(SITEMAPS.skillsRecent);
  return extractLocUrls(xml).filter((u) => u.includes("/skills/"));
}

export async function discoverFromCreators(
  limiter: TokenBucket,
  onBatch: (urls: string[]) => Promise<void>,
): Promise<number> {
  const xml = await fetchText(SITEMAPS.creators);
  const creatorUrls = extractLocUrls(xml);
  let total = 0;
  const CONCURRENCY = 10;

  for (let i = 0; i < creatorUrls.length; i += CONCURRENCY) {
    const batch = creatorUrls.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        await limiter.acquire();
        const html = await fetchText(url);
        return extractSkillUrls(html);
      }),
    );

    const urls: string[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") urls.push(...r.value);
    }
    if (urls.length > 0) {
      await onBatch(urls);
      total += urls.length;
    }

    if (i % (CONCURRENCY * 50) === 0 && i > 0) {
      console.log(
        `  Discovery: ${i + batch.length}/${creatorUrls.length} creator pages | ${total} skills found`,
      );
    }
  }
  return total;
}

export async function discoverFromCategories(
  limiter: TokenBucket,
  onBatch: (urls: string[]) => Promise<void>,
): Promise<number> {
  const xml = await fetchText(SITEMAPS.pages);
  const categoryUrls = extractLocUrls(xml).filter((u) => u.includes("/categories/"));
  let total = 0;

  for (const catUrl of categoryUrls) {
    let page = 1;
    while (true) {
      try {
        await limiter.acquire();
        const html = await fetchText(`${catUrl}?page=${page}`);
        const urls = extractSkillUrls(html);
        if (urls.length === 0) break;
        await onBatch(urls);
        total += urls.length;
        page++;
      } catch {
        break;
      }
    }
  }
  return total;
}
```

- [ ] **Step 6: Run test — expect pass**

```bash
jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts 2>&1 | grep -E "✓|✗|Discovery"
```
Expected:
```
Discovery
  ✓ extractLocUrls parses XML sitemap URLs
  ✓ extractSkillUrls extracts /skills/ hrefs only
  ✓ extractSkillUrls deduplicates identical hrefs
```

- [ ] **Step 7: Commit**

```bash
git add src/ingestion/scrapers/skillsmp/__fixtures__/ src/ingestion/scrapers/skillsmp/discovery.ts src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts
git commit -m "feat(skillsmp): add URL discovery from sitemaps, creators, categories"
```

---

## Task 7: Orchestrator

**Files:**
- Create: `src/ingestion/scrapers/skillsmp/index.ts`

No new tests — integration is verified in Task 8 by running the CLI.

- [ ] **Step 1: Implement orchestrator**

Create `src/ingestion/scrapers/skillsmp/index.ts`:

```typescript
// src/ingestion/scrapers/skillsmp/index.ts

import { TokenBucket } from "./rateLimit";
import { SkillsmpQueue, urlToId } from "./queue";
import {
  saveSkill,
  appendIndex,
  appendFailed,
  saveProgress,
  loadProgress,
  diskFreeBytes,
  CACHE_DIR,
} from "./storage";
import { extractSkill, fetchSkillPage } from "./extractor";
import {
  discoverFromSitemaps,
  discoverFromCreators,
  discoverFromCategories,
} from "./discovery";
import type { ScrapeProgress } from "./types";
import { mkdir } from "node:fs/promises";

const MIN_FREE_BYTES = 1_000_000_000; // 1 GB

export class SkillsmpScraper {
  private limiter: TokenBucket;
  private discoveryLimiter: TokenBucket;
  private queue: SkillsmpQueue;
  private progress: ScrapeProgress;
  private stopRequested = false;

  constructor(ratePerSec = 1) {
    this.limiter = new TokenBucket(ratePerSec, 3);
    this.discoveryLimiter = new TokenBucket(10, 10);
    this.queue = new SkillsmpQueue();
    this.progress = {
      phase: 1,
      discovered: 0,
      completed: 0,
      failed: 0,
      retryQueue: 0,
      startedAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      ratePerMin: 0,
      etaDays: 0,
    };
  }

  async init(): Promise<void> {
    await mkdir(CACHE_DIR, { recursive: true });
    await this.queue.init();
    const saved = await loadProgress();
    if (saved) {
      this.progress = { ...saved, lastUpdate: new Date().toISOString() };
      console.log(`\nResuming: ${this.progress.completed.toLocaleString()} done, ${this.progress.failed} failed`);
    }
  }

  async discover(): Promise<void> {
    console.log("\n── Discovery ─────────────────────────────────────");

    const sitemapUrls = await discoverFromSitemaps();
    const n1 = await this.queue.enqueueBatch(sitemapUrls);
    console.log(`skills-recent.xml: ${n1} URLs enqueued`);

    console.log("Scanning creator pages (10 concurrent)…");
    let n2 = 0;
    n2 = await discoverFromCreators(this.discoveryLimiter, async (urls) => {
      await this.queue.enqueueBatch(urls);
    });
    console.log(`Creator pages: ${n2} skill URLs`);

    console.log("Scanning category pages…");
    let n3 = 0;
    n3 = await discoverFromCategories(this.discoveryLimiter, async (urls) => {
      await this.queue.enqueueBatch(urls);
    });
    console.log(`Category pages: ${n3} skill URLs`);

    this.progress.discovered = this.queue.enqueuedCount;
    await saveProgress(this.progress);
    console.log(`\nTotal discovered: ${this.progress.discovered.toLocaleString()} skills`);
  }

  async scrape(): Promise<void> {
    console.log("\n── Scraping ──────────────────────────────────────");
    const sessionStart = Date.now();
    let sessionCount = 0;

    outer: for await (const batch of this.queue.drain(50)) {
      if (this.stopRequested) break;

      for (const url of batch) {
        if (this.stopRequested) break outer;

        const id = urlToId(url);
        if (!id || this.queue.isCompleted(id)) continue;

        await this.scrapeOne(url, id);
        sessionCount++;

        if (sessionCount % 100 === 0) {
          const elapsedSec = (Date.now() - sessionStart) / 1000;
          this.progress.ratePerMin = (sessionCount / elapsedSec) * 60;
          const remaining = Math.max(0, this.progress.discovered - this.progress.completed);
          this.progress.etaDays =
            remaining / Math.max(1, this.progress.ratePerMin * 60 * 24);
          this.progress.lastUpdate = new Date().toISOString();
          await saveProgress(this.progress);
          console.log(
            `✓ ${this.progress.completed.toLocaleString()} done` +
            ` | ${this.progress.ratePerMin.toFixed(1)}/min` +
            ` | ETA ${this.progress.etaDays.toFixed(1)}d` +
            ` | failed ${this.progress.failed}`,
          );

          const free = diskFreeBytes();
          if (free < MIN_FREE_BYTES) {
            console.warn(`⚠ Low disk space (${(free / 1e9).toFixed(2)} GB). Pausing.`);
            this.stopRequested = true;
            break outer;
          }
        }
      }
    }

    await this.flush();
    console.log(`\nSession complete. ${sessionCount} skills scraped this run.`);
  }

  private async scrapeOne(url: string, id: string, attempt = 1): Promise<void> {
    try {
      await this.limiter.acquire();
      const html = await fetchSkillPage(url);
      const skill = extractSkill(html, url);
      await saveSkill(skill);
      await appendIndex(skill);
      await this.queue.markComplete(id);
      this.progress.completed++;
    } catch (err) {
      const e = err as { status?: number; retryAfter?: number; message?: string };

      if (e.status === 429) {
        const wait = (e.retryAfter ?? 60) * 1000;
        console.log(`Rate limited — pausing ${wait / 1000}s`);
        await this.limiter.pause(wait);
        if (attempt < 3) return this.scrapeOne(url, id, attempt + 1);
      } else if (e.status === 404) {
        await appendFailed({ url, id, error: "HTTP 404", attempts: attempt });
        this.progress.failed++;
        return;
      } else if (attempt < 3) {
        const delays = [5_000, 10_000, 30_000];
        await new Promise((r) => setTimeout(r, delays[attempt - 1]));
        return this.scrapeOne(url, id, attempt + 1);
      } else {
        await appendFailed({
          url,
          id,
          error: String(e.message ?? e),
          attempts: attempt,
        });
        this.progress.failed++;
      }
    }
  }

  stop(): void {
    this.stopRequested = true;
  }

  async flush(): Promise<void> {
    this.progress.lastUpdate = new Date().toISOString();
    await saveProgress(this.progress);
  }

  printStats(): void {
    const p = this.progress;
    console.log("\n── SkillsMP Scraper Stats ────────────────────────");
    console.log(`  Phase:       ${p.phase}`);
    console.log(`  Discovered:  ${p.discovered.toLocaleString()}`);
    console.log(`  Completed:   ${p.completed.toLocaleString()}`);
    console.log(`  Failed:      ${p.failed}`);
    console.log(`  Rate:        ${p.ratePerMin.toFixed(1)}/min`);
    console.log(`  ETA:         ${p.etaDays.toFixed(1)} days`);
    console.log(`  Last update: ${p.lastUpdate}`);
    console.log("─────────────────────────────────────────────────\n");
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ingestion/scrapers/skillsmp/index.ts
git commit -m "feat(skillsmp): add SkillsmpScraper orchestrator"
```

---

## Task 8: CLI Script

**Files:**
- Create: `scripts/scrape-skillsmp.ts`

- [ ] **Step 1: Create the CLI script**

```bash
mkdir -p scripts
```

Create `scripts/scrape-skillsmp.ts`:

```typescript
// scripts/scrape-skillsmp.ts
// Usage: jiti scripts/scrape-skillsmp.ts [--stats|--discover-only|--retry-failed|--export|--phase 2|--rate N]

import { SkillsmpScraper } from "../src/ingestion/scrapers/skillsmp/index";
import { loadProgress, CACHE_DIR } from "../src/ingestion/scrapers/skillsmp/storage";

const argv = process.argv.slice(2);

function getFlag(name: string): boolean {
  return argv.includes(name);
}
function getFlagValue(name: string, fallback: string): string {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
}

const ratePerSec = parseFloat(getFlagValue("--rate", "1"));
const scraper = new SkillsmpScraper(ratePerSec);

process.on("SIGINT", async () => {
  console.log("\nSIGINT — shutting down…");
  scraper.stop();
  await scraper.flush();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("\nSIGTERM — shutting down…");
  scraper.stop();
  await scraper.flush();
  process.exit(0);
});

async function main(): Promise<void> {
  if (getFlag("--stats")) {
    await scraper.init();
    scraper.printStats();
    return;
  }

  if (getFlag("--discover-only")) {
    await scraper.init();
    await scraper.discover();
    return;
  }

  if (getFlag("--retry-failed")) {
    await retryFailed();
    return;
  }

  if (getFlag("--export")) {
    await exportToSupabase();
    return;
  }

  // Default: start or resume full scrape
  await scraper.init();
  const progress = await loadProgress();
  const isFirstRun = !progress || progress.discovered === 0;

  if (isFirstRun || getFlag("--discover-only")) {
    console.log("Starting discovery phase…");
    await scraper.discover();
  } else {
    console.log("Resuming from checkpoint — skipping discovery.");
  }

  await scraper.scrape();
}

async function retryFailed(): Promise<void> {
  const { readFile, access } = await import("node:fs/promises");
  const { constants } = await import("node:fs");
  const path = await import("node:path");
  const failedPath = path.join(CACHE_DIR, "failed.jsonl");

  try {
    await access(failedPath, constants.R_OK);
  } catch {
    console.log("No failed.jsonl found.");
    return;
  }

  const lines = (await readFile(failedPath, "utf8")).split("\n").filter(Boolean);
  type FailRow = { url: string; attempts: number; error: string };
  const retryable = lines
    .flatMap((l): FailRow[] => {
      try { return [JSON.parse(l) as FailRow]; } catch { return []; }
    })
    .filter((e) => e.attempts < 3 && e.error !== "HTTP 404");

  console.log(`Re-queuing ${retryable.length} retryable URLs…`);
  await scraper.init();
  // Access the private queue via a cast — acceptable for CLI-only usage
  const q = (scraper as unknown as { queue: { enqueueBatch(u: string[]): Promise<number> } }).queue;
  await q.enqueueBatch(retryable.map((e) => e.url));
  await scraper.scrape();
}

async function exportToSupabase(): Promise<void> {
  const { createClient } = await import("@supabase/supabase-js");
  const { createReadStream } = await import("node:fs");
  const { createInterface } = await import("node:readline");
  const path = await import("node:path");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const indexPath = path.join(CACHE_DIR, "index.jsonl");
  const rl = createInterface({ input: createReadStream(indexPath), crlfDelay: Infinity });

  type IndexEntry = { id: string; name: string; author: string; description: string; stars: number; categories: string[]; tags: string[]; githubUrl: string; dateModified: string };
  let batch: IndexEntry[] = [];
  let total = 0;

  const flush = async (): Promise<void> => {
    if (batch.length === 0) return;
    const rows = batch.map((e) => ({
      canonical_slug: `skillsmp:${e.id}`,
      name: e.name,
      description: e.description,
      component_type: "skill",
      categories: e.categories,
      tags: e.tags,
      author_name: e.author,
      github_url: e.githubUrl,
      marketplace_name: "SkillsMP",
      official_verified: false,
      risk_flags: [],
      compatibility: [],
      source_urls: [`https://skillsmp.com/skills/${e.id}`],
      star_count: e.stars,
      source_updated_at: e.dateModified || null,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("normalized_components")
      .upsert(rows, { onConflict: "canonical_slug" });
    if (error) console.error("Upsert error:", error.message);
    total += rows.length;
    console.log(`Exported ${total}…`);
    batch = [];
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    try { batch.push(JSON.parse(line) as IndexEntry); } catch { continue; }
    if (batch.length >= 500) await flush();
  }
  await flush();
  console.log(`\nExport complete: ${total} skills upserted to Supabase.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/scrape-skillsmp.ts
git commit -m "feat(skillsmp): add CLI scraper entry point"
```

---

## Task 9: package.json scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts to package.json**

In `package.json`, add to the `"scripts"` block:

```json
"scrape:skillsmp": "jiti scripts/scrape-skillsmp.ts",
"scrape:skillsmp:stats": "jiti scripts/scrape-skillsmp.ts --stats",
"scrape:skillsmp:discover": "jiti scripts/scrape-skillsmp.ts --discover-only",
"scrape:skillsmp:retry": "jiti scripts/scrape-skillsmp.ts --retry-failed",
"scrape:skillsmp:export": "jiti scripts/scrape-skillsmp.ts --export",
"test:skillsmp": "jiti src/ingestion/scrapers/skillsmp/__tests__/skillsmp.test.ts"
```

- [ ] **Step 2: Run all scraper tests**

```bash
npm run test:skillsmp
```

Expected: all `✓` lines, exit code 0.

- [ ] **Step 3: Smoke-test stats flag (no network)**

```bash
npm run scrape:skillsmp:stats
```

Expected: prints stats table with zeros (first run, no cache yet).

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat(skillsmp): add scrape:skillsmp npm scripts"
```

---

## Task 10: Update skillsmp Source Adapter

**Files:**
- Modify: `src/ingestion/sources/skillsmp.ts`

- [ ] **Step 1: Rewrite the adapter to expose scraper metadata**

Replace the entire content of `src/ingestion/sources/skillsmp.ts`:

```typescript
// src/ingestion/sources/skillsmp.ts
// The full scrape is driven by: npm run scrape:skillsmp
// This adapter exposes SkillsMP as a named source for the ingestion pipeline UI.

import { GenericSourceAdapter } from "./base";

export const skillsmpAdapter = () =>
  new GenericSourceAdapter(
    "skillsmp",
    "https://skillsmp.com",
    "website",
    [
      "https://skillsmp.com/sitemaps/skills-recent.xml",
      "https://skillsmp.com/sitemaps/creators.xml",
      "https://skillsmp.com/sitemaps/occupations.xml",
      "https://skillsmp.com/sitemaps/pages.xml",
    ],
    { requestsPerMinute: 60 },
    true,
    "SkillsMP",
  );

// To run the full bulk scraper (1.5M+ skills):
//   npm run scrape:skillsmp
// To see progress:
//   npm run scrape:skillsmp:stats
// To export to Supabase:
//   npm run scrape:skillsmp:export
```

- [ ] **Step 2: Typecheck everything**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
npm run test:skillsmp && npm run test:ingestion
```
Expected: all tests pass.

- [ ] **Step 4: Final commit**

```bash
git add src/ingestion/sources/skillsmp.ts
git commit -m "feat(skillsmp): wire up full scraper — npm run scrape:skillsmp to start"
```

---

## Running the Scraper

```bash
# Start or resume the long-running scrape
npm run scrape:skillsmp

# Check progress at any time (safe to run while scraper is running)
npm run scrape:skillsmp:stats

# For long-running background use with PM2
pm2 start "npx jiti scripts/scrape-skillsmp.ts" \
  --name skillsmp-scraper \
  --restart-delay 5000 \
  --max-restarts 9999

pm2 logs skillsmp-scraper
pm2 monit
```

Data lands in `.ingestion-cache/skillsmp/`:
- `skills/` — one JSON per skill (~5KB each)  
- `index.jsonl` — lightweight one-liner per skill for search
- `progress.json` — live stats (ETA, rate, counts)
- `failed.jsonl` — retry queue
