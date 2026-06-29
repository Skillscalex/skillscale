-- Full SkillsMP mirror schema.
-- Designed for large catalog mirrors where GitHub Pages should read paginated
-- public rows from Supabase instead of shipping all records as static JSON.

CREATE TABLE IF NOT EXISTS skillsmp_occupation_groups (
  id TEXT PRIMARY KEY,
  soc_code TEXT UNIQUE,
  label TEXT NOT NULL,
  indexed_count INTEGER NOT NULL DEFAULT 0,
  mirrored_count INTEGER NOT NULL DEFAULT 0,
  source_url TEXT,
  mirror_status TEXT NOT NULL DEFAULT 'queued' CHECK (mirror_status IN ('queued','running','partial','complete','failed')),
  last_mirrored_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skillsmp_mirror_skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  skillsmp_url TEXT,
  author TEXT NOT NULL DEFAULT 'community',
  author_url TEXT,
  github_url TEXT,
  date_modified TIMESTAMPTZ,
  description TEXT NOT NULL DEFAULT '',
  categories TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  readme TEXT,
  stars INTEGER NOT NULL DEFAULT 0,
  install_command TEXT,
  occupation_ids TEXT[] NOT NULL DEFAULT '{}',
  primary_occupation_id TEXT NOT NULL REFERENCES skillsmp_occupation_groups(id) ON DELETE RESTRICT,
  similar_skills TEXT[] NOT NULL DEFAULT '{}',
  raw_payload JSONB NOT NULL DEFAULT '{}',
  content_hash TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_updated_at TIMESTAMPTZ,
  search_document TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(categories, ' ')), 'C') ||
    setweight(to_tsvector('english', coalesce(author,'')), 'C')
  ) STORED
);

CREATE TABLE IF NOT EXISTS skillsmp_mirror_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','partial','failed')),
  source TEXT NOT NULL DEFAULT 'skillsmp',
  occupation_id TEXT REFERENCES skillsmp_occupation_groups(id) ON DELETE SET NULL,
  pages_seen INTEGER NOT NULL DEFAULT 0,
  rows_seen INTEGER NOT NULL DEFAULT 0,
  rows_upserted INTEGER NOT NULL DEFAULT 0,
  errors_count INTEGER NOT NULL DEFAULT 0,
  checkpoint_json JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_skillsmp_mirror_primary_occ ON skillsmp_mirror_skills(primary_occupation_id);
CREATE INDEX IF NOT EXISTS idx_skillsmp_mirror_occ_ids ON skillsmp_mirror_skills USING GIN(occupation_ids);
CREATE INDEX IF NOT EXISTS idx_skillsmp_mirror_stars ON skillsmp_mirror_skills(stars DESC);
CREATE INDEX IF NOT EXISTS idx_skillsmp_mirror_last_seen ON skillsmp_mirror_skills(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_skillsmp_mirror_search ON skillsmp_mirror_skills USING GIN(search_document);
CREATE INDEX IF NOT EXISTS idx_skillsmp_mirror_tags ON skillsmp_mirror_skills USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_skillsmp_mirror_categories ON skillsmp_mirror_skills USING GIN(categories);

CREATE OR REPLACE VIEW public_skillsmp_occupation_counts AS
SELECT
  id,
  soc_code,
  label,
  indexed_count,
  mirrored_count,
  source_url,
  CASE
    WHEN indexed_count > 0 AND mirrored_count >= indexed_count THEN 'complete'
    WHEN mirrored_count > 0 THEN 'partial'
    ELSE mirror_status
  END AS mirror_status,
  CASE
    WHEN indexed_count > 0 THEN round((mirrored_count::numeric / indexed_count::numeric) * 100, 4)
    ELSE 0
  END AS coverage_percent,
  last_mirrored_at,
  updated_at
FROM skillsmp_occupation_groups;

CREATE OR REPLACE VIEW public_skillsmp_skills AS
SELECT
  id,
  name,
  skillsmp_url,
  author,
  author_url,
  github_url,
  date_modified,
  description,
  categories,
  tags,
  stars,
  occupation_ids,
  primary_occupation_id,
  first_seen_at,
  last_seen_at,
  source_updated_at
FROM skillsmp_mirror_skills;

ALTER TABLE skillsmp_occupation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE skillsmp_mirror_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skillsmp_mirror_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read occupation mirror counts" ON skillsmp_occupation_groups;
CREATE POLICY "Public read occupation mirror counts"
ON skillsmp_occupation_groups FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public read mirrored skills" ON skillsmp_mirror_skills;
CREATE POLICY "Public read mirrored skills"
ON skillsmp_mirror_skills FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Service role writes occupation mirror counts" ON skillsmp_occupation_groups;
CREATE POLICY "Service role writes occupation mirror counts"
ON skillsmp_occupation_groups FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role writes mirrored skills" ON skillsmp_mirror_skills;
CREATE POLICY "Service role writes mirrored skills"
ON skillsmp_mirror_skills FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role writes mirror runs" ON skillsmp_mirror_runs;
CREATE POLICY "Service role writes mirror runs"
ON skillsmp_mirror_runs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
