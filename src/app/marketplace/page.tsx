"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Code2,
  ExternalLink,
  Filter,
  Github,
  Menu,
  Package,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

type ComponentType =
  | "all"
  | "plugin"
  | "skill"
  | "agent"
  | "command"
  | "hook"
  | "mcp_server"
  | "lsp_server"
  | "template"
  | "marketplace"
  | "theme"
  | "style"
  | "unknown";

interface DiscoveryComponent {
  canonicalSlug: string;
  name: string;
  description: string;
  componentType: ComponentType;
  categories: string[];
  tags: string[];
  authorName?: string;
  githubUrl?: string;
  packageUrl?: string;
  installCommand?: string;
  marketplaceName?: string;
  officialVerified: boolean;
  installCount?: number;
  starCount?: number;
  riskFlags: string[];
  securityNotes?: string;
  compatibility: string[];
  sourceUrls: string[];
  lastSeenAt?: string;
  sourceUpdatedAt?: string;
  provenance?: Array<{ sourceName: string; sourceUrl: string; extractionMethod: string; confidenceScore: number; contentHash?: string }>;
}

const TABS: Array<{ label: string; value: ComponentType }> = [
  { label: "All", value: "all" },
  { label: "Plugins", value: "plugin" },
  { label: "Skills", value: "skill" },
  { label: "Agents", value: "agent" },
  { label: "Commands", value: "command" },
  { label: "Hooks", value: "hook" },
  { label: "MCP Servers", value: "mcp_server" },
  { label: "LSP Servers", value: "lsp_server" },
  { label: "Templates", value: "template" },
  { label: "Marketplaces", value: "marketplace" },
  { label: "Themes / Styles", value: "theme" },
  { label: "More", value: "unknown" },
];

const FALLBACK_COMPONENTS: DiscoveryComponent[] = [
  {
    canonicalSlug: "claude-code-plugin-template",
    name: "Claude Code Plugin Template",
    description: "Starter template for packaging commands, hooks, and settings as a Claude Code plugin.",
    componentType: "template",
    categories: ["Developer Tools"],
    tags: ["claude-code", "plugin", "template"],
    authorName: "Skillscale Seed",
    githubUrl: "https://github.com/anthropics/claude-plugins-official",
    installCommand: "claude plugin install <repo>",
    marketplaceName: "Seed Data",
    officialVerified: false,
    starCount: 0,
    riskFlags: [],
    compatibility: ["Claude Code"],
    sourceUrls: ["https://github.com/anthropics/claude-plugins-official"],
    provenance: [{ sourceName: "seed", sourceUrl: "local", extractionMethod: "registry", confidenceScore: 0.5 }],
  },
  {
    canonicalSlug: "mcp-server-directory",
    name: "MCP Server Directory",
    description: "Directory-style component representing discoverable Model Context Protocol servers.",
    componentType: "mcp_server",
    categories: ["MCP"],
    tags: ["mcp", "server", "directory"],
    authorName: "Skillscale Seed",
    marketplaceName: "Seed Data",
    officialVerified: false,
    riskFlags: ["review_permissions"],
    securityNotes: "Review server permissions and requested scopes before installation.",
    compatibility: ["Claude Desktop", "Claude Code"],
    sourceUrls: ["https://mcpservers.org"],
  },
];

const SORTS = [
  ["relevance", "Relevance"],
  ["newest", "Newest"],
  ["install_count", "Install count"],
  ["stars", "GitHub stars"],
  ["last_updated", "Last updated"],
];

