# Data Model: ft_transcendence

**Feature**: 002-pong-multiplayer
**Date**: 2026-01-06
**Database**: SQLite with WAL mode

## Entity Relationship Diagram

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

## Entities

### User

Represents a registered user authenticated via email/password or 42 OAuth (or both).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| email | TEXT | UNIQUE, NOT NULL | Email address (unique identifier) |
| password_hash | TEXT | NULL | bcrypt hash (NULL for OAuth-only users) |
| display_name | TEXT | NOT NULL, max 32 chars | Editable display name |
| avatar_url | TEXT | NULL | Path to uploaded avatar or NULL for default |
| intra_id | TEXT | UNIQUE, NULL | 42 intra ID (for OAuth linking) |
| intra_username | TEXT | UNIQUE, NULL | 42 intra login (for display) |
| oauth_access_token | TEXT | NULL | 42 OAuth access token (encrypted at rest) |
| oauth_refresh_token | TEXT | NULL | 42 OAuth refresh token (encrypted at rest) |
| wins | INTEGER | DEFAULT 0 | Total wins across all games |
| losses | INTEGER | DEFAULT 0 | Total losses across all games |
| elo_rating | INTEGER | DEFAULT 1000 | Ranking score (ELO system) |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| last_seen | TEXT | NOT NULL | ISO 8601 timestamp (updated on activity) |

**Indexes**:
- `idx_user_email` on `email`
- `idx_user_intra_id` on `intra_id`
- `idx_user_elo` on `elo_rating` (for leaderboards)

**Constraints**:
- At least one auth method: CHECK(password_hash IS NOT NULL OR intra_id IS NOT NULL)

**Validation Rules** (Zod):
- `email`: Valid email format (regex)
- `password`: ≥8 characters (before hashing)
- `display_name`: 1-32 characters, alphanumeric + spaces + underscores
- `avatar_url`: Valid URL path or null

---

### Session

Manages user authentication sessions (HTTP-only cookies).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Session token (secure random) |
| user_id | TEXT | FK → User.id, NOT NULL | Associated user |
| expires_at | TEXT | NOT NULL | ISO 8601 expiration timestamp |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Indexes**:
- `idx_session_user` on `user_id`
- `idx_session_expires` on `expires_at` (for cleanup job)

**TTL**: Sessions expire after 24 hours of inactivity.

---

### Friendship

Bidirectional friend relationship with request/accept flow.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| requester_id | TEXT | FK → User.id, NOT NULL | User who sent request |
| addressee_id | TEXT | FK → User.id, NOT NULL | User who received request |
| status | TEXT | NOT NULL | 'pending' \| 'accepted' \| 'declined' |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Indexes**:
- `idx_friendship_requester` on `requester_id`
- `idx_friendship_addressee` on `addressee_id`
- `idx_friendship_status` on `status`

**Constraints**:
- UNIQUE(requester_id, addressee_id) - prevent duplicate requests
- CHECK(requester_id != addressee_id) - cannot friend self

**State Transitions**:
```
[none] ──(send request)──► pending
pending ──(accept)──► accepted
pending ──(decline)──► declined
accepted ──(unfriend)──► [deleted]
```

---

### Game

Represents a completed or in-progress Pong match.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| player1_id | TEXT | FK → User.id, NOT NULL | Left paddle player |
| player2_id | TEXT | FK → User.id, NULL | Right paddle player (NULL for AI) |
| winner_id | TEXT | FK → User.id, NULL | Winner (NULL if in progress) |
| player1_score | INTEGER | DEFAULT 0 | Player 1 score |
| player2_score | INTEGER | DEFAULT 0 | Player 2 score |
| game_type | TEXT | NOT NULL | 'quick' \| 'tournament' \| 'ai' |
| ai_difficulty | TEXT | NULL | 'easy' \| 'medium' \| 'hard' (if AI game) |
| tournament_match_id | TEXT | FK → TournamentMatch.id, NULL | Link to tournament |
| status | TEXT | NOT NULL | 'waiting' \| 'playing' \| 'completed' \| 'forfeit' |
| started_at | TEXT | NULL | ISO 8601 timestamp |
| ended_at | TEXT | NULL | ISO 8601 timestamp |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Indexes**:
- `idx_game_player1` on `player1_id`
- `idx_game_player2` on `player2_id`
- `idx_game_status` on `status`
- `idx_game_type` on `game_type`
- `idx_game_created` on `created_at` (for history queries)

