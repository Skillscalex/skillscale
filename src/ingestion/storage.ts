import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { contentHash, normalizedHash } from "./hash";
import type {
  ComponentQuery,
  CrawlRun,
  IngestionStorage,
  NormalizedComponent,
  RawSourceItem,
  SourceRegistryEntry,
  StoredRawItem,
} from "./types";

const cacheDir = path.join(process.cwd(), ".ingestion-cache");
const cacheFile = path.join(cacheDir, "local-store.json");

interface LocalStore {
  sources: Array<SourceRegistryEntry & { id: string }>;
  runs: CrawlRun[];
  rawItems: StoredRawItem[];
  components: NormalizedComponent[];
  errors: unknown[];
  checkpoints: Record<string, Record<string, unknown>>;
}

function emptyStore(): LocalStore {
  return { sources: [], runs: [], rawItems: [], components: [], errors: [], checkpoints: {} };
}

function now() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class LocalJsonStorage implements IngestionStorage {
  private async read(): Promise<LocalStore> {
    try {
      return JSON.parse(await readFile(cacheFile, "utf8")) as LocalStore;
    } catch {
      return emptyStore();
    }
  }

  private async write(store: LocalStore): Promise<void> {
    await mkdir(cacheDir, { recursive: true });
    await writeFile(cacheFile, JSON.stringify(store, null, 2));
  }

  async ensureSource(source: SourceRegistryEntry): Promise<{ id: string }> {
    const store = await this.read();
    let existing = store.sources.find((s) => s.name === source.name);
    if (!existing) {
      existing = { ...source, id: id("src") };
      store.sources.push(existing);
      await this.write(store);
    }
    return { id: existing.id };
  }

  async startRun(sourceId: string, sourceName: string, configJson: Record<string, unknown>): Promise<CrawlRun> {
    const store = await this.read();
    const run: CrawlRun = { id: id("run"), sourceId, sourceName, startedAt: now(), status: "running", pagesSeen: 0, itemsExtracted: 0, errorsCount: 0, configJson };
    store.runs.push(run);
    await this.write(store);
    return run;
  }

  async saveRawItem(_sourceId: string, runId: string, raw: RawSourceItem): Promise<StoredRawItem> {
    const store = await this.read();
    const hash = contentHash(raw.rawPayload);
    const existing = store.rawItems.find((item) => item.sourceName === raw.sourceName && item.contentHash === hash && item.canonicalUrl === raw.canonicalUrl);
    const stored: StoredRawItem = existing
      ? { ...existing, ...raw, lastSeenAt: now(), isMissingSinceLastCrawl: false }
      : { ...raw, id: id("raw"), crawlRunId: runId, contentHash: hash, firstSeenAt: now(), lastSeenAt: now(), isMissingSinceLastCrawl: false };
    store.rawItems = store.rawItems.filter((item) => item.id !== stored.id).concat(stored);
    await this.write(store);
    return stored;
  }

  async saveNormalizedComponent(runId: string, raw: StoredRawItem, component: NormalizedComponent): Promise<NormalizedComponent> {
    const store = await this.read();
    const hash = normalizedHash({ ...component, provenance: undefined, normalizedHash: undefined, updatedAt: undefined });
    const existing = store.components.find((item) => item.canonicalSlug === component.canonicalSlug);
    const merged: NormalizedComponent = {
      ...existing,
      ...component,
      normalizedHash: hash,
      firstSeenAt: existing?.firstSeenAt ?? now(),
      lastSeenAt: now(),
      updatedAt: now(),
      sourceUrls: Array.from(new Set([...(existing?.sourceUrls ?? []), ...component.sourceUrls])),
      provenance: [
        ...(existing?.provenance ?? []),
        {
          sourceName: raw.sourceName,
          sourceUrl: raw.sourceUrl,
          extractionMethod: raw.extractionMethod,
          confidenceScore: raw.confidenceScore,
          contentHash: raw.contentHash,
        },
      ],
    };
    void runId;
    store.components = store.components.filter((item) => item.canonicalSlug !== merged.canonicalSlug).concat(merged);
    await this.write(store);
    return merged;
  }

  async markRunComplete(runId: string, status: CrawlRun["status"], stats: Partial<CrawlRun>): Promise<void> {
    const store = await this.read();
    store.runs = store.runs.map((run) => (run.id === runId ? { ...run, ...stats, status, completedAt: now() } : run));
    await this.write(store);
  }

  async saveError(error: { runId: string; sourceId: string; url: string; errorType: string; errorMessage: string; retryCount: number }): Promise<void> {
    const store = await this.read();
    store.errors.push({ id: id("err"), ...error, createdAt: now() });
    await this.write(store);
  }

  async getCheckpoint(sourceId: string): Promise<Record<string, unknown>> {
    const store = await this.read();
    return store.checkpoints[sourceId] ?? {};
  }

  async saveCheckpoint(sourceId: string, checkpoint: Record<string, unknown>): Promise<void> {
    const store = await this.read();
    store.checkpoints[sourceId] = checkpoint;
    await this.write(store);
  }

  async listComponents(params: ComponentQuery = {}): Promise<{ data: NormalizedComponent[]; count: number }> {
    const store = await this.read();
    let data = [...store.components];
    if (params.q) {
      const q = params.q.toLowerCase();
      data = data.filter((item) => [item.name, item.description, item.authorName, ...item.tags, ...item.categories].join(" ").toLowerCase().includes(q));
    }
    if (params.type && params.type !== "all") data = data.filter((item) => item.componentType === params.type);
    if (params.category) data = data.filter((item) => item.categories.includes(params.category!));
    if (params.source) data = data.filter((item) => item.provenance?.some((p) => p.sourceName === params.source));
    data.sort((a, b) => {
      if (params.sort === "install_count") return (b.installCount ?? 0) - (a.installCount ?? 0);
      if (params.sort === "stars") return (b.starCount ?? 0) - (a.starCount ?? 0);
      return new Date(b.lastSeenAt ?? b.updatedAt ?? 0).getTime() - new Date(a.lastSeenAt ?? a.updatedAt ?? 0).getTime();
    });
    const count = data.length;
    data = data.slice(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 48));
    return { data, count };
  }

  async getComponent(slug: string): Promise<NormalizedComponent | null> {
    const store = await this.read();
    return store.components.find((item) => item.canonicalSlug === slug) ?? null;
  }

  async listSources(): Promise<SourceRegistryEntry[]> {
    const store = await this.read();
    return store.sources;
  }
}

