# Spec: Preview-to-Production Release Gates V1

## Assumptions

1. GitHub Actions remains the deployment orchestration layer for Platform V1.
2. Vercel handles web preview/staging/production deployment when Vercel secrets exist.
3. Cloud Run service deployment remains placeholder-only until each service has an approved implementation ticket.
4. GitHub Environments (`preview`, `staging`, `production`) are configured outside the repository; production requires human approval in GitHub settings.
5. This spec does not authorize production deployment by agents.

## Objective

Add auditable release gates that prove every implementation PR can build a preview, require explicit staging/production promotion, preserve human production approval, and record rollback/canary evidence before production is considered ready.

Primary users:
- Engineering AI: gets deterministic pre-merge deployment validation.
- QA AI: gets a checklist and artifact path for release evidence.
- Deploy AI: gets bounded workflow behavior that cannot silently deploy production.
- Human approvers: receive clear evidence before approving production.

## Tech Stack

- GitHub Actions workflow YAML.
- Node.js validation scripts using built-in `node:assert`/`node:fs` modules.
- Existing Next.js/npm commands from `package.json`.
- Vercel CLI via `npx vercel` only when required Vercel secrets are present.

## Commands

```bash
npm run test:agentic-delivery
npm run test:release-gates
npm run check:spec-first -- .github/workflows/deploy-gated.yml package.json scripts/release-gates-smoke.test.mjs docs/qa/release-gate-evidence.md docs/specs/release-gates-v1.md docs/tickets/platform-v1/005-add-preview-to-production-release-gates.md
npm run typecheck
npm run build
```

## Project Structure

```text
.github/workflows/deploy-gated.yml        -> Preview/staging/production release-gate workflow
scripts/release-gates-smoke.test.mjs      -> Static contract test for release-gate safety rules
package.json                              -> npm script entry for release-gate validation
docs/qa/release-gate-evidence.md          -> QA/Deploy AI evidence checklist and rollback record template
docs/specs/release-gates-v1.md            -> This release-gate spec
docs/tickets/platform-v1/005-*.md         -> Implementation ticket and file boundary
```

## Code Style

Use explicit workflow names, readable step names, and environment guards instead of implicit shell behavior.

```yaml
production:
  if: github.event_name == 'workflow_dispatch' && inputs.target == 'production'
  runs-on: ubuntu-latest
  environment: production
  steps:
    - name: Verify release evidence exists
      run: npm run test:release-gates
    - name: Deploy production web after environment approval
      if: env.HAS_VERCEL_TOKEN == 'true'
      run: npx vercel deploy --prod --yes --token=${{ secrets.VERCEL_TOKEN }}
```

Conventions:
- Prefer positive, explicit gate names (`Verify rollback plan`) over vague names (`Check`).
- Keep production gated behind `workflow_dispatch`, `inputs.target == 'production'`, and `environment: production`.
- Tests should statically assert workflow safety contracts so accidental weakening fails CI.

## Testing Strategy

- Static contract test: parse workflow/docs as text and assert required preview, staging, production, canary, rollback, and human-approval controls exist.
- Existing agentic-delivery validation: proves the spec/ticket structure remains valid.
- Typecheck/build: ensures repo-wide CI parity with implementation PRs.
- No live deployment is required in CI; secrets may be absent and preview deploy should skip safely.

## Boundaries

- Always: require `npm run test:agentic-delivery`, `npm run test:release-gates`, `npm run typecheck`, and `npm run build` before PR.
- Always: keep production under GitHub Environment approval and manual workflow dispatch.
- Always: document rollback and canary evidence in `docs/qa/release-gate-evidence.md`.
- Ask first: adding new deployment providers, changing GitHub environment names, requiring new repository secrets, or enabling real Cloud Run deploys.
- Never: deploy production, hardcode secrets, weaken production approval, or make PR events capable of production deploy.

## Success Criteria

- Ticket 005 names an exact implementation file list and commands.
- Release-gate validation script is wired into `package.json`.
- `deploy-gated.yml` has deterministic preview checks for PRs and manual staging/production paths.
- Production remains manual and environment-gated.
- A rollback/canary evidence template exists for QA AI and Deploy AI.
- Required commands pass locally and in CI.

## Open Questions

- Which human reviewers own GitHub `production` environment approvals?
- Which exact Vercel project/org IDs should production use? Must remain in GitHub Secrets, not repository files.
- When Cloud Run services are implemented, which service-specific smoke endpoints become mandatory canaries?
