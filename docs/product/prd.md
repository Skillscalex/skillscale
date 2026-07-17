# Skillscale Platform PRD

## Objective

Build Skillscale into a deployable platform for skills discovery, AI orchestration, trust/reputation, continuous learning, and outcome monetization.

## Primary users

- Learners seeking skill paths and proof.
- Builders packaging skills into outcomes.
- Organizations seeking verified capability.
- AI agents needing tool/skill context.
- Admins moderating marketplace quality and trust.

## MVP scope

1. Public skills graph browser with static fallback and Supabase dynamic mode.
2. Canonical skill, agent, tool, outcome, and reputation data model.
3. AI orchestration boundary for Studio/agent workflows.
4. Trust/reputation display primitives.
5. Billing-ready entitlement model for subscriptions, usage, and value share.
6. CI/CD pipeline with preview, scans, QA, and production approval gates.

## Acceptance criteria

- Every new feature has PRD, architecture, ADR if needed, spec, ticket, implementation, QA evidence.
- Static GitHub Pages fallback remains functional.
- Dynamic backend can be deployed through Vercel + Supabase + Cloud Run.
- Skills graph model supports skill dependencies, trust edges, agents, tools, outcomes, learning events, and monetization events.
