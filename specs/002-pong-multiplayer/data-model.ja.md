# データモデル: ft_transcendence

**機能**: 002-pong-multiplayer
**日付**: 2026-01-06
**データベース**: WALモードのSQLite

## エンティティ関係図

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    User     │───────│    Friendship    │───────│    User     │
└─────────────┘       └──────────────────┘       └─────────────┘
      │                                                │
      │                                                │
      ▼                                                ▼
┌─────────────┐                               ┌─────────────┐
│    Game     │◄──────────────────────────────│    Game     │
│  (player1)  │                               │  (player2)  │
└─────────────┘                               └─────────────┘
      │
      │
      ▼
┌─────────────────────┐       ┌─────────────────────┐
│    Tournament       │───────│ TournamentParticipant│
└─────────────────────┘       └─────────────────────┘
      │
      │
      ▼
┌─────────────────────┐
│  TournamentMatch    │
└─────────────────────┘
```

## エンティティ

### User

メール/パスワードまたは42 OAuth（または両方）で認証された登録ユーザーを表します。

| フィールド | 型 | 制約 | 説明 |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| email | TEXT | UNIQUE, NOT NULL | メールアドレス（一意の識別子） |
| password_hash | TEXT | NULL | bcryptハッシュ（OAuth専用ユーザーはNULL） |
| display_name | TEXT | NOT NULL, 最大32文字 | 編集可能な表示名 |
| avatar_url | TEXT | NULL | アップロードされたアバターへのパスまたはデフォルトの場合NULL |
| intra_id | TEXT | UNIQUE, NULL | 42 intra ID（OAuthリンク用） |
| intra_username | TEXT | UNIQUE, NULL | 42 intraログイン（表示用） |
| oauth_access_token | TEXT | NULL | 42 OAuthアクセストークン（保存時暗号化） |
| oauth_refresh_token | TEXT | NULL | 42 OAuthリフレッシュトークン（保存時暗号化） |
| wins | INTEGER | DEFAULT 0 | 全ゲームの総勝利数 |
| losses | INTEGER | DEFAULT 0 | 全ゲームの総敗北数 |
| elo_rating | INTEGER | DEFAULT 1000 | ランキングスコア（ELOシステム） |
| created_at | TEXT | NOT NULL | ISO 8601タイムスタンプ |
| last_seen | TEXT | NOT NULL | ISO 8601タイムスタンプ（アクティビティで更新） |

**インデックス**:
- `idx_user_email` on `email`
- `idx_user_intra_id` on `intra_id`
- `idx_user_elo` on `elo_rating`（リーダーボード用）

**制約**:
- 少なくとも1つの認証方法: CHECK(password_hash IS NOT NULL OR intra_id IS NOT NULL)

**バリデーションルール**（Zod）:
- `email`: 有効なメール形式（正規表現）
- `password`: 8文字以上（ハッシュ化前）
- `display_name`: 1-32文字、英数字+スペース+アンダースコア
- `avatar_url`: 有効なURLパスまたはnull

---

### Session

ユーザー認証セッション（HTTP専用Cookie）を管理します。

| フィールド | 型 | 制約 | 説明 |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | セッショントークン（セキュアランダム） |
| user_id | TEXT | FK → User.id, NOT NULL | 関連ユーザー |
| expires_at | TEXT | NOT NULL | ISO 8601有効期限タイムスタンプ |
| created_at | TEXT | NOT NULL | ISO 8601タイムスタンプ |

**インデックス**:
- `idx_session_user` on `user_id`
- `idx_session_expires` on `expires_at`（クリーンアップジョブ用）

**TTL**: セッションは24時間の非アクティブで期限切れ。

---

### Friendship

リクエスト/承認フローを持つ双方向のフレンド関係。

| フィールド | 型 | 制約 | 説明 |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| requester_id | TEXT | FK → User.id, NOT NULL | リクエストを送信したユーザー |
| addressee_id | TEXT | FK → User.id, NOT NULL | リクエストを受信したユーザー |
| status | TEXT | NOT NULL | 'pending' \| 'accepted' \| 'declined' |
| created_at | TEXT | NOT NULL | ISO 8601タイムスタンプ |
| updated_at | TEXT | NOT NULL | ISO 8601タイムスタンプ |

**インデックス**:
- `idx_friendship_requester` on `requester_id`
- `idx_friendship_addressee` on `addressee_id`
- `idx_friendship_status` on `status`

**制約**:
- UNIQUE(requester_id, addressee_id) - 重複リクエストを防止
- CHECK(requester_id != addressee_id) - 自分自身をフレンドにできない

**状態遷移**:
```
[なし] ──(リクエスト送信)──► pending
pending ──(承認)──► accepted
pending ──(拒否)──► declined
accepted ──(フレンド解除)──► [削除]
```

---

### Game

完了したまたは進行中のPongマッチを表します。

| フィールド | 型 | 制約 | 説明 |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| player1_id | TEXT | FK → User.id, NOT NULL | 左パドルプレイヤー |
| player2_id | TEXT | FK → User.id, NULL | 右パドルプレイヤー（AIの場合NULL） |
| winner_id | TEXT | FK → User.id, NULL | 勝者（進行中はNULL） |
| player1_score | INTEGER | DEFAULT 0 | プレイヤー1のスコア |
| player2_score | INTEGER | DEFAULT 0 | プレイヤー2のスコア |
| game_type | TEXT | NOT NULL | 'quick' \| 'tournament' \| 'ai' |
| ai_difficulty | TEXT | NULL | 'easy' \| 'medium' \| 'hard'（AIゲームの場合） |
| tournament_match_id | TEXT | FK → TournamentMatch.id, NULL | トーナメントへのリンク |
| status | TEXT | NOT NULL | 'waiting' \| 'playing' \| 'completed' \| 'forfeit' |
| started_at | TEXT | NULL | ISO 8601タイムスタンプ |
| ended_at | TEXT | NULL | ISO 8601タイムスタンプ |
| created_at | TEXT | NOT NULL | ISO 8601タイムスタンプ |

**インデックス**:
- `idx_game_player1` on `player1_id`
- `idx_game_player2` on `player2_id`
- `idx_game_status` on `status`
- `idx_game_type` on `game_type`
- `idx_game_created` on `created_at`（履歴クエリ用）

**状態遷移**:
```
[作成] ──(プレイヤー参加)──► waiting
waiting ──(両者準備完了)──► playing
playing ──(スコア=11)──► completed
playing ──(切断タイムアウト)──► forfeit
```

---

### Tournament

シングルエリミネーション方式のトーナメントブラケット。

| フィールド | 型 | 制約 | 説明 |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | NOT NULL, 最大64文字 | トーナメント名 |
| creator_id | TEXT | FK → User.id, NOT NULL | トーナメントを作成したユーザー |
| max_players | INTEGER | NOT NULL | 4 \| 8 \| 16 |
| status | TEXT | NOT NULL | 'open' \| 'ready' \| 'in_progress' \| 'completed' |
| winner_id | TEXT | FK → User.id, NULL | トーナメント優勝者 |
| created_at | TEXT | NOT NULL | ISO 8601タイムスタンプ |
| started_at | TEXT | NULL | ISO 8601タイムスタンプ |
| ended_at | TEXT | NULL | ISO 8601タイムスタンプ |

**インデックス**:
- `idx_tournament_creator` on `creator_id`
- `idx_tournament_status` on `status`

**状態遷移**:
```
[作成] ──► open
open ──(最大プレイヤー参加)──► ready
ready ──(作成者が開始)──► in_progress
in_progress ──(決勝戦終了)──► completed
```

---

### TournamentParticipant

ユーザーをシード順でトーナメントにリンクします。

| フィールド | 型 | 制約 | 説明 |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| tournament_id | TEXT | FK → Tournament.id, NOT NULL | トーナメント |
| user_id | TEXT | FK → User.id, NOT NULL | 参加者 |
| seed | INTEGER | NOT NULL | ブラケット配置用のランダムシード |
| eliminated_at | TEXT | NULL | 敗退時のISO 8601タイムスタンプ |
| joined_at | TEXT | NOT NULL | ISO 8601タイムスタンプ |

**インデックス**:
- `idx_tp_tournament` on `tournament_id`
- `idx_tp_user` on `user_id`

**制約**:
- UNIQUE(tournament_id, user_id) - トーナメントごとにユーザー1エントリ

---

### TournamentMatch

トーナメントブラケット内の個別マッチ。

| フィールド | 型 | 制約 | 説明 |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| tournament_id | TEXT | FK → Tournament.id, NOT NULL | 親トーナメント |
| round | INTEGER | NOT NULL | ラウンド番号（1 = 1回戦） |
| match_index | INTEGER | NOT NULL | ラウンド内の位置（0始まり） |
| player1_id | TEXT | FK → User.id, NULL | 第1プレイヤー（NULL = 未定） |
| player2_id | TEXT | FK → User.id, NULL | 第2プレイヤー（NULL = 未定） |
| winner_id | TEXT | FK → User.id, NULL | マッチ勝者 |
| game_id | TEXT | FK → Game.id, NULL | リンクされたゲームレコード |
| scheduled_at | TEXT | NULL | ISO 8601タイムスタンプ |
| completed_at | TEXT | NULL | ISO 8601タイムスタンプ |

**インデックス**:
- `idx_tm_tournament` on `tournament_id`
- `idx_tm_round` on `(tournament_id, round)`

**制約**:
- UNIQUE(tournament_id, round, match_index)

---

## インメモリ構造（非永続化）

これらの構造はリアルタイムゲーム状態のためにランタイム時のみ存在します。

### GameState（WebSocket）

```typescript
interface GameState {
  gameId: string;
  ball: { x: number; y: number; vx: number; vy: number };
  paddle1: { y: number };  // プレイヤー1の位置
  paddle2: { y: number };  // プレイヤー2の位置
  score: { player1: number; player2: number };
  status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'ended';
  timestamp: number;       // 同期用サーバータイムスタンプ
}
```

### MatchmakingQueue（インメモリ）

```typescript
interface QueueEntry {
  userId: string;
  joinedAt: number;
  socketId: string;
}

