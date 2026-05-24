-- Skillscale Database Schema

-- Users (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  platform_token_balance INTEGER NOT NULL DEFAULT 0,
  wallet_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  gem_tier TEXT NOT NULL DEFAULT 'coal' CHECK (gem_tier IN ('coal','quartz','pearl','emerald','diamond')),
  price_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  crypto_price_eth NUMERIC(18,8),
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  is_minted BOOLEAN NOT NULL DEFAULT FALSE,
  nft_token_id TEXT,
  plugin_json JSONB,
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}',
  secure_score INTEGER CHECK (secure_score BETWEEN 0 AND 100),
  model_recommendation TEXT,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders (order book)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('buy','sell')),
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','filled','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('stripe','crypto','token')),
  stripe_session_id TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent audits
CREATE TABLE IF NOT EXISTS agent_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  security_score INTEGER CHECK (security_score BETWEEN 0 AND 100),
  model_score INTEGER CHECK (model_score BETWEEN 0 AND 100),
  quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  total_score INTEGER CHECK (total_score BETWEEN 0 AND 100),
  flagged_issues JSONB,
  model_recommendation TEXT,
  security_result JSONB,
  model_result JSONB,
  quality_result JSONB,
  audit_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform events (realtime feed)
CREATE TABLE IF NOT EXISTS platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skills_gem_tier ON skills(gem_tier);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_creator ON skills(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_skill ON orders(skill_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_skill ON transactions(skill_id);
CREATE INDEX IF NOT EXISTS idx_agent_audits_skill ON agent_audits(skill_id);

-- Enable Realtime for live order book
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_events;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER skills_updated_at BEFORE UPDATE ON skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
