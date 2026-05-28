# Data Architect Notes

## Assumptions

- Supabase/Postgres is the production database because the repo already has Supabase migrations and clients.
- Local development may not have Supabase credentials, so ingestion needs a local fallback.
- Components must not be deleted when a source changes or temporarily fails.

## Implementation Choices

- Added `supabase/002_component_ingestion.sql` with source registry, crawl runs, raw items, normalized components, versions, errors, and sync state.
- Added full-text search and requested indexes for type, marketplace, author, timestamps, counts, and slug.
- Kept raw data separate from normalized data to preserve provenance and no-loss history.
- Added local JSON storage fallback at `.ingestion-cache/local-store.json`.

## Risks

- Supabase detail API does not yet join raw item provenance back into component detail records.
- Stale marking is schema-ready but intentionally conservative until source adapters can confirm complete inventories.

## Validation Results

- Typecheck/build pending final QA run.
- Unit tests cover stable hashing, normalization, dedupe candidates, and checkpoint persistence.
