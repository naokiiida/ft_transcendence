-- Games table for match history
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  player1_id TEXT NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
  player2_id TEXT REFERENCES users(uuid) ON DELETE SET NULL,
  winner_id TEXT REFERENCES users(uuid) ON DELETE SET NULL,
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK(status IN ('waiting', 'playing', 'finished', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);

-- プレイヤーごとの試合履歴検索用
CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);

-- ステータス別検索用（マッチメイキング、進行中ゲーム）
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- 作成日時順ソート用
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);
