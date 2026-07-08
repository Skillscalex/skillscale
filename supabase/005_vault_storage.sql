-- Private Vault storage for static GitHub Pages and the Next.js app.
-- Browser clients may only read or write rows that belong to auth.uid().

CREATE TABLE IF NOT EXISTS vault_items (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  collection TEXT NOT NULL CHECK (collection IN ('dreamed','owned')),
  name TEXT NOT NULL,
  author TEXT,
  score INTEGER,
  tier TEXT,
  note TEXT NOT NULL DEFAULT '',
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id, collection)
);

CREATE INDEX IF NOT EXISTS idx_vault_items_user_saved ON vault_items(user_id, saved_at DESC);

ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own vault items" ON vault_items;
CREATE POLICY "Users read their own vault items"
ON vault_items FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own vault items" ON vault_items;
CREATE POLICY "Users insert their own vault items"
ON vault_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their own vault items" ON vault_items;
CREATE POLICY "Users update their own vault items"
ON vault_items FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete their own vault items" ON vault_items;
CREATE POLICY "Users delete their own vault items"
ON vault_items FOR DELETE
USING (auth.uid() = user_id);
