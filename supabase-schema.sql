-- Bid.Fast schema
-- Run this in your Supabase SQL editor to set up the database.
-- RLS is enabled on all tables with owner-only access policies.

-- Enable UUID extension (used by Supabase Auth)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'free',
  subscription_ends_at TIMESTAMPTZ,
  subscription_created_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS users_subscription_status_idx ON users(subscription_status);

CREATE TABLE IF NOT EXISTS estimates (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  voice_transcript TEXT NOT NULL,
  parsed_description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  total_labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_material_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  pdf_url TEXT,
  client_token VARCHAR(255),
  client_response VARCHAR(20),
  client_responded_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS estimates_user_id_idx ON estimates(user_id);
CREATE INDEX IF NOT EXISTS estimates_status_idx ON estimates(status);
CREATE INDEX IF NOT EXISTS estimates_client_token_idx ON estimates(client_token);
CREATE INDEX IF NOT EXISTS estimates_created_at_idx ON estimates(created_at DESC);

CREATE TABLE IF NOT EXISTS estimate_line_items (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(30) NOT NULL DEFAULT 'each',
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  item_type VARCHAR(20) NOT NULL DEFAULT 'labor',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS estimate_line_items_estimate_id_idx ON estimate_line_items(estimate_id);
CREATE INDEX IF NOT EXISTS estimate_line_items_item_type_idx ON estimate_line_items(item_type);

CREATE TABLE IF NOT EXISTS material_list_items (
  id SERIAL PRIMARY KEY,
  estimate_id INTEGER NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  material_name VARCHAR(500) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit VARCHAR(30) NOT NULL DEFAULT 'each',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  supplier_note TEXT,
  exported BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS material_list_items_estimate_id_idx ON material_list_items(estimate_id);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estimate_id INTEGER REFERENCES estimates(id) ON DELETE SET NULL,
  audio_url TEXT,
  raw_transcript TEXT NOT NULL,
  ai_parsed_json JSONB,
  session_type VARCHAR(30) NOT NULL DEFAULT 'new_estimate',
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS voice_sessions_user_id_idx ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS voice_sessions_estimate_id_idx ON voice_sessions(estimate_id);
CREATE INDEX IF NOT EXISTS voice_sessions_created_at_idx ON voice_sessions(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

-- users: owner-only
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid()::text = id);

-- estimates: owner-only (service role bypasses RLS for client_token lookups)
CREATE POLICY "estimates_select_own" ON estimates FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "estimates_insert_own" ON estimates FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "estimates_update_own" ON estimates FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "estimates_delete_own" ON estimates FOR DELETE USING (auth.uid()::text = user_id);

-- estimate_line_items: access via parent estimate ownership
CREATE POLICY "line_items_select_own" ON estimate_line_items FOR SELECT
  USING (estimate_id IN (SELECT id FROM estimates WHERE user_id = auth.uid()::text));
CREATE POLICY "line_items_insert_own" ON estimate_line_items FOR INSERT
  WITH CHECK (estimate_id IN (SELECT id FROM estimates WHERE user_id = auth.uid()::text));
CREATE POLICY "line_items_update_own" ON estimate_line_items FOR UPDATE
  USING (estimate_id IN (SELECT id FROM estimates WHERE user_id = auth.uid()::text));
CREATE POLICY "line_items_delete_own" ON estimate_line_items FOR DELETE
  USING (estimate_id IN (SELECT id FROM estimates WHERE user_id = auth.uid()::text));

-- material_list_items: access via parent estimate ownership
CREATE POLICY "materials_select_own" ON material_list_items FOR SELECT
  USING (estimate_id IN (SELECT id FROM estimates WHERE user_id = auth.uid()::text));
CREATE POLICY "materials_insert_own" ON material_list_items FOR INSERT
  WITH CHECK (estimate_id IN (SELECT id FROM estimates WHERE user_id = auth.uid()::text));
CREATE POLICY "materials_update_own" ON material_list_items FOR UPDATE
  USING (estimate_id IN (SELECT id FROM estimates WHERE user_id = auth.uid()::text));
CREATE POLICY "materials_delete_own" ON material_list_items FOR DELETE
  USING (estimate_id IN (SELECT id FROM estimates WHERE user_id = auth.uid()::text));

-- voice_sessions: owner-only
CREATE POLICY "voice_sessions_select_own" ON voice_sessions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "voice_sessions_insert_own" ON voice_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "voice_sessions_delete_own" ON voice_sessions FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
