-- Realtime skill marketplace schema.
-- Static GitHub Pages can stage data locally; production can mirror the same
-- concepts here and subscribe to changes through Supabase Realtime.

CREATE TABLE IF NOT EXISTS skill_market_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id TEXT NOT NULL,
  name TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'community',
  category TEXT NOT NULL DEFAULT 'General',
  outcome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','paused','resolved','cancelled')),
  last_price NUMERIC(8,4) NOT NULL DEFAULT 0.5000 CHECK (last_price >= 0 AND last_price <= 1),
  best_bid NUMERIC(8,4) NOT NULL DEFAULT 0.4900 CHECK (best_bid >= 0 AND best_bid <= 1),
  best_ask NUMERIC(8,4) NOT NULL DEFAULT 0.5100 CHECK (best_ask >= 0 AND best_ask <= 1),
  volume_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  volume_24h NUMERIC(14,2) NOT NULL DEFAULT 0,
  liquidity NUMERIC(14,2) NOT NULL DEFAULT 0,
  watchers INTEGER NOT NULL DEFAULT 0,
  ends_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_market_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES skill_market_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  side TEXT NOT NULL CHECK (side IN ('bid','ask')),
  limit_price NUMERIC(8,4) NOT NULL CHECK (limit_price > 0 AND limit_price < 1),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','filled','cancelled','expired')),
  source TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_market_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES skill_market_listings(id) ON DELETE CASCADE,
  bid_order_id UUID REFERENCES skill_market_orders(id) ON DELETE SET NULL,
  ask_order_id UUID REFERENCES skill_market_orders(id) ON DELETE SET NULL,
  price NUMERIC(8,4) NOT NULL CHECK (price > 0 AND price < 1),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_agent_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  source_reference TEXT,
  scope TEXT NOT NULL,
  reasoning_mode TEXT NOT NULL DEFAULT 'Scout',
  status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('staged','validated','published','rejected')),
  permissions TEXT[] NOT NULL DEFAULT '{}',
  generated_skill_md TEXT,
  provenance JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_market_listings_status ON skill_market_listings(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_market_listings_liquidity ON skill_market_listings(liquidity DESC);
CREATE INDEX IF NOT EXISTS idx_skill_market_orders_listing_side_price ON skill_market_orders(listing_id, side, limit_price DESC);
CREATE INDEX IF NOT EXISTS idx_skill_market_trades_listing_created ON skill_market_trades(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_agent_imports_user_created ON skill_agent_imports(user_id, created_at DESC);

CREATE OR REPLACE VIEW public_skill_market_snapshots AS
SELECT
  l.id,
  l.skill_id,
  l.name,
  l.author,
  l.category,
  l.outcome,
  l.status,
  l.last_price,
  l.best_bid,
  l.best_ask,
  GREATEST(l.best_ask - l.best_bid, 0) AS spread,
  l.volume_total,
  l.volume_24h,
  l.liquidity,
  l.watchers,
  l.ends_at,
  l.updated_at,
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object('price', bid_rows.limit_price, 'quantity', bid_rows.remaining_quantity) ORDER BY bid_rows.limit_price DESC)
    FROM (
      SELECT o.limit_price, o.remaining_quantity
      FROM skill_market_orders o
      WHERE o.listing_id = l.id AND o.side = 'bid' AND o.status IN ('open','partial')
      ORDER BY o.limit_price DESC
      LIMIT 5
    ) bid_rows
  ), '[]'::jsonb) AS bids,
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object('price', ask_rows.limit_price, 'quantity', ask_rows.remaining_quantity) ORDER BY ask_rows.limit_price ASC)
    FROM (
      SELECT o.limit_price, o.remaining_quantity
      FROM skill_market_orders o
      WHERE o.listing_id = l.id AND o.side = 'ask' AND o.status IN ('open','partial')
      ORDER BY o.limit_price ASC
      LIMIT 5
    ) ask_rows
  ), '[]'::jsonb) AS asks
FROM skill_market_listings l
WHERE l.status IN ('open','paused','resolved');

ALTER TABLE skill_market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_market_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_agent_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read skill market listings" ON skill_market_listings;
CREATE POLICY "Public read skill market listings"
ON skill_market_listings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public read open skill market orders" ON skill_market_orders;
CREATE POLICY "Public read open skill market orders"
ON skill_market_orders FOR SELECT
USING (status IN ('open','partial','filled'));

DROP POLICY IF EXISTS "Public read skill market trades" ON skill_market_trades;
CREATE POLICY "Public read skill market trades"
ON skill_market_trades FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated create own orders" ON skill_market_orders;
CREATE POLICY "Authenticated create own orders"
ON skill_market_orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated cancel own orders" ON skill_market_orders;
CREATE POLICY "Authenticated cancel own orders"
ON skill_market_orders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated create own agent imports" ON skill_agent_imports;
CREATE POLICY "Authenticated create own agent imports"
ON skill_agent_imports FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated read own agent imports" ON skill_agent_imports;
CREATE POLICY "Authenticated read own agent imports"
ON skill_agent_imports FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role writes skill market listings" ON skill_market_listings;
CREATE POLICY "Service role writes skill market listings"
ON skill_market_listings FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role writes skill market orders" ON skill_market_orders;
CREATE POLICY "Service role writes skill market orders"
ON skill_market_orders FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role writes skill market trades" ON skill_market_trades;
CREATE POLICY "Service role writes skill market trades"
ON skill_market_trades FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role writes agent imports" ON skill_agent_imports;
CREATE POLICY "Service role writes agent imports"
ON skill_agent_imports FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
