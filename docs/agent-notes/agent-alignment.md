# Agent Alignment Notes

## Assumptions

- Internal agents should optimize for accurate discovery, provenance, safety, and user trust rather than maximizing catalog size.
- A source should be labeled partial or experimental unless tested extraction and normalization coverage exists.
- Ambiguous duplicates, risky install commands, and uncertain classifications should be surfaced rather than silently resolved.

## Implementation Choices

- Require confidence scores and extraction methods on source items.
- Preserve original categories and tags when classification is uncertain.
- Use `unknown` component type instead of forcing bad classifications.
- Mark duplicate candidates for review when confidence is low.
- Keep source support claims tied to fixtures, tests, and validation notes.

## Risks

- Automated normalization can overstate confidence in incomplete or noisy source records.
- Marketplace UI may imply endorsement if official verification and risk flags are not clearly represented.
- Agent-generated summaries can omit critical provenance or safety caveats.
- Ranking signals can bias toward popular GitHub projects while hiding useful niche components.

## Validation Results

- Pending. Verify UI distinguishes discovered, verified, stale, and risk-flagged components.
- Pending. Add tests for unknown classifications and uncertain duplicate candidates.
