# QA Engineer Notes

## Assumptions

- Ingestion tests should prevent silent regressions in normalization, classification, hashing, dedupe, checkpoints, retries, and source extraction.
- UI changes require viewport validation before shipping.
- Build, lint, typecheck, and tests should be run before final delivery when feasible.

## Implementation Choices

- Add fixtures for each supported source adapter.
- Add shared fixtures for malformed HTML, duplicate records, missing optional fields, and unknown component types.
- Cover source adapter extraction with deterministic fixture tests rather than relying on live network calls.
- Use Playwright viewport checks for mobile navigation, discovery tabs, card grid, filters, and detail drawer.
- Keep test claims aligned with implementation: partial or untested adapters must be documented as partial.

## Risks

- Live source tests can be flaky and should be separated from fixture-based unit tests.
- Playwright browser dependencies may not be installed in every environment.
- Build validation can fail for unrelated existing project issues; those should be reported separately from ingestion/UI regressions.

## Validation Results

- Pending. Run lint, typecheck, unit tests, build, and mobile viewport tests after implementation.
- Pending. Record command results here as the workstreams complete.
