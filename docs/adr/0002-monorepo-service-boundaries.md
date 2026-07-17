# ADR-0002: Monorepo with explicit service boundaries

## Status

Accepted

## Context

Skillscale spans frontend, backend APIs, AI services, ingestion, graph/reputation, billing, shared types, and infra.

## Decision

Use a monorepo with `apps/`, `services/`, `packages/`, `infra/`, and `docs/`. Existing `src/` remains during migration, but new platform work should move toward the boundary map in `docs/architecture/service-boundaries.md`.

## Consequences

- Shared contracts stay close to service code.
- CI can enforce boundary-aware checks.
- Migration must be incremental to avoid breaking the live site.
