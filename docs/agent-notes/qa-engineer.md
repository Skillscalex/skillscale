# QA Engineer Notes

## Assumptions

- The repo has no existing test framework, so lightweight `jiti`-executed TypeScript tests are acceptable for MVP.
- Full Playwright screenshot testing requires adding a dependency later.

## Implementation Choices

- Added ingestion fixtures for each primary source class, malformed HTML, duplicates, missing optional fields, and unknown type records.
- Added ingestion tests for normalization, classification, dedupe, hashing, extraction, retries, and checkpoints.
- Added mobile layout smoke tests for required breakpoints and drawer structures.

## Risks

- Smoke checks do not replace real browser screenshots.
- Network-restricted environments can only validate fixture extraction, not live source quality.

## Validation Results

- Final lint, typecheck, ingestion tests, mobile smoke tests, and build results should be recorded after the quality gate run.
