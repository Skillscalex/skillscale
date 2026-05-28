# Component Ingestion

## Architecture Overview

Skillscale now uses a source-adapter ingestion pipeline under `src/ingestion`. Each adapter discovers URLs, fetches raw content, extracts raw source items, normalizes them into components, and saves checkpoints.

Raw data and normalized data are separate. Raw payloads are always retained with source URL, crawl run ID, extraction method, confidence score, content hash, and first/last seen timestamps. Normalized components are upserted by canonical slug and versioned through `component_versions`.

## Source List

Implemented adapters:

- `buildwithclaude`
- `claude-plugin-hub`
- `aitmpl-agents`
- `aitmpl-plugins`
- `claude-official-plugins`
- `claude-marketplace-github`
- `awesome-claude-code`
- `awesome-claude-skills`
- `aitmpl-docs-index`

## Extraction Priority

Adapters use this order:

1. Registry/API JSON
2. GitHub markdown links
3. Embedded JSON
4. Static HTML cards
5. Playwright fallback placeholder

Playwright is intentionally optional for MVP and is not used unless installed and wired later.

## Schema Explanation

Migration `supabase/002_component_ingestion.sql` adds:

- `source_registry` for source metadata and rate limits
- `crawl_runs` for resumable crawl execution records
- `raw_items` for no-loss raw payload preservation
- `normalized_components` for discovery UI records
- `component_versions` for normalized snapshots
- `crawl_errors` for fetch/extraction failures
- `sync_state` for checkpoints and cursors

Full-text search uses a generated `search_document` tsvector over name, description, tags, categories, and author.

## How To Run Ingestion

```bash
npm run ingest:all
npm run ingest:source -- --source=buildwithclaude
npm run ingest:source -- --source=claude-official-plugins
npm run ingest:dry-run
npm run ingest:resume
```

Use `INGEST_ADMIN_TOKEN` for protected production admin API calls:

```bash
curl -X POST "$NEXT_PUBLIC_APP_URL/api/admin/ingest/run" \
  -H "Authorization: Bearer $INGEST_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"buildwithclaude","resume":true}'
```

## Adding A Source Adapter

1. Add a file in `src/ingestion/sources`.
2. Implement the `SourceAdapter` interface or instantiate `GenericSourceAdapter`.
3. Register it in `getSourceAdapters()` in `src/ingestion/index.ts`.
4. Add a fixture and extraction test.
5. Add the source to `source_registry` seed rows in the migration.

Do not mark a source fully supported until it has a tested adapter and fixture.

## Rate Limit And Robots Policy

Each adapter declares `requestsPerMinute`. `runIngestion` applies a rate limiter and checks `robots.txt` before fetching a URL. The crawler does not bypass authentication, paywalls, anti-bot systems, private APIs, or access controls.

## Update Strategy

Disappearing records are not deleted. Components remain in `normalized_components`; raw sightings preserve first/last seen. Future work should add per-run stale marking once source-specific complete inventories are available.

## Known Limitations

- Static HTML extraction is generic and may need source-specific selectors after live crawl review.
- Playwright fallback is a placeholder, not installed.
- Supabase provenance is currently available through raw/version tables; API detail responses can later join richer provenance.

## Future Improvements

- Add source-specific structured endpoints after live endpoint discovery.
- Add duplicate candidate review table.
- Add embeddings once vector search exists in the repo.
- Add source inventory stale marking by crawl run.
- Add Playwright extraction only for sources that cannot be statically extracted.
