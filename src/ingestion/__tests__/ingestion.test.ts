import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { contentHash } from "../hash";
import { classifyComponentType, normalizeGenericRawItem } from "../normalize";
import { duplicateSignals } from "../dedupe";
import { extractRegistryJson } from "../extractors/registryJsonExtractor";
import { extractStaticHtml } from "../extractors/staticHtmlExtractor";
import { extractEmbeddedJson } from "../extractors/embeddedJsonExtractor";
import { extractMarkdownLinks } from "../extractors/githubRepoExtractor";
import { runIngestion } from "../index";
import type { FetchResult, IngestionStorage, NormalizedComponent, RawSourceItem, SourceAdapter, SourceRegistryEntry, StoredRawItem } from "../types";

const fixtures = path.join(process.cwd(), "src/ingestion/__fixtures__");

async function fixture(name: string) {
  return readFile(path.join(fixtures, name), "utf8");
}

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

await test("content hashing is stable for object key order", () => {
  assert.equal(contentHash({ b: 2, a: 1 }), contentHash({ a: 1, b: 2 }));
});

await test("component type classification covers required types", () => {
  assert.equal(classifyComponentType({ name: "MCP server" }), "mcp_server");
  assert.equal(classifyComponentType({ name: "/review slash command" }), "slash_command");
  assert.equal(classifyComponentType({ category: "unmapped artifact" }), "unknown");
});

await test("registry JSON, embedded JSON, static HTML, and markdown extractors work on fixtures", async () => {
  assert.equal(extractRegistryJson({ sourceName: "hub", sourceUrl: "https://example.com", body: await fixture("claude-plugin-hub.json") }).length, 1);
  assert.equal(extractEmbeddedJson({ sourceName: "aitmpl", sourceUrl: "https://example.com", body: await fixture("aitmpl-agents.html") })[0].rawTitle, "Research Agent Template");
  assert.equal(extractStaticHtml({ sourceName: "build", sourceUrl: "https://buildwithclaude.com", body: await fixture("buildwithclaude.html") })[0].rawTitle, "Context Scout Plugin");
  assert.equal(extractMarkdownLinks({ sourceName: "github", sourceUrl: "https://github.com/x/y", body: await fixture("github-marketplace.md") })[0].rawTitle, "Slash Command Kit");
});

await test("normalization preserves unknown source categories", async () => {
  const raw = extractRegistryJson({ sourceName: "unknown", sourceUrl: "https://example.com", body: await fixture("unknown-type.json") })[0];
  const normalized = normalizeGenericRawItem(raw, "Fixture");
  assert.equal(normalized.componentType, "unknown");
  assert.deepEqual(normalized.categories, ["Unmapped"]);
});

await test("dedupe marks candidates without merging them", async () => {
  const raws = extractRegistryJson({ sourceName: "dupes", sourceUrl: "https://example.com", body: await fixture("duplicates.json") });
  const normalized = raws.map((raw) => normalizeGenericRawItem(raw, "Fixture"));
  assert.equal(duplicateSignals(normalized).length >= 1, true);
});

class FixtureAdapter implements SourceAdapter {
  sourceName = "fixture-source";
  baseUrl = "https://fixture.test";
  sourceType = "registry_json" as const;
  rateLimitConfig = { requestsPerMinute: 1000 };
  supportsIncrementalSync = true;
  calls = 0;
  async discoverUrls() { return ["https://fixture.test/ok.json", "https://fixture.test/fail.json"]; }
  async fetchRaw(url: string): Promise<FetchResult> {
    this.calls++;
    if (url.includes("fail")) throw new Error("fixture failure");
    return { url, status: 200, contentType: "application/json", body: await fixture("missing-fields.json") };
  }
  async extractItems(raw: FetchResult) { return extractRegistryJson({ sourceName: this.sourceName, sourceUrl: raw.url, body: raw.body }); }
  async normalizeItem(item: RawSourceItem) { return normalizeGenericRawItem(item, "Fixture"); }
  async getCheckpoint() { return {}; }
  async saveCheckpoint() {}
}

class MemoryStorage implements IngestionStorage {
  sources: Array<SourceRegistryEntry & { id: string }> = [];
  rawItems: StoredRawItem[] = [];
  components: NormalizedComponent[] = [];
  errors: unknown[] = [];
  checkpoints: Record<string, Record<string, unknown>> = {};
  async ensureSource(source: SourceRegistryEntry) { const existing = this.sources[0] ?? { ...source, id: "source-1" }; this.sources = [existing]; return { id: existing.id }; }
  async startRun() { return { id: "run-1", sourceName: "fixture-source", startedAt: new Date().toISOString(), status: "running" as const, pagesSeen: 0, itemsExtracted: 0, errorsCount: 0, configJson: {} }; }
  async saveRawItem(_sourceId: string, runId: string, raw: RawSourceItem) {
    const stored = { ...raw, id: `raw-${this.rawItems.length}`, crawlRunId: runId, contentHash: contentHash(raw.rawPayload), firstSeenAt: new Date().toISOString(), lastSeenAt: new Date().toISOString(), isMissingSinceLastCrawl: false };
    this.rawItems.push(stored);
    return stored;
  }
  async saveNormalizedComponent(_runId: string, _raw: StoredRawItem, component: NormalizedComponent) { this.components.push(component); return component; }
  async markRunComplete() {}
  async saveError(error: unknown) { this.errors.push(error); }
  async getCheckpoint(sourceId: string) { return this.checkpoints[sourceId] ?? {}; }
  async saveCheckpoint(sourceId: string, checkpoint: Record<string, unknown>) { this.checkpoints[sourceId] = checkpoint; }
  async listComponents() { return { data: this.components, count: this.components.length }; }
  async getComponent() { return null; }
  async listSources() { return this.sources; }
}

await test("checkpoint resume and failed fetch retry behavior are wired through storage", async () => {
  const storage = new MemoryStorage();
  const adapter = new FixtureAdapter();
  const result = await runIngestion({ source: adapter.sourceName, storage, adapters: [adapter] });
  assert.equal(result.results.length, 1);
  assert.equal(storage.rawItems.length, 1);
  assert.equal(Object.keys(storage.checkpoints).length, 1);
  assert.equal(storage.errors.length, 1);
});
