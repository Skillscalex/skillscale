import { RateLimiter } from "./rateLimit";
import { robotsAllowed } from "./robots";
import { createIngestionStorage } from "./storage";
import { applySkillSpectorScan } from "./security/skillspector";
import type { IngestionStorage, SourceAdapter } from "./types";
import { buildWithClaudeAdapter } from "./sources/buildwithclaude";
import { claudePluginHubAdapter } from "./sources/claudePluginHub";
import { aitmplAgentsAdapter, aitmplPluginsAdapter } from "./sources/aitmpl";
import { claudeOfficialPluginsAdapter } from "./sources/claudeOfficialPlugins";
import { githubMarketplaceAdapter } from "./sources/githubMarketplace";
import { awesomeClaudeCodeAdapter, awesomeClaudeSkillsAdapter } from "./sources/awesomeLists";
import { aitmplDocsIndexAdapter } from "./sources/docsIndex";
import { skillsmpAdapter } from "./sources/skillsmp";
import { skillsShAdapter } from "./sources/skillsSh";

export function getSourceAdapters(): SourceAdapter[] {
  return [
    buildWithClaudeAdapter(),
    claudePluginHubAdapter(),
    aitmplAgentsAdapter(),
    aitmplPluginsAdapter(),
    claudeOfficialPluginsAdapter(),
    githubMarketplaceAdapter(),
    awesomeClaudeCodeAdapter(),
    awesomeClaudeSkillsAdapter(),
    aitmplDocsIndexAdapter(),
    skillsShAdapter(),
    skillsmpAdapter(),
  ];
}

export function getSourceAdapter(sourceName: string): SourceAdapter | undefined {
  return getSourceAdapters().find((adapter) => adapter.sourceName === sourceName);
}

export async function runIngestion(options: { source?: string; dryRun?: boolean; resume?: boolean; storage?: IngestionStorage; adapters?: SourceAdapter[] } = {}) {
  const storage = options.storage ?? createIngestionStorage();
  const allAdapters = options.adapters ?? getSourceAdapters();
  const adapters = options.source ? allAdapters.filter((adapter) => adapter.sourceName === options.source) : allAdapters;
  if (options.source && adapters.length === 0) throw new Error(`Unknown source: ${options.source}`);
  const results = [];

  for (const adapter of adapters) {
    const source = await storage.ensureSource({
      name: adapter.sourceName,
      baseUrl: adapter.baseUrl,
      sourceType: adapter.sourceType,
      enabled: true,
      rateLimitPerMinute: adapter.rateLimitConfig.requestsPerMinute,
    });
    const checkpoint = options.resume ? await storage.getCheckpoint(source.id) : {};
    const run = await storage.startRun(source.id, adapter.sourceName, { dryRun: Boolean(options.dryRun), resume: Boolean(options.resume), checkpoint });
    const limiter = new RateLimiter(adapter.rateLimitConfig.requestsPerMinute);
    let pagesSeen = 0;
    let itemsExtracted = 0;
    let errorsCount = 0;

    try {
      const urls = await adapter.discoverUrls(checkpoint);
      for (const url of urls) {
        const robots = await robotsAllowed(url);
        if (!robots.allowed) {
          errorsCount++;
          await storage.saveError({ runId: run.id, sourceId: source.id, url, errorType: "robots_disallow", errorMessage: robots.reason, retryCount: 0 });
          continue;
        }
        await limiter.wait();
        try {
          const rawPage = await retry(() => adapter.fetchRaw(url), 2);
          pagesSeen++;
          const items = await adapter.extractItems(rawPage);
          for (const item of items) {
            const stored = await storage.saveRawItem(source.id, run.id, item);
            const normalized = await adapter.normalizeItem(item);
            const scanned = applySkillSpectorScan(normalized);
            if (!options.dryRun) await storage.saveNormalizedComponent(run.id, stored, scanned);
            itemsExtracted++;
          }
          await storage.saveCheckpoint(source.id, { lastUrl: url, lastSuccessfulFetchAt: new Date().toISOString() });
        } catch (error) {
          errorsCount++;
          await storage.saveError({
            runId: run.id,
            sourceId: source.id,
            url,
            errorType: error instanceof Error ? error.name : "unknown",
            errorMessage: error instanceof Error ? error.message : String(error),
            retryCount: 2,
          });
        }
      }
      await storage.markRunComplete(run.id, errorsCount ? "partial" : "completed", { pagesSeen, itemsExtracted, errorsCount });
      results.push({ source: adapter.sourceName, runId: run.id, status: errorsCount ? "partial" : "completed", pagesSeen, itemsExtracted, errorsCount });
    } catch (error) {
      await storage.markRunComplete(run.id, "failed", { pagesSeen, itemsExtracted, errorsCount: errorsCount + 1 });
      results.push({ source: adapter.sourceName, runId: run.id, status: "failed", pagesSeen, itemsExtracted, errorsCount: errorsCount + 1, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { results };
}

async function retry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError;
}
