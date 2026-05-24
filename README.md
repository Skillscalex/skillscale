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