export default function MarketplacePage() {
  const [items, setItems] = useState<DiscoveryComponent[]>(FALLBACK_COMPONENTS);
  const [count, setCount] = useState(FALLBACK_COMPONENTS.length);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<ComponentType>("all");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("relevance");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<DiscoveryComponent | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => Array.from(new Set(items.flatMap((item) => item.categories))).sort(), [items]);
  const sources = useMemo(() => Array.from(new Set(items.flatMap((item) => item.provenance?.map((p) => p.sourceName) ?? item.marketplaceName ?? []))).sort(), [items]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeType !== "all") params.set("type", activeType);
    if (category) params.set("category", category);
    if (source) params.set("source", source);
    params.set("sort", sort);
    params.set("limit", "60");
    setLoading(true);
    fetch(`/api/components?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("components unavailable"))))
      .then((json) => {
        if (Array.isArray(json.data) && json.data.length) {
          setItems(json.data);
          setCount(json.count ?? json.data.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query, activeType, category, source, sort]);

  const openDetail = (item: DiscoveryComponent) => {
    setSelected(item);
    setDrawerOpen(true);
  };

  return (
    <div className="discovery-shell">
      <section className="discovery-hero">
        <div>
          <div className="discovery-kicker"><Sparkles size={15} /> Claude ecosystem discovery</div>
          <h1>AI Components</h1>
          <p>Search plugins, skills, agents, MCP servers, commands, hooks, templates, and marketplaces with provenance preserved from every crawl.</p>
        </div>
        <div className="discovery-stats" aria-label="Discovery statistics">
          <span>{count}</span>
          <small>indexed components</small>
        </div>
      </section>

      <div className="discovery-toolbar glass">
        <div className="discovery-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search components, tags, authors..." />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={17} /></button>}
        </div>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort components">
          {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="mobile-filter-button" onClick={() => setFiltersOpen(true)} aria-label="Open filters">
          <Filter size={18} /> Filters
        </button>
      </div>

      <nav className="discovery-tabs" aria-label="Component types">
        {TABS.map((tab) => (
          <button key={tab.value} className={activeType === tab.value ? "active" : ""} onClick={() => setActiveType(tab.value)}>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="discovery-layout">
        <aside className="discovery-filters glass">
          <Filters categories={categories} sources={sources} category={category} source={source} onCategory={setCategory} onSource={setSource} />
        </aside>

        <section className="component-grid" aria-busy={loading}>
          {items.map((item) => (
            <button key={item.canonicalSlug} className="component-card glass" onClick={() => openDetail(item)}>
              <div className="component-card-top">
                <span className="component-icon"><Package size={19} /></span>
                <span className="component-type">{labelForType(item.componentType)}</span>
              </div>
              <h2>{item.name}</h2>
              <p>{item.description || "No description was provided by the source."}</p>
              <div className="component-meta">
                {item.marketplaceName && <span>{item.marketplaceName}</span>}
                {item.authorName && <span>{item.authorName}</span>}
                {typeof item.starCount === "number" && <span>{item.starCount} stars</span>}
              </div>
              <div className="component-tags">
                {[...item.categories, ...item.tags].slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </button>
          ))}
        </section>
      </div>

      {filtersOpen && (
        <div className="mobile-filter-drawer" role="dialog" aria-modal="true">
          <button className="drawer-backdrop" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />
          <div className="drawer-panel glass">
            <div className="drawer-header"><strong>Filters</strong><button onClick={() => setFiltersOpen(false)}><X size={20} /></button></div>
            <Filters categories={categories} sources={sources} category={category} source={source} onCategory={setCategory} onSource={setSource} />
          </div>
        </div>
      )}

      {drawerOpen && selected && (
        <div className="detail-drawer" role="dialog" aria-modal="true">
          <button className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-label="Close details" />
          <article className="detail-panel glass">
            <div className="drawer-header">
              <span className="component-type">{labelForType(selected.componentType)}</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close details"><X size={20} /></button>
            </div>
            <h2>{selected.name}</h2>
            <p>{selected.description}</p>
            {selected.installCommand && <code className="install-command">{selected.installCommand}</code>}
            <div className="detail-actions">
              {selected.githubUrl && <a href={selected.githubUrl} target="_blank" rel="noreferrer"><Github size={17} /> GitHub</a>}
              {selected.packageUrl && <a href={selected.packageUrl} target="_blank" rel="noreferrer"><Code2 size={17} /> Package</a>}
              {selected.sourceUrls[0] && <a href={selected.sourceUrls[0]} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Source</a>}
            </div>
            <dl className="detail-list">
              <div><dt>Author</dt><dd>{selected.authorName ?? "Unknown"}</dd></div>
              <div><dt>Marketplace</dt><dd>{selected.marketplaceName ?? "Unknown"}</dd></div>
              <div><dt>Last seen</dt><dd>{formatDate(selected.lastSeenAt)}</dd></div>
              <div><dt>Last updated</dt><dd>{formatDate(selected.sourceUpdatedAt)}</dd></div>
            </dl>
            {(selected.riskFlags.length > 0 || selected.securityNotes) && (
              <div className="risk-note"><ShieldAlert size={18} /> <span>{selected.securityNotes ?? selected.riskFlags.join(", ")}</span></div>
            )}
            <div className="component-tags detail-tags">
              {[...selected.categories, ...selected.tags, ...selected.compatibility].map((tag) => <span key={tag}>{tag}</span>)}
            </div>
            <section className="provenance">
              <h3>Provenance</h3>
              {(selected.provenance ?? []).map((entry, index) => (
                <a key={`${entry.sourceName}-${index}`} href={entry.sourceUrl} target="_blank" rel="noreferrer">
                  <span>{entry.sourceName}</span>
                  <small>{entry.extractionMethod} · confidence {Math.round(entry.confidenceScore * 100)}%</small>
                </a>
              ))}
            </section>
          </article>
        </div>
      )}
    </div>
  );
}

function Filters(props: {
  categories: string[];
  sources: string[];
  category: string;
  source: string;
  onCategory: (value: string) => void;
  onSource: (value: string) => void;
}) {
  return (
    <>
      <label>
        <span>Category</span>
        <select value={props.category} onChange={(event) => props.onCategory(event.target.value)}>
          <option value="">Any category</option>
          {props.categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </label>
      <label>
        <span>Source</span>
        <select value={props.source} onChange={(event) => props.onSource(event.target.value)}>
          <option value="">Any source</option>
          {props.sources.map((src) => <option key={src} value={src}>{src}</option>)}
        </select>
      </label>
    </>
  );
}

function labelForType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
