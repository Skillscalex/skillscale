# Skillscale Agent Team

## Agent Roster

| Agent | Model | Weight | Role |
|-------|-------|--------|------|
| Orchestrator | claude-opus-4-5 | — | Plans, delegates, reflects |
| Researcher | claude-sonnet-4-5 | 0.15 | WebSearch, trend analysis |
| Designer | claude-sonnet-4-5 | 0.15 | UI/UX critique, Figma specs |
| Engineer | claude-sonnet-4-5 | 0.20 | Architecture, TypeScript |
| Coder | claude-haiku-4-5 | 0.20 | File writes, refactors |
| Debugger | claude-sonnet-4-5 | 0.15 | Lint, test, error trace |
| Validator | claude-sonnet-4-5 | 0.10 | QA, a11y, perf audit |
| Reflector | claude-opus-4-5 | 0.05 | Critique, iterate signal |

## Evolutionary Loop (infinite, autonomous)
search_and_learn → brainstorm → design → critique → engineer →
code → debug → validate → reflect → iterate → repeat

## Adding a new agent
1. Define agent in this file with model, weight, output schema, system prompt
2. Implement runner in `src/lib/anthropic.ts` following existing pattern
3. Add to `runFullAudit` `Promise.all` array
4. Update weighted score formula
5. Update table above

---

*Agents are implemented in `src/lib/anthropic.ts`. Pipeline is triggered via `src/app/api/audit/route.ts`.*
*AgentOS cost estimator lives at `src/components/AgentCostEstimator.tsx`.*
