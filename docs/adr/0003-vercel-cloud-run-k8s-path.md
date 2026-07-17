# ADR-0003: Vercel plus Cloud Run first, Kubernetes later

## Status

Accepted

## Context

The current platform needs fast deployability with clear growth path.

## Decision

Deploy `apps/web` on Vercel, canonical data on Supabase, and long-running AI/worker services on Cloud Run first. Revisit Kubernetes when Cloud Run becomes limiting.

## Consequences

- Faster MVP deployment.
- Lower operational load.
- K8s remains an evolution path, not initial complexity.
