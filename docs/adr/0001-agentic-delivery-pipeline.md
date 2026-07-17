# ADR-0001: Agentic delivery pipeline with frozen handoffs

## Status

Accepted

## Context

Skillscale needs autonomous velocity without letting coding agents drift away from strategy, architecture, safety, or user intent.

## Decision

Adopt a CEO AI -> PM AI -> Research AI -> Architect AI -> Spec AI -> UX AI -> Engineering AI -> QA AI -> Deploy AI pipeline. No feature implementation code may begin until strategy/requirements/architecture/ADR/spec/ticket artifacts exist for that feature.

## Consequences

- More upfront documentation.
- Less implementation drift and rework.
- Easier autonomous operation because each agent has a narrow role and explicit handoff.