// FIFOキュー、最大100エントリ
const matchmakingQueue: QueueEntry[] = [];
```

### OnlinePresence（インメモリ）

```typescript
// userId → 最終ハートビートタイムスタンプのマップ
const onlineUsers: Map<string, number> = new Map();

// 30秒ハートビートがなければオフラインと判定
```

---

## SQLスキーマ

```sql
-- WALモードを有効化（接続時に1回実行）
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- Usersテーブル（メール/パスワードおよび/または42 OAuthをサポート）
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- OAuth専用ユーザーはNULL（bcrypt, コスト12）
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  intra_id TEXT UNIQUE,  -- OAuthリンク用42 intra ID
  intra_username TEXT UNIQUE,  -- 42ログイン（表示用）
  oauth_access_token TEXT,
  oauth_refresh_token TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  elo_rating INTEGER DEFAULT 1000,
  created_at TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  CHECK(password_hash IS NOT NULL OR intra_id IS NOT NULL)  -- 少なくとも1つの認証方法
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_intra_id ON users(intra_id);
CREATE INDEX IF NOT EXISTS idx_user_elo ON users(elo_rating);

-- Sessionsテーブル
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_expires ON sessions(expires_at);

-- Friendshipsテーブル
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'declined')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(requester_id, addressee_id),
  CHECK(requester_id != addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendship_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendship_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendship_status ON friendships(status);

-- Gamesテーブル
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  player1_id TEXT NOT NULL REFERENCES users(id),
  player2_id TEXT REFERENCES users(id),
  winner_id TEXT REFERENCES users(id),
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  game_type TEXT NOT NULL CHECK(game_type IN ('quick', 'tournament', 'ai')),
  ai_difficulty TEXT CHECK(ai_difficulty IN ('easy', 'medium', 'hard')),
  tournament_match_id TEXT REFERENCES tournament_matches(id),
  status TEXT NOT NULL CHECK(status IN ('waiting', 'playing', 'completed', 'forfeit')),
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_player1 ON games(player1_id);
CREATE INDEX IF NOT EXISTS idx_game_player2 ON games(player2_id);
CREATE INDEX IF NOT EXISTS idx_game_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_type ON games(game_type);
CREATE INDEX IF NOT EXISTS idx_game_created ON games(created_at);

-- Tournamentsテーブル
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  creator_id TEXT NOT NULL REFERENCES users(id),
  max_players INTEGER NOT NULL CHECK(max_players IN (4, 8, 16)),
  status TEXT NOT NULL CHECK(status IN ('open', 'ready', 'in_progress', 'completed')),
  winner_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  started_at TEXT,
  ended_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_tournament_creator ON tournaments(creator_id);
CREATE INDEX IF NOT EXISTS idx_tournament_status ON tournaments(status);

-- Tournament participantsテーブル
CREATE TABLE IF NOT EXISTS tournament_participants (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  seed INTEGER NOT NULL,
  eliminated_at TEXT,
  joined_at TEXT NOT NULL,
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tp_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_user ON tournament_participants(user_id);

-- Tournament matchesテーブル
CREATE TABLE IF NOT EXISTS tournament_matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_index INTEGER NOT NULL,
  player1_id TEXT REFERENCES users(id),
  player2_id TEXT REFERENCES users(id),
  winner_id TEXT REFERENCES users(id),
  game_id TEXT REFERENCES games(id),
  scheduled_at TEXT,
  completed_at TEXT,
  UNIQUE(tournament_id, round, match_index)
);

CREATE INDEX IF NOT EXISTS idx_tm_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tm_round ON tournament_matches(tournament_id, round);
```

---

## マイグレーション戦略

これはグリーンフィールドプロジェクトのため、マイグレーションはバージョン管理されたSQLファイルで処理されます：

```
lib/migrations/
├── 001_initial_schema.sql
├── 002_add_indexes.sql
└── ...
```

シンプルなマイグレーションランナーが`schema_version`テーブルをチェックし、保留中のマイグレーションを順番に適用します。
