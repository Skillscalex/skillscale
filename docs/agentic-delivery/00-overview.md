# Skillscale Agentic Delivery Operating System

Skillscale is built as **global skills and outcome infrastructure**, not as a one-off website. Every meaningful change moves through a narrow-agent pipeline with explicit handoffs, frozen decision artifacts, automated verification, preview environments, and human approval before production.

## Pipeline

```text
CEO AI -> PM AI -> Research AI -> Architect AI -> Spec AI -> UX AI -> Engineering AI -> QA AI -> Deploy AI -> Human production approval
```

## Hard rules

1. **No product code before specs.** Engineering agents may not touch `apps/`, `services/`, `packages/`, `src/`, `supabase/`, or `infra/` for a feature until the relevant PRD, architecture, ADR, spec, and ticket are present.
2. **Frozen architecture before implementation.** Architecture changes require an ADR before code changes.
3. **Narrow roles.** Each agent owns one phase and reviews the previous phase; no agent approves its own output.
4. **Every ticket names files and tests.** Coding work must state exact files, test commands, lint/typecheck/build commands, refactors, and rollback plan.
5. **Preview before production.** Every implementation PR must produce automated test evidence and a preview environment before human production approval.
6. **Living graph first.** Product design centers the skills graph, trust/reputation, AI orchestration, learning loops, and monetization.

## Canonical artifacts

| Phase | Artifact |
|---|---|
| CEO AI | `docs/strategy/vision.md` |
| PM AI | `docs/product/prd.md` |
| Research AI | `docs/research/*.md` |
| Architect AI | `docs/architecture/*.md`, `docs/adr/*.md` |
| Spec AI | `docs/specs/*.md`, `docs/tickets/**/*.md` |
| UX AI | `docs/ux/*.md` |
| Engineering AI | implementation PRs linked to approved tickets |
| QA AI | `docs/qa/*.md` and PR review evidence |
| Deploy AI | GitHub Actions logs, preview URLs, release gate records |

## Service boundary target

```text
apps/web                 Next.js web app and public APIs
apps/admin               internal moderation/admin console, later
services/ai-orchestrator agent routing, model calls, tool execution
services/ingestion       skills mirror ingestion and normalization
services/reputation      trust/reputation scoring
services/billing         subscriptions, usage fees, value-share accounting
packages/types           shared TypeScript contracts
packages/db              schema, migrations, Supabase helpers
packages/skills-graph    graph primitives and traversal utilities
packages/ui              shared components
packages/observability   logging, metrics, traces
infra/                   Vercel, Cloud Run, later K8s/Terraform
```

The current repository can migrate toward this structure incrementally. Until migration tickets are approved, existing `src/`, `docs/`, and `supabase/` locations remain valid.
