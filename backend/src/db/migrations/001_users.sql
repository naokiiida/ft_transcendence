-- Users table (supports email/password and/or 42 OAuth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- NULL for OAuth-only users (bcrypt, cost 12)
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  intra_id TEXT UNIQUE,  -- 42 intra ID for OAuth linking
  intra_username TEXT UNIQUE,  -- 42 login (for display)
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  elo_rating INTEGER DEFAULT 1000,
  created_at TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'email',  -- 'email' or 'intra'
  CHECK(password_hash IS NOT NULL OR intra_id IS NOT NULL)  -- At least one auth method
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_intra_id ON users(intra_id);
CREATE INDEX IF NOT EXISTS idx_user_elo ON users(elo_rating);
