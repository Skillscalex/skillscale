# Data Architect Notes

## Assumptions

- The ingestion system should use the repository's existing database stack when present.
- Raw source records and normalized components must both be retained across sync runs.
- Disappearing source records are stale/missing signals, not delete signals.
- Every source-derived record requires provenance: source, URL, crawl run, hashes, extraction method, confidence, and first/last seen timestamps.

## Implementation Choices

- Model ingestion around append-friendly crawl runs, raw item preservation, normalized component upserts, and component version snapshots.
- Add indexes for discovery filters, recency sorting, popularity sorting, canonical slug lookup, and full-text search.
- Preserve raw payload JSON and optional extracted text separately from normalized fields.
- Use content hashes and normalized hashes to decide whether to create a new version snapshot.
- Track missing items with flags and timestamps instead of deleting normalized records.

## Risks

- Multiple sources may describe the same component with conflicting metadata.
- Fuzzy duplicate detection can over-merge records if automated too aggressively.
- Existing Supabase projects may require manual migration ordering if prior migrations were applied outside this repo.
- Full-text and array indexing choices may need tuning after real crawl volume is known.

## Validation Results

- Pending. Validate migrations with local or staging Supabase before shipping ingestion changes.
- Pending. Confirm raw data preservation and checkpoint tables exist before enabling any crawler run.
