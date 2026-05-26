export type SourceType = "website" | "github_repo" | "registry_json" | "docs_index" | "api" | "sitemap";

export type ExtractionMethod =
  | "api"
  | "registry"
  | "github"
  | "sitemap"
  | "static_html"
  | "embedded_json"
  | "playwright";

export type ComponentType =
  | "plugin"
  | "skill"
  | "agent"
  | "subagent"
  | "command"
  | "slash_command"
  | "hook"
  | "mcp_server"
  | "lsp_server"
  | "monitor"
  | "theme"
  | "style"
  | "template"
  | "marketplace"
  | "settings"
  | "workflow"
  | "unknown";

export interface SourceRegistryEntry {
  id?: string;
  name: string;
  baseUrl: string;
  sourceType: SourceType;
  enabled: boolean;
  rateLimitPerMinute: number;
  notes?: string;
}

export interface CrawlRun {
  id: string;
  sourceId?: string;
  sourceName: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "completed" | "partial" | "failed";
  pagesSeen: number;
  itemsExtracted: number;
  errorsCount: number;
  configJson: Record<string, unknown>;
  gitCommitSha?: string | null;
}

export interface RawSourceItem {
  sourceName: string;
  sourceUrl: string;
  canonicalUrl?: string;
  rawTitle?: string;
  rawDescription?: string;
  rawPayload: Record<string, unknown>;
  rawHtmlText?: string;
  extractionMethod: ExtractionMethod;
  sourceUpdatedAt?: string;
  confidenceScore: number;
}

export interface StoredRawItem extends RawSourceItem {
  id: string;
  crawlRunId: string;
  contentHash: string;
  firstSeenAt: string;
  lastSeenAt: string;
  isMissingSinceLastCrawl: boolean;
}

export interface NormalizedComponent {
  id?: string;
  canonicalSlug: string;
  name: string;
  description: string;
  longDescription?: string;
  componentType: ComponentType;
  categories: string[];
  tags: string[];
  authorName?: string;
  authorUrl?: string;
  githubUrl?: string;
  packageUrl?: string;
  installCommand?: string;
  marketplaceName?: string;
  officialVerified: boolean;
  installCount?: number;
  starCount?: number;
  license?: string;
  riskFlags: string[];
  securityNotes?: string;
  compatibility: string[];
  sourceUrls: string[];
  normalizedHash?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  sourceUpdatedAt?: string;
  updatedAt?: string;
  provenance?: Array<{
    sourceName: string;
    sourceUrl: string;
    extractionMethod: ExtractionMethod;
    confidenceScore: number;
    contentHash?: string;
  }>;
}

export interface DuplicateCandidate {
  leftSlug: string;
  rightSlug: string;
  reason: string;
  confidence: number;
}

export interface FetchResult {
  url: string;
  status: number;
  contentType?: string | null;
  body: string;
}

export interface SourceAdapter {
  sourceName: string;
  baseUrl: string;
  sourceType: SourceType;
  rateLimitConfig: { requestsPerMinute: number };
  supportsIncrementalSync: boolean;
  discoverUrls(checkpoint?: Record<string, unknown>): Promise<string[]>;
  fetchRaw(url: string): Promise<FetchResult>;
  extractItems(raw: FetchResult): Promise<RawSourceItem[]>;
  normalizeItem(item: RawSourceItem): Promise<NormalizedComponent>;
  getCheckpoint(): Promise<Record<string, unknown>>;
  saveCheckpoint(checkpoint: Record<string, unknown>): Promise<void>;
}

export interface IngestionStorage {
  ensureSource(source: SourceRegistryEntry): Promise<{ id: string }>;
  startRun(sourceId: string, sourceName: string, configJson: Record<string, unknown>): Promise<CrawlRun>;
  saveRawItem(sourceId: string, runId: string, raw: RawSourceItem): Promise<StoredRawItem>;
  saveNormalizedComponent(runId: string, raw: StoredRawItem, component: NormalizedComponent): Promise<NormalizedComponent>;
  markRunComplete(runId: string, status: CrawlRun["status"], stats: Partial<CrawlRun>): Promise<void>;
  saveError(error: { runId: string; sourceId: string; url: string; errorType: string; errorMessage: string; retryCount: number }): Promise<void>;
  getCheckpoint(sourceId: string): Promise<Record<string, unknown>>;
  saveCheckpoint(sourceId: string, checkpoint: Record<string, unknown>): Promise<void>;
  listComponents(params?: ComponentQuery): Promise<{ data: NormalizedComponent[]; count: number }>;
  getComponent(slug: string): Promise<NormalizedComponent | null>;
  listSources(): Promise<SourceRegistryEntry[]>;
}

export interface ComponentQuery {
  q?: string;
  type?: ComponentType | "all";
  category?: string;
  source?: string;
  sort?: "relevance" | "newest" | "install_count" | "stars" | "last_updated";
  limit?: number;
  offset?: number;
}
