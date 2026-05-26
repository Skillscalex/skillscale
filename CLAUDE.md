@AGENTS.md

# Skillscale — Claude Code Orchestration Guide

## Project Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase (Postgres + Auth), Stripe, Anthropic SDK
- Deployed on Vercel; Claude Code plugin at .claude-plugin/

## Light-Creamy Theme Tokens (globals.css CSS vars)
- --bg-base: #fdf8f3 (warm cream)
- --bg-surface: #fff9f4 (card surface)
- --bg-muted: #f5ede4 (muted areas)
- --accent: #7c3aed (brand violet, unchanged)
- --accent-hover: #6d28d9
- --text-primary: #1a0a2e (deep plum-black)
- --text-secondary: #5b4068 (muted purple-brown)
- --border: #e8d5c4 (warm beige border)
- --gem-diamond: #60efff; --gem-emerald: #00d97e
- --gem-pearl: #a78bfa; --gem-quartz: #a78bfa

## Usage Limits (respect at all times)
- Haiku: high volume, drafting, refactors (cheap)
- Sonnet: balanced logic, mid-complexity tasks
- Opus: planning only, reflection, final critique
- /usage-credits ON — monitor with /usage
- Plan mode: think hard before writing; use TodoWrite

## Essential Claude Code Commands

### Orchestration
- /plan — enter plan mode, show TodoWrite steps
- /todo — show current todo list
- /clear — clear context between tasks
- /compact — summarise long context
- /memory — edit CLAUDE.md persistent memory

### Superpowers & Skills
- /mcp — list connected MCP servers
- Bash("npx skillscale-fetch-skills") — fetch all skills DB
- WebSearch("...") — research online
- TodoWrite([...]) — write task plan
- Task("subagent", prompt) — spawn subagent

### AgentOS Pipeline Trigger
POST /api/orchestrate  body: { task, mode: "plan"|"execute" }
GET  /api/skills/sync  — sync skills DB from all sources
POST /api/audit        — run full agent audit pipeline

## Infinite Evolutionary Loop Protocol
Each iteration:
1. search_and_learn  — WebSearch 3+ sources, read docs
2. brainstorm        — TodoWrite with ranked options
3. design            — produce spec / wireframe description
4. critique          — list weaknesses, ask: what breaks this?
5. engineer          — architecture decision, data model
6. code              — Bash writes files, uses Haiku for volume
7. debug             — run lint, tsc, tests; read errors
8. validate          — a11y, mobile, perf checks
9. reflect           — score 0-100, identify top bottleneck
10. iterate          — fix top bottleneck, increment loop

Constraints: Never break existing API contracts.
Always mobile-first (375px base). Light-creamy theme enforced.

## File Map
- src/app/globals.css           ← design tokens (CSS vars)
- src/app/layout.tsx            ← root layout, theme class
- src/app/page.tsx              ← homepage hero + stats
- src/app/marketplace/page.tsx  ← skill grid
- src/components/AgentCostEstimator.tsx ← NEW: cost/time widget
- src/components/SkillCard.tsx  ← skill tile
- src/lib/anthropic.ts          ← agent runners
- src/lib/skills-db.ts          ← NEW: skills DB fetch/sync
- src/app/api/orchestrate/route.ts ← NEW: AgentOS endpoint
- AGENTS.md                     ← agent roster + loop
