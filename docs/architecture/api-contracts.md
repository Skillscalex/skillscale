# API Contracts

All public APIs use consistent JSON error semantics:

```ts
type ApiError = { error: { code: string; message: string; details?: unknown } };
type Page<T> = { data: T[]; pagination: { page: number; pageSize: number; totalItems?: number; nextCursor?: string } };
```

## Required v1 contracts

```text
GET /api/v1/skills/search
GET /api/v1/skills/:id
GET /api/v1/graph/node/:id
GET /api/v1/graph/neighbors/:id
POST /api/v1/orchestrations
GET /api/v1/orchestrations/:id
POST /api/v1/reputation/events
GET /api/v1/billing/entitlements
```

Every endpoint must define typed input, typed output, auth requirements, pagination, errors, observability events, and tests before implementation.
