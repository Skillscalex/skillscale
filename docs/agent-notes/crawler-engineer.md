# Crawler Engineer Notes

## Assumptions

- Structured extraction should be attempted before static HTML.
- Playwright should remain fallback-only and not be required for MVP.
- Robots and rate limits must apply to live runs.

## Implementation Choices

- Added `SourceAdapter` interface with discovery, fetch, extract, normalize, checkpoint methods, rate limits, and incremental support.
- Implemented generic adapters for primary and optional sources.
- Added extractors for registry JSON, GitHub markdown, embedded JSON, sitemap URLs, and static HTML.
- Added retry handling and `crawl_errors` persistence.

## Risks

- Live source DOMs may need source-specific selectors after the first production dry run.
- GitHub raw branch names may differ for some optional repos.

## Validation Results

- Fixture tests cover JSON, embedded JSON, static HTML, markdown, malformed HTML, missing fields, unknown types, duplicates, retries, and checkpoints.