export class SupabaseIngestionStorage implements IngestionStorage {
  constructor(private readonly supabase: SupabaseClient) {}

  async ensureSource(source: SourceRegistryEntry): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .from("source_registry")
      .upsert({
        name: source.name,
        base_url: source.baseUrl,
        source_type: source.sourceType,
        enabled: source.enabled,
        rate_limit_per_minute: source.rateLimitPerMinute,
        notes: source.notes,
      }, { onConflict: "name" })
      .select("id")
      .single();
    if (error) throw error;
    return data;
  }

  async startRun(sourceId: string, sourceName: string, configJson: Record<string, unknown>): Promise<CrawlRun> {
    const { data, error } = await this.supabase
      .from("crawl_runs")
      .insert({ source_id: sourceId, status: "running", config_json: configJson })
      .select("*")
      .single();
    if (error) throw error;
    return { id: data.id, sourceId, sourceName, startedAt: data.started_at, status: data.status, pagesSeen: 0, itemsExtracted: 0, errorsCount: 0, configJson };
  }

  async saveRawItem(sourceId: string, runId: string, raw: RawSourceItem): Promise<StoredRawItem> {
    const hash = contentHash(raw.rawPayload);
    const row = {
      source_id: sourceId,
      crawl_run_id: runId,
      source_url: raw.sourceUrl,
      canonical_url: raw.canonicalUrl,
      raw_title: raw.rawTitle,
      raw_description: raw.rawDescription,
      raw_payload_json: raw.rawPayload,
      raw_html_text: raw.rawHtmlText,
      content_hash: hash,
      extraction_method: raw.extractionMethod,
      last_seen_at: now(),
      source_updated_at: raw.sourceUpdatedAt,
      is_missing_since_last_crawl: false,
      confidence_score: raw.confidenceScore,
    };
    const { data, error } = await this.supabase.from("raw_items").insert(row).select("*").single();
    if (error) throw error;
    return { ...raw, id: data.id, crawlRunId: runId, contentHash: hash, firstSeenAt: data.first_seen_at, lastSeenAt: data.last_seen_at, isMissingSinceLastCrawl: false };
  }

  async saveNormalizedComponent(runId: string, raw: StoredRawItem, component: NormalizedComponent): Promise<NormalizedComponent> {
    const hash = normalizedHash({ ...component, normalizedHash: undefined, provenance: undefined });
    const row = {
      canonical_slug: component.canonicalSlug,
      name: component.name,
      description: component.description,
      long_description: component.longDescription,
      component_type: component.componentType,
      categories: component.categories,
      tags: component.tags,
      author_name: component.authorName,
      author_url: component.authorUrl,
      github_url: component.githubUrl,
      package_url: component.packageUrl,
      install_command: component.installCommand,
      marketplace_name: component.marketplaceName,
      official_verified: component.officialVerified,
      install_count: component.installCount,
      star_count: component.starCount,
      license: component.license,
      risk_flags: component.riskFlags,
      security_notes: component.securityNotes,
      compatibility: component.compatibility,
      source_urls: component.sourceUrls,
      normalized_hash: hash,
      last_seen_at: now(),
      source_updated_at: component.sourceUpdatedAt,
      updated_at: now(),
    };
    const { data, error } = await this.supabase.from("normalized_components").upsert(row, { onConflict: "canonical_slug" }).select("*").single();
    if (error) throw error;
    await this.supabase.from("component_versions").insert({
      component_id: data.id,
      crawl_run_id: runId,
      normalized_snapshot_json: row,
      normalized_hash: hash,
      changed_fields_json: {},
    });
    return {
      ...component,
      id: data.id,
      normalizedHash: hash,
      firstSeenAt: data.first_seen_at,
      lastSeenAt: data.last_seen_at,
      updatedAt: data.updated_at,
      provenance: [{ sourceName: raw.sourceName, sourceUrl: raw.sourceUrl, extractionMethod: raw.extractionMethod, confidenceScore: raw.confidenceScore, contentHash: raw.contentHash }],
    };
  }

  async markRunComplete(runId: string, status: CrawlRun["status"], stats: Partial<CrawlRun>): Promise<void> {
    const { error } = await this.supabase.from("crawl_runs").update({
      status,
      completed_at: now(),
      pages_seen: stats.pagesSeen,
      items_extracted: stats.itemsExtracted,
      errors_count: stats.errorsCount,
    }).eq("id", runId);
    if (error) throw error;
  }

  async saveError(errorRow: { runId: string; sourceId: string; url: string; errorType: string; errorMessage: string; retryCount: number }): Promise<void> {
    await this.supabase.from("crawl_errors").insert({
      crawl_run_id: errorRow.runId,
      source_id: errorRow.sourceId,
      url: errorRow.url,
      error_type: errorRow.errorType,
      error_message: errorRow.errorMessage,
      retry_count: errorRow.retryCount,
    });
  }

  async getCheckpoint(sourceId: string): Promise<Record<string, unknown>> {
    const { data } = await this.supabase.from("sync_state").select("checkpoint_json").eq("source_id", sourceId).maybeSingle();
    return (data?.checkpoint_json as Record<string, unknown>) ?? {};
  }

  async saveCheckpoint(sourceId: string, checkpoint: Record<string, unknown>): Promise<void> {
    await this.supabase.from("sync_state").upsert({ source_id: sourceId, checkpoint_json: checkpoint, updated_at: now() }, { onConflict: "source_id" });
  }

  async listComponents(params: ComponentQuery = {}): Promise<{ data: NormalizedComponent[]; count: number }> {
    let query = this.supabase.from("normalized_components").select("*", { count: "exact" });
    if (params.q) query = query.textSearch("search_document", params.q, { type: "websearch" });
    if (params.type && params.type !== "all") query = query.eq("component_type", params.type);
    if (params.category) query = query.contains("categories", [params.category]);
    const sort = params.sort === "install_count" ? "install_count" : params.sort === "stars" ? "star_count" : params.sort === "last_updated" ? "source_updated_at" : "last_seen_at";
    query = query.order(sort, { ascending: false, nullsFirst: false }).range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 48) - 1);
    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []).map(fromDbComponent), count: count ?? 0 };
  }

  async getComponent(slug: string): Promise<NormalizedComponent | null> {
    const { data, error } = await this.supabase.from("normalized_components").select("*").eq("canonical_slug", slug).maybeSingle();
    if (error) throw error;
    return data ? fromDbComponent(data) : null;
  }

  async listSources(): Promise<SourceRegistryEntry[]> {
    const { data, error } = await this.supabase.from("source_registry").select("*").order("name");
    if (error) throw error;
    return (data ?? []).map((row) => ({ id: row.id, name: row.name, baseUrl: row.base_url, sourceType: row.source_type, enabled: row.enabled, rateLimitPerMinute: row.rate_limit_per_minute, notes: row.notes }));
  }
}

function fromDbComponent(row: Record<string, any>): NormalizedComponent {
  return {
    id: row.id,
    canonicalSlug: row.canonical_slug,
    name: row.name,
    description: row.description ?? "",
    longDescription: row.long_description,
    componentType: row.component_type,
    categories: row.categories ?? [],
    tags: row.tags ?? [],
    authorName: row.author_name,
    authorUrl: row.author_url,
    githubUrl: row.github_url,
    packageUrl: row.package_url,
    installCommand: row.install_command,
    marketplaceName: row.marketplace_name,
    officialVerified: row.official_verified,
    installCount: row.install_count,
    starCount: row.star_count,
    license: row.license,
    riskFlags: row.risk_flags ?? [],
    securityNotes: row.security_notes,
    compatibility: row.compatibility ?? [],
    sourceUrls: row.source_urls ?? [],
    normalizedHash: row.normalized_hash,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    sourceUpdatedAt: row.source_updated_at,
    updatedAt: row.updated_at,
  };
}

export function createIngestionStorage(): IngestionStorage {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key && !url.includes("your-project")) {
    return new SupabaseIngestionStorage(createClient(url, key, { auth: { persistSession: false } }));
  }
  return new LocalJsonStorage();
}
