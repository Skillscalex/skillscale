# Testing Strategy

## Required checks per implementation PR

- `npm run typecheck`
- `npm run build`
- targeted unit/integration tests
- `npm run test:agentic-delivery`
- `npm audit --audit-level=high`
- secret scan
- preview smoke test

## Test levels

| Level | Purpose |
|---|---|
| Unit | pure domain utilities and graph logic |
| Integration | API contracts, DB/RLS, service boundaries |
| E2E | critical browser flows and static fallback |
| Security | authz, secrets, dependency and prompt-risk checks |
| Deployment | preview health, canary, rollback readiness |
