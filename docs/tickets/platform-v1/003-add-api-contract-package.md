# Ticket 003: Add API contract package

## Context

Skillscale needs contract-first API definitions before route implementation. This ticket creates the first small vertical slice of the `packages/types` boundary named in `docs/agentic-delivery/00-overview.md`, `docs/architecture/service-boundaries.md`, and `docs/architecture/api-contracts.md`.

The package must define reusable TypeScript types for shared API response shapes and the first public skill search/read contracts. It must not implement Next.js routes, database access, orchestration jobs, or production deployment.

## Status

Approved for implementation under `docs/specs/platform-v1.md` as a small, contract-only vertical slice.

## Requirements

- Create a `packages/types` TypeScript package with side-effect-free type exports.
- Define shared API primitives:
  - `ApiError`
  - `ApiSuccess<T>`
  - `ApiResult<T>`
  - `Page<T>`
  - `Pagination`
- Define v1 skill API contracts for:
  - `GET /api/v1/skills/search`
  - `GET /api/v1/skills/:id`
- Include request, response, and error code types for each endpoint.
- Include explicit auth semantics in the types or adjacent constants:
  - Public read access for skill search and skill detail.
  - No service-role or private user/vault access in this package.
- Export contracts from one stable package entrypoint.
- Add a lightweight static smoke test that verifies required contract names and endpoint constants exist.

## Non-goals

- Do not implement API route handlers.
- Do not query Supabase or add migrations.
- Do not add runtime validation libraries or dependencies.
- Do not change production workflows, deployment configuration, or environment variables.
- Do not migrate the repository to full npm workspaces in this ticket.

## Files allowed to touch

Implementation PRs for this ticket may touch only these files:

- `packages/types/package.json`
- `packages/types/src/index.ts`
- `packages/types/src/api.ts`
- `packages/types/src/skills.ts`
- `packages/types/README.md`
- `scripts/api-contracts-smoke.test.mjs`
- `package.json`
- `tsconfig.json`
- `docs/tickets/platform-v1/003-add-api-contract-package.md`

Any additional file requires a ticket update before code changes.

## API contracts

The package must represent these endpoint constants and contract types:

```ts
export const skillApiEndpoints = {
  search: "/api/v1/skills/search",
  detail: "/api/v1/skills/:id",
} as const;

type ApiError = { error: { code: string; message: string; details?: unknown } };
type Page<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems?: number;
    nextCursor?: string;
  };
};
```

Minimum endpoint contracts:

- `SkillSearchRequest`
  - `query?: string`
  - `page?: number`
  - `pageSize?: number`
  - optional filters for category, source, and minimum secure score
- `SkillSearchResponse`
  - paginated `SkillSummary` rows
- `SkillDetailRequest`
  - `id: string`
- `SkillDetailResponse`
  - full `SkillDetail` row
- `SkillApiErrorCode`
  - at least `invalid_request`, `not_found`, and `internal_error`

## Data model changes

No database schema changes are allowed.

The contract types may define TypeScript-only shapes for public skill rows. These must align with the public/readable skill graph boundary in `docs/architecture/data-model.md` and must not expose private vault, user, billing, or service-role fields.

## AI orchestration boundaries

No AI orchestration runtime changes are allowed.

The package may define no orchestration job types in this slice. AI service contracts remain governed by `docs/architecture/ai-orchestration.md` and should be handled in a separate ticket.

## Tests to add or update

- Add `scripts/api-contracts-smoke.test.mjs` to statically verify:
  - `packages/types/src/index.ts` exports from `api.ts` and `skills.ts`.
  - `packages/types/src/api.ts` defines `ApiError`, `ApiResult`, and `Page`.
  - `packages/types/src/skills.ts` defines `skillApiEndpoints`, `SkillSearchRequest`, `SkillSearchResponse`, `SkillDetailRequest`, and `SkillDetailResponse`.
- Add an npm script named `test:api-contracts` that runs the smoke test.

## Commands required

```bash
npm run test:agentic-delivery
CHANGED_FILES="$(git diff --name-only origin/main...HEAD)" npm run check:spec-first
npm run test:api-contracts
npm run typecheck
npm run build
```

## Linting/typecheck/build expectations

- `npm run typecheck` must pass with strict TypeScript settings.
- `npm run build` must pass without requiring service-role keys or production secrets.
- Contract files must be side-effect-free and import no server-only or browser-only modules.

## Refactors allowed

- Only minimal `package.json` and `tsconfig.json` updates needed to expose and typecheck `packages/types` are allowed.
- No source movement from `src/` to `packages/` is allowed.

## Security considerations

- Do not commit secrets, tokens, real credentials, or generated environment files.
- Do not add service-role fields to public API contracts.
- Public skill detail contracts must avoid private user/vault/reputation evidence.
- The package must have no network, filesystem, subprocess, or environment-variable side effects.

## Observability requirements

No runtime observability events are emitted in this contract-only slice.

Contract comments or constants should reserve future compatibility with the API observability requirements in `docs/architecture/observability.md`, especially request completed/failed events for future route implementations.

## Acceptance criteria

- Allowed file list is respected.
- `packages/types` exists and exports stable API and skill contracts from `src/index.ts`.
- Skill search and skill detail endpoint constants and request/response types are present.
- `npm run test:api-contracts` passes.
- `npm run test:agentic-delivery`, spec-first check, `npm run typecheck`, and `npm run build` pass.
- PR links this ticket and GitHub issue #5.
- QA evidence is included in the PR body before merge.

## Rollback plan

Revert this ticket's PR. Because the slice is contract-only and has no runtime side effects, rollback removes the package files, smoke test, and script/tsconfig wiring without data migration or production action.
