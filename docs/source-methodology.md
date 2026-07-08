# Source Methodology

## Contributions By Source

- `buildwithclaude`: Claude ecosystem website entries; extracted through structured JSON if present, otherwise embedded JSON/static HTML.
- `claude-plugin-hub`: Claude plugin directory entries; JSON/embedded/static extraction.
- `aitmpl-agents`: agent templates from AITmpl.
- `aitmpl-plugins`: plugin templates from AITmpl.
- `claude-official-plugins`: Claude plugin page entries; no authentication or anti-bot bypass.
- `claude-marketplace-github`: GitHub markdown marketplace links.
- `awesome-claude-code`: GitHub awesome-list links for Claude Code tools.
- `awesome-claude-skills`: GitHub awesome-list links for skills.
- `aitmpl-docs-index`: docs index entries from `llms.txt`.
- `skillsmp-sitemap`: public SkillsMP skill sitemap URLs. These are real public skill records that can be mirrored without API credentials; direct detail pages may still be Cloudflare-challenged from CI or sandboxed environments.

## Extraction Method Labels

`raw_items.extraction_method` records one of:

- `api`
- `registry`
- `github`
- `sitemap`
- `static_html`
- `embedded_json`
- `playwright`

## Provenance Storage

Every raw item stores:

- source name and source URL
- crawl run ID
- first seen and last seen timestamps
- content hash
- raw payload JSON
- optional raw HTML text
- extraction method
- confidence score

Normalized components store source URLs and are versioned in `component_versions` on every write.

## Stale And Missing Records

Records are never deleted solely because a source omits them on a later crawl. The intended behavior is to keep the normalized component, preserve historical raw data, and mark source-specific raw items stale when a complete source inventory confirms absence.

The MVP schema includes `raw_items.is_missing_since_last_crawl`; source-specific stale marking should be enabled only when an adapter can prove it crawled the full source inventory.

## SkillsMP Mirror Coverage

`docs/data/skills-index` is the GitHub Pages static mirror. It should include every real SkillsMP record that the current pipeline can access, but it must not mark a group `complete` unless `localCount >= count` for that upstream occupation group.

Current full-corpus completion requires one of:

- a SkillsMP export imported with `scripts/import-skillsmp-mirror.mjs` into Supabase, or
- authenticated/paginated SkillsMP API access with enough quota to enumerate every skill.

Public sitemaps are imported during `npm run autonomous:skills:publish -- --allow-external-fetch --live`; they improve real mirrored coverage while preserving the remaining shard queue.
