# AI Orchestration Boundaries

AI services execute bounded jobs. They do not own product truth.

## Agents

- CEO AI: strategy and constraints.
- PM AI: requirements and roadmap.
- Research AI: evidence gathering.
- Architect AI: architecture, contracts, data models, ADRs.
- Spec AI: implementation specs and tickets.
- UX AI: page specs and experience system.
- Engineering AI: ticket-limited implementation.
- QA AI: independent verification.
- Deploy AI: preview/staging/prod workflow evidence.

## Runtime boundaries

- Agent outputs are artifacts committed to GitHub.
- Long-running orchestration belongs in Cloud Run initially.
- Production-impacting actions require explicit human approval or a GitHub environment approval gate.
- Agents may not approve their own outputs.
