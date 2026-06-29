# Skillscale Market Setup

`docs/market.html` runs on GitHub Pages without a backend. It stages agent imports and bid/ask orders in `localStorage` so the page stays usable while production infrastructure is being configured.

For durable realtime data, apply:

```bash
supabase db push
```

or paste `supabase/004_skill_market_realtime.sql` into the Supabase SQL editor.

## Data Model

- `skill_market_listings`: one dynamic market per skill/outcome.
- `skill_market_orders`: bid/ask limit orders.
- `skill_market_trades`: filled order records.
- `skill_agent_imports`: scoped Claude.ai, ChatGPT, or agent-access import records with provenance.
- `public_skill_market_snapshots`: public read view for cards, depth, spread, volume, liquidity, and realtime subscriptions.

## Production Flow

1. User stages an import in `market.html`.
2. Authenticated publish writes to `skill_agent_imports`.
3. Server-side audit validates `SKILL.md`, provenance, unsafe permissions, and duplicate listings.
4. Approved skills create or update `skill_market_listings`.
5. Orders insert into `skill_market_orders`; an edge function or worker matches crossing orders and writes `skill_market_trades`.
6. Supabase Realtime broadcasts listing/order/trade changes back to the page.

Keep API keys and service-role writes server-side. GitHub Pages should only use the public anon key for reads and authenticated user inserts.
