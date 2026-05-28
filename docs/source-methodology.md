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
