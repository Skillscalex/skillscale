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

---

## Claude Code Best Practices

### VS Code Extension (Chatbox Mode)
Tips for using Claude Code inside the VS Code side panel:
- How to open the chatbox (Cmd+Shift+P → "Open Claude Code")
- How to reference open files with @ mentions
- Multi-file context: @filename1 @filename2 in a single prompt
- How to use the inline diff view and accept/reject individual hunks
- How to use "Add selection to Claude" for targeted edits
- Chatbox-specific keyboard shortcuts:
  - Cmd+Enter: submit prompt
  - Escape: cancel generation
  - Up/Down arrows: browse prompt history
  - Cmd+K: clear conversation
  - Cmd+Shift+L: toggle Claude panel

### Terminal Mode
Tips for using Claude Code from the CLI:
- `claude` — start interactive session
- `claude "your prompt"` — one-shot command
- `claude --continue` — resume last session
- `claude --model claude-opus-4-7` — specify model
- `claude --print` — non-interactive output mode (pipe-friendly)
- Piping: `cat error.log | claude "explain this error"`
- Using with git: `git diff | claude "write a commit message"`
- Headless mode for CI: `claude --print --no-interactive "run audit"`

### Slash Commands Reference
| Command | Description |
|---------|-------------|
| /help | List all available commands |
| /clear | Clear conversation context (start fresh) |
| /model | Switch model (haiku/sonnet/opus) |
| /plan | Enter plan mode — think before writing |
| /todo | Show current TodoWrite task list |
| /compact | Summarise context to save tokens |
| /memory | Edit CLAUDE.md persistent memory |
| /mcp | List connected MCP servers |
| /cost | Show token usage for current session |
| /diff | Show pending file changes |
| /undo | Undo last file edit |

### Writing Effective Prompts
**Be specific about scope:**
- Bad: "fix the auth"
- Good: "Fix the JWT expiry bug in src/lib/auth.ts:42 — tokens are not being refreshed before the 15-minute window"

**Give outcome, not method:**
- Bad: "add a useState hook"
- Good: "The modal should stay open when the user clicks outside it — currently it closes"

**Include relevant context:**
- Reference specific files: "see src/types/skill.ts for the Skill type"
- Reference recent changes: "after the refactor in commit abc123"
- Reference constraints: "must not break the existing API at /api/skills"

**Use structured requests for multi-step tasks:**
```
1. Read src/app/marketplace/page.tsx
2. Add a "sort by gem tier" dropdown above the skill grid
3. Keep mobile layout intact (375px base)
4. Use existing CSS vars from globals.css
```

**Iterative refinement:**
- Start broad, then narrow: first ask "what's wrong with this component?", then "fix the specific rendering issue on mobile"
- Use "only change X, leave Y alone" to constrain scope

### Using Context Files
- **@-mentions in chatbox:** Type `@src/lib/auth.ts` to attach a file to your prompt
- **CLAUDE.md:** The root CLAUDE.md is always loaded — put project-wide rules here
- **Nested CLAUDE.md:** Add sub-directory CLAUDE.md files for module-specific rules (e.g., `src/agents/CLAUDE.md`)
- **Context window management:** Use /compact when context gets long; use /clear between unrelated tasks
- **Relevant files only:** Don't attach large files unless needed — quality over quantity

### Multi-File Editing
- Describe the change, let Claude find the files: "Update all API routes to use the new auth middleware"
- For sweeping changes (rename, refactor): specify "update all files that import X"
- Chain edits: "After updating the type in skill.ts, update all components that use that type"
- Use TodoWrite to plan multi-file tasks before starting:
  ```
  TodoWrite([
    "Update Skill type in src/types/skill.ts",
    "Update SkillCard component",
    "Update marketplace page filter logic",
    "Update API route handler"
  ])
  ```

### Agentic Workflows
**Plan → Execute pattern:**
1. `/plan` to enter plan mode
2. Describe the feature fully
3. Claude produces a step-by-step TodoWrite plan
4. Review plan, then confirm execution
5. Claude executes each step, marking tasks complete

**Subagent dispatch (parallel work):**
```
Task("Fix failing tests in src/__tests__/ingestion.test.ts")
Task("Update marketplace UI for mobile breakpoint")
Task("Add WebSocket handler to src/agents/server.ts")
```

**Background tasks:** Kick off long-running agents for research or code generation while you work on other things — subagents run concurrently.

**Verification before completion:** Always run `npm run build && npm run lint` before marking a task done. Use the `verify` skill to test the running app.

---

## MCP (Model Context Protocol) — Plugins & Skills

### What is MCP?
Model Context Protocol lets Claude Code connect to external tools, databases, and APIs as first-class context sources. MCP servers expose resources (read-only data) and tools (callable actions) that Claude can use mid-conversation.

### Connected MCP Servers (Skillscale)
Run `/mcp` to see all live connections. Key servers for this project:

| Server | Purpose |
|--------|---------|
| `claude.ai Hugging Face` | Search models, papers, datasets on HF Hub |
| `claude.ai Excalidraw` | Create and save architecture diagrams |
| `claude.ai Google Drive` | Read/write project docs |
| `claude.ai Gmail` | Compose and read emails for notifications |
| `claude.ai ZipRecruiter` | Search job listings for skill demand research |

### Using MCP Tools in Prompts
Reference MCP tools by their full qualified name:
```
Use mcp__claude_ai_Hugging_Face__hf_doc_search to find documentation
on fine-tuning embedding models for skill similarity search.
```

Claude will call the tool, read the result, and incorporate it into the response — all inline, without leaving the chat.

### Skills System
Skills are reusable prompt programs stored in `.claude/plugins/`. Each skill has:
- A trigger condition (when to use it)
- A structured workflow (steps to follow)
- Tool call sequences (Bash, Edit, Read, etc.)

**Using a skill:**
```
/skill frontend-design     ← invoke by name
/skill superpowers:brainstorming  ← namespaced skill
```

**Key Skillscale skills:**
| Skill | When to use |
|-------|-------------|
| `superpowers:brainstorming` | Before any creative feature work |
| `superpowers:test-driven-development` | Before implementing any feature |
| `superpowers:systematic-debugging` | When hitting a bug or test failure |
| `superpowers:verification-before-completion` | Before claiming work is done |
| `frontend-design:frontend-design` | Building UI components |
| `gstack` | Browser QA testing, screenshots |
| `verify` | Run app and confirm changes work |

### Writing Custom Skills
Place skill files in `.claude/plugins/skills/`:
```markdown
---
name: my-skill
description: What this skill does and when to use it
---

# My Skill
## Steps
1. Do X
2. Do Y
3. Verify Z
```

Then invoke with `/skill my-skill`.

---

## File Map (Extended)
- src/agents/             ← Real agent servers (VideoAgent, ContentAgent, etc.)
- src/agents/server.ts    ← WebSocket server entry point
- src/agents/video.ts     ← VideoAgent: topic→script→TTS→video
- src/agents/content.ts   ← ContentAgent: scripts, blogs, social copy
- src/agents/research.ts  ← ResearchAgent: web search + summarise
- src/agents/coach.ts     ← SkillCoachAgent: personalized skill coaching
- src/app/studio/         ← Studio page: live chatbox + agent control room
