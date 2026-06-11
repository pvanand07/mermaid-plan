CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  limits_json TEXT NOT NULL,
  monthly_cost_cap_usd REAL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  kinde_id TEXT UNIQUE,
  anonymous_key TEXT UNIQUE,
  email TEXT,
  given_name TEXT,
  family_name TEXT,
  picture TEXT,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  CHECK (
    (kinde_id IS NOT NULL AND anonymous_key IS NULL)
    OR (kinde_id IS NULL AND anonymous_key IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  scope TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  cached_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  reasoning_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd REAL,
  upstream_inference_cost_usd REAL,
  upstream_inference_input_cost_usd REAL,
  upstream_inference_output_cost_usd REAL,
  is_byok INTEGER NOT NULL DEFAULT 0,
  client_ip TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_created
  ON usage_events(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_usage_events_user_scope_created
  ON usage_events(user_id, scope, created_at);

INSERT OR IGNORE INTO plans (id, name, limits_json, monthly_cost_cap_usd) VALUES
(
  'anonymous',
  'Anonymous',
  '{"global":{"minute":10,"hour":50,"day":200,"week":800,"month":1200},"chat":{"minute":1,"hour":3,"day":10,"week":30,"month":45},"stream":{"minute":2,"hour":5,"day":10,"week":40,"month":60},"continue":{"minute":5,"hour":25,"day":50,"week":200,"month":300}}',
  1.0
),
(
  'free',
  'Free',
  '{"global":{"minute":25,"hour":180,"day":700,"week":3000,"month":4500},"chat":{"minute":3,"hour":10,"day":30,"week":100,"month":150},"stream":{"minute":4,"hour":20,"day":100,"week":400,"month":600},"continue":{"minute":10,"hour":75,"day":300,"week":1250,"month":1875}}',
  5.0
),
(
  'pro',
  'Pro',
  '{"global":{"minute":50,"hour":360,"day":1400,"week":6000,"month":9000},"chat":{"minute":10,"hour":40,"day":120,"week":400,"month":600},"stream":{"minute":20,"hour":100,"day":500,"week":2000,"month":3000},"continue":{"minute":30,"hour":200,"day":800,"week":3000,"month":4500}}',
  NULL
);
