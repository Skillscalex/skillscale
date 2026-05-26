# Crawler Engineer Notes

## Assumptions

- Source adapters should prefer structured data before HTML extraction.
- Crawling must respect robots.txt, published indexes, rate limits, and source access controls.
- Playwright extraction is a fallback, not the default path.
- A source is not fully supported until it has a tested adapter and fixture coverage.

## Implementation Choices

- Use a common adapter interface for discovery, fetching, extraction, normalization, checkpoints, and rate-limit metadata.
- Implement resumable runs through `sync_state` checkpoints and crawl run status transitions.
- Store raw payloads before normalization so failed normalization does not lose source evidence.
- Use retries with bounded backoff for transient fetch failures and persist failures to crawl error records.
- Classify extraction methods explicitly: API, registry, GitHub, sitemap, static HTML, embedded JSON, or Playwright.

## Risks

- Public websites may change markup without notice.
- Some listed sources may expose no reliable structured data and may only be suitable for partial support.
- Robots.txt or rate limits may restrict crawl depth or frequency.
- GitHub API rate limits may apply if unauthenticated requests are used.

## Validation Results

- Pending. Add fixture-backed adapter tests for every source claimed as supported.
- Pending. Confirm ingestion writes raw items and checkpoints before marking any source adapter complete.
