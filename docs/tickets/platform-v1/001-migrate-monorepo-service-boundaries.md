# Ticket 001: Migrate monorepo service boundaries

## Context

Create the initial npm workspace/service-boundary skeleton from `docs/agentic-delivery/00-overview.md` and `docs/architecture/service-boundaries.md` without moving existing product code. This ticket is a structural foundation only: it prepares directories and package metadata so later tickets can migrate code into approved boundaries incrementally.

## Status

Approved for one small implementation PR. Engineering AI may implement only the skeleton files named below; moving existing `src/`, `docs/`, or `supabase/` code remains out of scope until a later migration ticket names those files explicitly.

## Files allowed to touch

- `package.json`
- `package-lock.json`
- `apps/web/package.json`
- `apps/admin/package.json`
- `services/ai-orchestrator/package.json`
- `services/ingestion/package.json`
- `services/reputation/package.json`
- `services/billing/package.json`
- `packages/types/package.json`
- `packages/db/package.json`
- `packages/skills-graph/package.json`
- `packages/ui/package.json`
- `packages/observability/package.json`
- `docs/tickets/platform-v1/001-migrate-monorepo-service-boundaries.md`

## Implementation requirements

- Add npm workspace globs for `apps/*`, `services/*`, and `packages/*` at the repository root.
- Add a minimal `package.json` for each approved boundary with `private: true`, a stable `@skillscale/*` package name, and no runtime dependencies.
- Keep the existing Next.js app in its current root/`src` location for this ticket.
- Do not add deploy configuration, CI changes, TypeScript project references, source files, or generated app code in this ticket.
- Do not move, rename, or delete existing application files.

## Tests required

```bash
npm run test:agentic-delivery
npm run check:spec-first -- package.json package-lock.json apps/web/package.json apps/admin/package.json services/ai-orchestrator/package.json services/ingestion/package.json services/reputation/package.json services/billing/package.json packages/types/package.json packages/db/package.json packages/skills-graph/package.json packages/ui/package.json packages/observability/package.json
npm run typecheck
npm run build
```

## Acceptance criteria

- Files changed match this ticket.
- `npm install --package-lock-only` succeeds and updates lockfile workspace metadata without adding new dependencies.
- `npm run check:spec-first -- <changed files>` passes for the skeleton file list.
- `npm run typecheck` and `npm run build` still pass with the current root Next.js app.
- API/data/AI boundaries match `docs/architecture/*`.
- CI and preview checks pass.
- QA AI signs off before production.

## Refactors allowed

- Root package metadata may gain npm workspace declarations only.
- No source-code refactors are allowed.

## Observability requirements

None for the skeleton. Later service implementation tickets must add boundary-specific logging/metrics/tracing as described in `docs/architecture/observability.md`.

## Rollback plan

Revert the implementation PR. Because this ticket creates empty package boundaries only and does not move product code, rollback restores the current root app layout without data or runtime migration.