**State Transitions**:
```
[created] ──(player joins)──► waiting
waiting ──(both ready)──► playing
playing ──(score=11)──► completed
playing ──(disconnect timeout)──► forfeit
```

---

### Tournament

Single-elimination tournament bracket.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | NOT NULL, max 64 chars | Tournament name |
| creator_id | TEXT | FK → User.id, NOT NULL | User who created tournament |
| max_players | INTEGER | NOT NULL | 4 \| 8 \| 16 |
| status | TEXT | NOT NULL | 'open' \| 'ready' \| 'in_progress' \| 'completed' |
| winner_id | TEXT | FK → User.id, NULL | Tournament winner |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| started_at | TEXT | NULL | ISO 8601 timestamp |
| ended_at | TEXT | NULL | ISO 8601 timestamp |

**Indexes**:
- `idx_tournament_creator` on `creator_id`
- `idx_tournament_status` on `status`

**State Transitions**:
```
[created] ──► open
open ──(max players joined)──► ready
ready ──(creator starts)──► in_progress
in_progress ──(final match done)──► completed
```

---

### TournamentParticipant

Links users to tournaments with seeding.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| tournament_id | TEXT | FK → Tournament.id, NOT NULL | Tournament |
| user_id | TEXT | FK → User.id, NOT NULL | Participant |
| seed | INTEGER | NOT NULL | Random seed for bracket placement |
| eliminated_at | TEXT | NULL | ISO 8601 timestamp when eliminated |
| joined_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Indexes**:
- `idx_tp_tournament` on `tournament_id`
- `idx_tp_user` on `user_id`

**Constraints**:
- UNIQUE(tournament_id, user_id) - one entry per user per tournament

---

### TournamentMatch

Individual match within a tournament bracket.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID v4 |
| tournament_id | TEXT | FK → Tournament.id, NOT NULL | Parent tournament |
| round | INTEGER | NOT NULL | Round number (1 = first round) |
| match_index | INTEGER | NOT NULL | Position within round (0-indexed) |
| player1_id | TEXT | FK → User.id, NULL | First player (NULL = TBD) |
| player2_id | TEXT | FK → User.id, NULL | Second player (NULL = TBD) |
| winner_id | TEXT | FK → User.id, NULL | Match winner |
| game_id | TEXT | FK → Game.id, NULL | Linked game record |
| scheduled_at | TEXT | NULL | ISO 8601 timestamp |
| completed_at | TEXT | NULL | ISO 8601 timestamp |

**Indexes**:
- `idx_tm_tournament` on `tournament_id`
- `idx_tm_round` on `(tournament_id, round)`

**Constraints**:
- UNIQUE(tournament_id, round, match_index)

---

## In-Memory Structures (Not Persisted)

These structures exist only during runtime for real-time game state.

### GameState (WebSocket)

```typescript
interface GameState {
  gameId: string;
  ball: { x: number; y: number; vx: number; vy: number };
  paddle1: { y: number };  // Player 1 position
  paddle2: { y: number };  // Player 2 position
  score: { player1: number; player2: number };
  status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'ended';
  timestamp: number;       // Server timestamp for sync
}
```

### MatchmakingQueue (In-Memory)

```typescript
interface QueueEntry {
  userId: string;
  joinedAt: number;
  socketId: string;
}

// FIFO queue, max 100 entries
const matchmakingQueue: QueueEntry[] = [];
```

### OnlinePresence (In-Memory)

```typescript
// Map of userId → last heartbeat timestamp
const onlineUsers: Map<string, number> = new Map();

// Considered offline if no heartbeat in 30 seconds
```

---

## SQL Schema

```sql
-- Enable WAL mode (run once at connection)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

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
  CHECK(password_hash IS NOT NULL OR intra_id IS NOT NULL)  -- At least one auth method
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_intra_id ON users(intra_id);
CREATE INDEX IF NOT EXISTS idx_user_elo ON users(elo_rating);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_expires ON sessions(expires_at);

-- Friendships table
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

-- Games table
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

-- Tournaments table
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

-- Tournament participants table
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

-- Tournament matches table
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

## Migration Strategy

Since this is a greenfield project, migrations will be handled via versioned SQL files:

```
lib/migrations/
├── 001_initial_schema.sql
├── 002_add_indexes.sql
└── ...
```

A simple migration runner checks a `schema_version` table and applies pending migrations in order.
