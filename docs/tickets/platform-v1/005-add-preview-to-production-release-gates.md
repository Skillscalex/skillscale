# Ticket 005: Add preview-to-production release gates

## Context

Add staging/prod workflows with required human approval and rollback evidence.

## Spec

- `docs/specs/release-gates-v1.md`

## Status

Ready for implementation. This ticket explicitly allows one small implementation PR scoped to the files below. Agents must not deploy production; production promotion remains human-approved through GitHub Environments.

## Files allowed to touch

- `.github/workflows/deploy-gated.yml`
- `scripts/release-gates-smoke.test.mjs`
- `package.json`
- `docs/qa/release-gate-evidence.md`
- `docs/specs/release-gates-v1.md`
- `docs/tickets/platform-v1/005-add-preview-to-production-release-gates.md`

## Requirements

- Add or tighten a static release-gate smoke test that asserts:
  - PR events can run preview validation only.
  - Staging and production require `workflow_dispatch`.
  - Production requires `environment: production`.
  - Production deployment is conditional on deployment secrets.
  - Canary and rollback evidence are present in the workflow or QA evidence template.
- Wire the smoke test through `npm run test:release-gates`.
- Keep preview deploy optional when `VERCEL_TOKEN` is missing, but preserve build/test evidence.
- Add a QA/Deploy AI release evidence template with preview URL, checks, canary result, rollback command/plan, approver, and production decision fields.
- Do not add new providers, secrets, or real Cloud Run deploy commands in this ticket.

## Tests required

```bash
npm run test:agentic-delivery
npm run test:release-gates
npm run check:spec-first -- .github/workflows/deploy-gated.yml package.json scripts/release-gates-smoke.test.mjs docs/qa/release-gate-evidence.md docs/specs/release-gates-v1.md docs/tickets/platform-v1/005-add-preview-to-production-release-gates.md
npm run typecheck
npm run build
```

## Acceptance criteria

- Files changed match this ticket.
- `npm run test:release-gates` passes and fails if production can be triggered by PR events.
- Preview path validates build/test and skips live deploy safely when Vercel secrets are absent.
- Staging and production paths are manual dispatch only.
- Production job remains protected by `environment: production`.
- QA evidence template includes rollback and canary fields.
- CI and preview checks pass.
- QA AI signs off before production.

## Refactors allowed

- Rename workflow step labels for clarity.
- Reorder release-gate steps only when gate semantics remain equivalent or stricter.

## Observability requirements

- Workflow output must clearly state when preview deploy is skipped due to missing secrets.
- Canary output must include target URL and status code.
- QA evidence must record the relevant GitHub Actions run URL.

## Rollback plan

Revert this ticket's implementation PR. If production was manually deployed after human approval, use the documented provider rollback from `docs/qa/release-gate-evidence.md` and verify the GitHub Pages fallback remains reachable.
