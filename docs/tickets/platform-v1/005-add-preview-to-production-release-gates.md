# Ticket 005: Add preview-to-production release gates

## Context

Add staging/prod workflows with required human approval and rollback evidence.

## Status

Spec-ready; implementation requires explicit approval or an implementation PR linked to this ticket.

## Files allowed to touch

To be finalized by Spec AI before coding.

## Tests required

- `npm run test:agentic-delivery`
- `npm run typecheck`
- Targeted tests for changed package/service

## Acceptance criteria

- Files changed match this ticket.
- API/data/AI boundaries match `docs/architecture/*`.
- CI and preview checks pass.
- QA AI signs off before production.
