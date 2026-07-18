# Ticket 002: Implement canonical skills graph package

## Context

Add a small, dependency-free `packages/skills-graph` TypeScript package for canonical Skill/Agent/Tool/Outcome/Reputation graph primitives. This package is a pure domain boundary: it defines graph node and edge shapes plus validators/traversal helpers, but it must not call Supabase, Anthropic, filesystem APIs, network APIs, or app runtime code.

## Status

Approved for one small implementation PR under `docs/specs/platform-v1.md`, `docs/architecture/data-model.md`, and `docs/architecture/service-boundaries.md`.

## Files allowed to touch

Implementation PRs for this ticket may touch only:

- `packages/skills-graph/package.json`
- `packages/skills-graph/tsconfig.json`
- `packages/skills-graph/src/index.ts`
- `packages/skills-graph/src/types.ts`
- `packages/skills-graph/src/validators.ts`
- `packages/skills-graph/src/traversal.ts`
- `packages/skills-graph/src/__tests__/skills-graph.test.ts`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `docs/tickets/platform-v1/002-implement-canonical-skills-graph-package.md`

No other product, service, API route, UI, Supabase, or deployment files are in scope.

## Requirements

- Define canonical node kinds for `Skill`, `Agent`, `Tool`, `Outcome`, and `Reputation`.
- Define canonical edge kinds for `SKILL_DEPENDS_ON_SKILL`, `AGENT_USES_SKILL`, `TOOL_ENABLES_SKILL`, `SKILL_PRODUCES_OUTCOME`, `OUTCOME_HAS_VALUE`, and `SKILL_EARNED_REPUTATION`.
- Export TypeScript types for graph nodes, edges, graph snapshots, validation results, and traversal options.
- Add runtime validators that reject malformed nodes/edges with stable error codes and human-readable messages.
- Add pure traversal helpers for outgoing edges, incoming edges, neighbors, and dependency chains.
- Keep the package side-effect free and safe for both Node.js and browser consumers.

## Tests required

```bash
npm run test:agentic-delivery
npm run test:skills-graph
npm run check:spec-first -- packages/skills-graph/package.json packages/skills-graph/tsconfig.json packages/skills-graph/src/index.ts packages/skills-graph/src/types.ts packages/skills-graph/src/validators.ts packages/skills-graph/src/traversal.ts packages/skills-graph/src/__tests__/skills-graph.test.ts package.json package-lock.json tsconfig.json docs/tickets/platform-v1/002-implement-canonical-skills-graph-package.md
npm run typecheck
npm run build
```

## Acceptance criteria

- Files changed match the allowlist above.
- `packages/skills-graph` can be imported from TypeScript without pulling in app, service, database, network, or provider dependencies.
- Validators return deterministic validation results for valid and invalid nodes/edges.
- Traversal helpers are deterministic and do not mutate input graph snapshots.
- Graph node and edge names align with `docs/architecture/data-model.md`.
- Package boundary matches `docs/architecture/service-boundaries.md`.
- CI and preview checks pass before merge.
- QA AI signs off before production.

## Refactors allowed

- Minimal root `package.json`, `package-lock.json`, or `tsconfig.json` updates needed to expose the package and targeted test command.
- No repository-wide format, lint, import, app routing, or directory migration refactors.

## Observability requirements

None for this pure package slice. Future service consumers must emit observability events when graph operations become request-scoped or job-scoped.

## Rollback plan

Revert this ticket's implementation PR. Because the package is additive and has no runtime side effects, rollback should remove only the allowlisted package files and root script/config wiring.
