-- Component ingestion schema: raw preservation, normalized discovery, provenance, and checkpoints.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('website','github_repo','registry_json','docs_index','api','sitemap');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE crawl_status AS ENUM ('running','completed','partial','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE extraction_method AS ENUM ('api','registry','github','sitemap','static_html','embedded_json','playwright');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE component_type AS ENUM (
    'plugin','skill','agent','subagent','command','slash_command','hook','mcp_server','lsp_server',
    'monitor','theme','style','template','marketplace','settings','workflow','unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  base_url TEXT NOT NULL,
  source_type source_type NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 20,
  robots_checked_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crawl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES source_registry(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status crawl_status NOT NULL DEFAULT 'running',
  pages_seen INTEGER NOT NULL DEFAULT 0,
  items_extracted INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  config_json JSONB NOT NULL DEFAULT '{}',
  git_commit_sha TEXT
);

CREATE TABLE IF NOT EXISTS raw_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES source_registry(id) ON DELETE CASCADE,
  crawl_run_id UUID NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  canonical_url TEXT,
  raw_title TEXT,
  raw_description TEXT,
  raw_payload_json JSONB NOT NULL,
  raw_html_text TEXT,
  content_hash TEXT NOT NULL,
  extraction_method extraction_method NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_updated_at TIMESTAMPTZ,
  is_missing_since_last_crawl BOOLEAN NOT NULL DEFAULT FALSE,
  confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.5
);

CREATE TABLE IF NOT EXISTS normalized_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  long_description TEXT,
  component_type component_type NOT NULL DEFAULT 'unknown',
  categories TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT,
  author_url TEXT,
  github_url TEXT,
  package_url TEXT,
  install_command TEXT,
  marketplace_name TEXT,
  official_verified BOOLEAN NOT NULL DEFAULT FALSE,
  install_count INTEGER,
  star_count INTEGER,
  license TEXT,
  risk_flags TEXT[] NOT NULL DEFAULT '{}',
  security_notes TEXT,
  compatibility TEXT[] NOT NULL DEFAULT '{}',
  source_urls TEXT[] NOT NULL DEFAULT '{}',
  normalized_hash TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_updated_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_document TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(categories, ' ')), 'C') ||
    setweight(to_tsvector('english', coalesce(author_name,'')), 'C')
  ) STORED
);

CREATE TABLE IF NOT EXISTS component_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES normalized_components(id) ON DELETE CASCADE,
  crawl_run_id UUID NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
  normalized_snapshot_json JSONB NOT NULL,
  normalized_hash TEXT NOT NULL,
  changed_fields_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crawl_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_run_id UUID NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES source_registry(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL UNIQUE REFERENCES source_registry(id) ON DELETE CASCADE,
  cursor TEXT,
  checkpoint_json JSONB NOT NULL DEFAULT '{}',
  last_successful_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_components_type ON normalized_components(component_type);
CREATE INDEX IF NOT EXISTS idx_components_marketplace ON normalized_components(marketplace_name);
CREATE INDEX IF NOT EXISTS idx_components_author ON normalized_components(author_name);
CREATE INDEX IF NOT EXISTS idx_components_source_updated ON normalized_components(source_updated_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_components_last_seen ON normalized_components(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_components_install_count ON normalized_components(install_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_components_star_count ON normalized_components(star_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_components_slug ON normalized_components(canonical_slug);
CREATE INDEX IF NOT EXISTS idx_components_search ON normalized_components USING GIN(search_document);
CREATE INDEX IF NOT EXISTS idx_components_tags ON normalized_components USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_components_categories ON normalized_components USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_raw_items_hash ON raw_items(content_hash);
CREATE INDEX IF NOT EXISTS idx_raw_items_source_url ON raw_items(source_url);
CREATE INDEX IF NOT EXISTS idx_raw_items_last_seen ON raw_items(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_runs_source_started ON crawl_runs(source_id, started_at DESC);

CREATE TRIGGER source_registry_updated_at BEFORE UPDATE ON source_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER normalized_components_updated_at BEFORE UPDATE ON normalized_components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO source_registry (name, base_url, source_type, enabled, rate_limit_per_minute, notes) VALUES
  ('buildwithclaude', 'https://buildwithclaude.com', 'website', true, 12, 'Primary website adapter; static/embedded JSON first.'),
  ('claude-plugin-hub', 'https://www.claudepluginhub.com', 'website', true, 12, 'Primary website adapter; static/embedded JSON first.'),
  ('aitmpl-agents', 'https://www.aitmpl.com/agents/', 'website', true, 12, 'AITmpl agents directory.'),
  ('aitmpl-plugins', 'https://www.aitmpl.com/plugins/', 'website', true, 12, 'AITmpl plugins directory.'),
  ('claude-official-plugins', 'https://claude.com/plugins', 'website', true, 10, 'Claude official plugin page; no auth bypass.'),
  ('claude-marketplace-github', 'https://github.com/claude-market/marketplace', 'github_repo', true, 30, 'Optional GitHub markdown adapter.'),
  ('awesome-claude-code', 'https://github.com/hesreallyhim/awesome-claude-code', 'github_repo', true, 30, 'Optional GitHub markdown adapter.'),
  ('awesome-claude-skills', 'https://github.com/travisvn/awesome-claude-skills', 'github_repo', true, 30, 'Optional GitHub markdown adapter.'),
  ('aitmpl-docs-index', 'https://docs.aitmpl.com/llms.txt', 'docs_index', true, 12, 'Optional docs index adapter.')
ON CONFLICT (name) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  source_type = EXCLUDED.source_type,
  enabled = EXCLUDED.enabled,
  rate_limit_per_minute = EXCLUDED.rate_limit_per_minute,
  notes = EXCLUDED.notes,
  updated_at = NOW();
