# Skillscale — AI Skills Marketplace

1
The marketplace for Claude Code plugins. Discover, buy, sell, and mint AI skills — tiered by gems, audited by AI agents, with Polymarket-style live trading.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** — dark Polymarket × App Store design system
- **Supabase** — Postgres, Auth, Realtime (live order book)
- **Stripe** — fiat payments (card, PayPal, multi-currency)
- **wagmi + viem** — crypto wallet payments
- **Anthropic Claude API** — AI agent audit pipeline

## Gem Tiers

| Tier | Score | Status |
|---|---|---|
| 💎 Diamond | 90–100 | Top quality |
| 💚 Emerald | 80–89 | High quality |
| 🤍 Pearl | 65–79 | Standard |
| 💜 Quartz | 50–64 | Basic |
| ⬛ Coal | 0–49 | Not listed |

## Agent Team

Three AI agents audit every skill on submission:

- **SecurityAuditor** (`claude-opus-4-7`) — security scanning, 40% weight
- **ModelMatcher** (`claude-sonnet-4-6`) — model recommendation, 30% weight
- **QualityChecker** (`claude-haiku-4-5`) — documentation quality, 30% weight

See [AGENTS.md](./AGENTS.md) for full rubrics and pipeline docs.

## Setup

```bash
cp .env.local.example .env.local
# Fill in Supabase, Stripe, Anthropic keys

npm install
npm run dev
```

Run Supabase migrations from `supabase/001_initial.sql` in your Supabase project SQL editor.

## Routes

| Route | Description |
|---|---|
| `/` | Home — featured, trending, free skills |
| `/marketplace` | Browse all skills with filters |
| `/skill/[id]` | Skill detail — trading panel, order book, audit |
| `/submit` | 5-step minting wizard |
| `/profile/[userId]` | Portfolio, transactions, token balance |
| `/api/skills` | CRUD skills |
| `/api/audit` | AI agent audit pipeline |
| `/api/stripe/checkout` | Stripe checkout sessions |
| `/api/tokens` | Platform SKL token transfers |

## Claude Plugin

This project is registered as a Claude Code plugin in `.claude-plugin/plugin.json`.

---

## Studio Page — Vision & Design Spec

The Studio page (`/studio`) is the command center for interacting with live AI agents. It should feel like a real AI production studio — not just a chat interface.

### Required Features

**1. Live Agent Chatbox**
- Full-width chat panel (60% width on desktop, full-width on mobile)
- Real-time streaming token display — text appears word-by-word as the agent responds
- Agent routing: prefix messages with `@video`, `@research`, `@coach`, or `@content` to target a specific agent
- Message history with timestamps, copy buttons, and per-message agent attribution
- Markdown rendering in responses (code blocks, tables, bullet lists)
- File attachment support (PDFs, images) for SkillCoachAgent

**2. Agent Status Panel (right sidebar)**
- Live status dot per agent: green (online), yellow (busy/processing), red (offline/error)
- Current job queue depth per agent
- Response latency metrics (p50, p95)
- Token usage counter for the current session
- One-click "restart agent" button

**3. Video Generation Panel**
- Topic input (large, prominent — the primary CTA)
- Voice selector: Nova / Echo / Fable / Onyx / Shimmer (with 5s audio previews)
- Duration picker: 30s / 60s / 90s / 3min
- Style: Educational / Motivational / Storytelling / Listicle
- Background music: Upbeat / Ambient / Cinematic / None
- Subtitles toggle
- Resolution: 1080p landscape / 9:16 portrait (TikTok/Reels)
- Real-time progress bar with stage labels: Researching → Scripting → Voiceover → Visuals → Assembling → Uploading
- Embedded `<video>` preview player once the job completes
- Download button + copy CDN share link

**4. Real-Time Job Queue**
- Global panel showing all in-flight jobs with progress bars
- Estimated time remaining per job
- Cancel button per job
- Job history: last 10 completed jobs with output links

### Layout Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  STUDIO                           [New Job]  [Settings]     │
├─────────────────────────────────┬───────────────────────────┤
│                                 │  AGENTS                   │
│  CHAT                           │  ● VideoAgent    [busy]   │
│                                 │  ● ContentAgent  [online] │
│  @video Generate a 60s video    │  ● ResearchAgent [online] │
│  about learning TypeScript      │  ● SkillCoach    [online] │
│                                 ├───────────────────────────┤
│  VideoAgent: Researching...     │  ACTIVE JOBS              │
│  VideoAgent: Writing script...  │  ┌─────────────────────┐  │
│  [████████░░] 78%               │  │ TypeScript video    │  │
│  Stage: Assembling video        │  │ [██████████] 78%    │  │
│                                 │  │ ~45s remaining      │  │
│  [message input...]         [→] │  └─────────────────────┘  │
└─────────────────────────────────┴───────────────────────────┘
```

### Current Critique — What's Missing

There is currently no `/studio` route in the project. The nearest analog is the `/vault` page — a static skill storage list with zero agent interaction. Key gaps:

1. **No live agent connection** — The entire UI runs on client-side mock data. No WebSocket layer exists.
2. **No streaming UI** — Nothing in the frontend renders incremental token output. Would need `useAgentSocket` hook + streaming state.
3. **No video pipeline** — No ffmpeg integration, no ElevenLabs TTS, no Pexels API, no progress tracking.
4. **Theme mismatch** — Vault/marketplace use dark `#0e0e16` backgrounds; the rest of the app uses light cream (`--bg-base: #fdf8f3`). Studio must use the cream theme.
5. **No agent health awareness** — No polling, no status indicators, no job queues anywhere in the frontend.
6. **Nav missing Studio link** — No `/studio` route in `src/app/layout.tsx` navigation.

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/studio/page.tsx` | Studio layout — chatbox + video panel + status bar |
| `src/hooks/useAgentSocket.ts` | WebSocket hook with auto-reconnect + streaming state |
| `src/components/studio/AgentChatbox.tsx` | Streaming chat with markdown rendering |
| `src/components/studio/VideoPanel.tsx` | Video generation form + real-time progress |
| `src/components/studio/AgentStatusBar.tsx` | Live status indicators with health polling |

---

## Real Agents Architecture

See [`src/agents/README.md`](./src/agents/README.md) for the full deployment and integration guide.

### Overview

```
Browser (Studio page)
  │
  │  WSS (WebSocket Secure)
  ▼
Agent Server (DigitalOcean / Railway / Render)
  ├── VideoAgent      → ElevenLabs TTS + ffmpeg + Pexels + Cloudflare R2
  ├── ContentAgent    → Claude claude-sonnet-4-6 streaming
  ├── ResearchAgent   → Tavily search + Puppeteer scraping + synthesis
  └── SkillCoachAgent → Claude + Supabase session memory
```

### Integration Map

| Surface | Agent | Action |
|---------|-------|--------|
| Marketplace skill card | ContentAgent | Auto-generate skill description on submit |
| Skill detail page | ResearchAgent | "Research this topic" button → live context |
| Profile page | SkillCoachAgent | "Start coaching session" → opens Studio tab |
| Submit wizard (step 3) | VideoAgent | Auto-generate demo video for new skill |
| Vault | ContentAgent | Draft a blog post promoting a vaulted skill |

### API Routes (Next.js)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/agents/status` | GET | Ping all agents, return health map |
| `/api/agents/job` | POST | Queue a new agent job, returns `{ jobId }` |
| `/api/agents/job/[id]` | GET | Poll job status (non-WebSocket fallback) |
| `/api/agents/history` | GET | Last 50 completed jobs for current user |
