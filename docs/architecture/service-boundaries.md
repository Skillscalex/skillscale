# Service Boundaries

| Boundary | Owns | Must not own | Deployment |
|---|---|---|---|
| `apps/web` | public UI, marketplace, Studio UI, read APIs | long-running workers, service-role writes | Vercel |
| `services/ai-orchestrator` | agent routing, model calls, tool execution boundaries | billing ledger, direct public UI state | Cloud Run |
| `services/ingestion` | skills mirror discovery, normalization, dedupe, static shard publishing | user private vault | GitHub Actions/Cloud Run |
| `services/reputation` | trust/reputation scoring, evidence aggregation | payment collection | Cloud Run |
| `services/billing` | subscriptions, usage fees, value-share ledgers | skill graph truth | Cloud Run |
| `packages/types` | API/domain contracts | runtime side effects | npm workspace package |
| `packages/db` | migrations, Supabase clients, RLS helpers | UI components | npm workspace package |
| `packages/skills-graph` | graph primitives/traversal | service secrets | npm workspace package |
| `packages/observability` | logging, metrics, traces | business decisions | npm workspace package |
