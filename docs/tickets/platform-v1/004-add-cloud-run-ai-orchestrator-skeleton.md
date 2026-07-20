# Ticket 004: Add Cloud Run AI orchestrator skeleton

## Context

Skillscale needs a deployable AI orchestration service boundary before production model/tool routing is added. This ticket creates the smallest safe vertical slice of the `services/ai-orchestrator` boundary named in `docs/agentic-delivery/00-overview.md`, `docs/architecture/service-boundaries.md`, `docs/architecture/ai-orchestration.md`, `docs/architecture/observability.md`, and `docs/architecture/system-architecture.md`.

The skeleton must prove the service can start, answer health checks, expose typed local job/status placeholders, and provide Cloud Run-compatible container metadata without calling external AI providers, reading secrets, deploying infrastructure, or modifying production workflows.

## Status

Approved for implementation under `docs/specs/platform-v1.md` as a small, skeleton-only vertical slice.

## Objective

Create a side-effect-light Node/TypeScript service boundary for future AI orchestration work so Engineering AI can add provider-backed jobs in later tickets without mixing long-running agent execution into the Next.js app.

Success means a local process can start on a configurable port, respond to `/health`, reject unsupported job routes with stable JSON errors, and pass static smoke tests without any provider credentials.

## Requirements

- Create a `services/ai-orchestrator` TypeScript service skeleton.
- Use only existing repository dependencies and Node built-ins; do not add a web framework dependency in this slice.
- Implement a minimal HTTP server with:
  - `GET /health` returning JSON service status.
  - `GET /ready` returning JSON readiness status.
  - `POST /v1/orchestrations` returning a typed `not_implemented` JSON error until provider-backed jobs are specified.
  - `GET /v1/orchestrations/:id` returning a typed `not_implemented` JSON error until persistence is specified.
- Read only safe runtime configuration:
  - `PORT` with default `8080` for Cloud Run compatibility.
  - `NODE_ENV` for status metadata.
- Add structured JSON log helpers for request started/completed/failed events.
- Add a Cloud Run-compatible `Dockerfile` that builds from the existing npm project and starts only the orchestrator service.
- Add a README documenting local run, container build, health endpoints, non-goals, and required future secrets.
- Add a static smoke test that verifies the service boundary, health routes, JSON error contract, and Dockerfile command exist.

## Non-goals

- Do not call Anthropic, OpenAI, ElevenLabs, Tavily, Pexels, Supabase, Cloudflare, or any other external provider.
- Do not add provider API keys, service-role keys, environment files, GitHub Secrets, or production configuration.
- Do not deploy to Cloud Run, Vercel, Railway, Render, or any production/staging environment.
- Do not add database migrations, queues, background workers, billing logic, reputation logic, or ingestion logic.
- Do not implement real job persistence, model routing, tool execution, WebSocket streaming, or Studio UI integration.
- Do not move existing `src/agents/server.ts` code in this ticket.
- Do not modify GitHub deployment gates; ticket 005 owns release-gate workflow changes.

## Files allowed to touch

Implementation PRs for this ticket may touch only these files:

- `services/ai-orchestrator/package.json`
- `services/ai-orchestrator/README.md`
- `services/ai-orchestrator/Dockerfile`
- `services/ai-orchestrator/src/index.ts`
- `services/ai-orchestrator/src/server.ts`
- `services/ai-orchestrator/src/config.ts`
- `services/ai-orchestrator/src/http.ts`
- `services/ai-orchestrator/src/observability.ts`
- `services/ai-orchestrator/src/contracts.ts`
- `scripts/ai-orchestrator-smoke.test.mjs`
- `package.json`
- `tsconfig.json`
- `docs/tickets/platform-v1/004-add-cloud-run-ai-orchestrator-skeleton.md`

Any additional file requires a ticket update before code changes.

## Service contract

Minimum health response shape:

```ts
type HealthResponse = {
  service: "ai-orchestrator";
  status: "ok";
  environment: string;
  timestamp: string;
};
```

Minimum placeholder error shape:

```ts
type OrchestratorError = {
  error: {
    code: "not_implemented" | "method_not_allowed" | "not_found" | "invalid_request" | "internal_error";
    message: string;
    requestId: string;
  };
};
```

Required routes:

```text
GET /health
GET /ready
POST /v1/orchestrations
GET /v1/orchestrations/:id
```

## Data model changes

No database schema changes are allowed.

The skeleton must not create persistence abstractions that imply ownership of product truth. Future job/event storage must be specified in a separate ticket and aligned with `docs/architecture/data-model.md` and Supabase RLS requirements.

## AI orchestration boundaries

The service may define local TypeScript contracts for future orchestration requests and statuses, but all executable behavior must remain placeholder-only.

The service must not own product truth. It may only expose the boundary where future bounded AI jobs will run, consistent with `docs/architecture/ai-orchestration.md`.

## Tests to add or update

- Add `scripts/ai-orchestrator-smoke.test.mjs` to statically verify:
  - `services/ai-orchestrator/src/server.ts` defines the required routes.
  - `services/ai-orchestrator/src/config.ts` defaults `PORT` to `8080`.
  - `services/ai-orchestrator/src/contracts.ts` defines `HealthResponse` and `OrchestratorError`.
  - `services/ai-orchestrator/src/observability.ts` includes structured request event names.
  - `services/ai-orchestrator/Dockerfile` starts the orchestrator service.
- Add an npm script named `test:ai-orchestrator` that runs the smoke test.

## Commands required

```bash
npm run test:agentic-delivery
CHANGED_FILES="$(git diff --name-only origin/main...HEAD)" npm run check:spec-first
npm run test:ai-orchestrator
npm run typecheck
npm run build
```

## Linting/typecheck/build expectations

- `npm run typecheck` must pass with strict TypeScript settings.
- `npm run build` must pass without provider API keys, service-role keys, or production secrets.
- The service files must import only Node built-ins or existing repository dependencies.
- The service must not start listening as an import side effect; startup belongs in `src/index.ts`.

## Refactors allowed

- Only minimal `package.json` and `tsconfig.json` updates needed to run and typecheck the service are allowed.
- No existing Next.js API routes, Studio pages, ingestion code, Supabase code, or live WebSocket agent code may be refactored in this ticket.

## Security considerations

- Do not commit secrets, tokens, real credentials, generated environment files, or Cloud Run service account data.
- Placeholder job routes must fail closed with `not_implemented` rather than accepting unvalidated work.
- Logs must not include request bodies, tokens, cookies, authorization headers, or provider prompts.
- CORS, authentication, rate limiting, and provider credential handling are future-ticket requirements and must not be improvised here.

## Observability requirements

- Emit structured JSON logs for request started/completed/failed events.
- Include request IDs in responses and log events.
- Include service name and route/method/status metadata in logs.
- Do not add external telemetry sinks or SaaS observability credentials in this slice.

## Acceptance criteria

- Allowed file list is respected.
- `services/ai-orchestrator` exists and exposes a Cloud Run-compatible local HTTP skeleton.
- Health/readiness routes return typed JSON status without requiring secrets.
- Orchestration placeholder routes return stable `not_implemented` JSON errors.
- `npm run test:ai-orchestrator` passes.
- `npm run test:agentic-delivery`, spec-first check, `npm run typecheck`, and `npm run build` pass.
- PR links this ticket and GitHub issue #6.
- QA evidence is included in the PR body before merge.

## Rollback plan

Revert this ticket's PR. Because the slice has no external calls, persistence, secrets, or deployment side effects, rollback removes only the service skeleton files, smoke test, and package/tsconfig script wiring.
