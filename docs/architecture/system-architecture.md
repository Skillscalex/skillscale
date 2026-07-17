# Skillscale System Architecture

## Initial topology

```text
Browser
  -> Vercel apps/web for Next.js frontend and API routes
  -> Supabase Auth/Postgres/RLS for canonical data
  -> Cloud Run services for AI orchestration, ingestion, reputation, billing workers
  -> GitHub Pages docs/ static fallback for public catalog resilience
```

## Later topology

Cloud Run services can migrate to Kubernetes when workload isolation, custom networking, autoscaling controls, or multi-region requirements justify the complexity.

## System qualities

- Spec-first implementation.
- Clear monorepo service boundaries.
- Contract-first APIs.
- Database ownership per service boundary.
- Human approval before production.
- Observability by default.
