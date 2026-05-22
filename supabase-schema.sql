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