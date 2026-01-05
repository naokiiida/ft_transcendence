# WebSocket Protocol: ft_transcendence

**Endpoint**: `wss://pong.taiida.com/api/ws`
**Authentication**: Session cookie required

## Connection

```
GET /api/ws
Cookie: session=<session_token>
Upgrade: websocket
Connection: Upgrade
```

All messages are JSON with a `type` field discriminator.

## Message Types

### Client → Server

#### `ping`
Heartbeat to maintain connection and online presence.

```json
{
  "type": "ping",
  "timestamp": 1704067200000
}
```

#### `matchmaking_join`
Join the matchmaking queue for a quick match.

```json
{
  "type": "matchmaking_join"
}
```

#### `matchmaking_leave`
Leave the matchmaking queue.

```json
{
  "type": "matchmaking_leave"
}
```

#### `game_join`
Join a specific game room.

```json
{
  "type": "game_join",
  "game_id": "uuid"
}
```

#### `game_leave`
Leave the current game room.

```json
{
  "type": "game_leave",
  "game_id": "uuid"
}
```

#### `game_ready`
Signal ready to start (both players must send).

```json
{
  "type": "game_ready",
  "game_id": "uuid"
}
```

#### `game_input`
Send paddle input. Sent at 60Hz from client.

```json
{
  "type": "game_input",
  "game_id": "uuid",
  "input": {
    "direction": "up" | "down" | "none",
    "timestamp": 1704067200000
  }
}
```

#### `chat_message`
Send a chat message in the current game room.

```json
{
  "type": "chat_message",
  "game_id": "uuid",
  "content": "string (max 200 chars)"
}
```

#### `ai_explain`
Request AI decision explanation (AI games only).

```json
{
  "type": "ai_explain",
  "game_id": "uuid"
}
```

---

### Server → Client

#### `pong`
Response to ping.

```json
{
  "type": "pong",
  "timestamp": 1704067200000,
  "server_time": 1704067200005
}
```

#### `error`
Error notification.

```json
{
  "type": "error",
  "code": "string",
  "message": "string"
}
```

Error codes:
- `UNAUTHORIZED` - Invalid or expired session
- `INVALID_MESSAGE` - Malformed message
- `RATE_LIMITED` - Too many messages
- `GAME_NOT_FOUND` - Game doesn't exist
- `NOT_IN_GAME` - Action requires being in a game
- `GAME_FULL` - Game already has two players

#### `matchmaking_status`
Queue position update.

```json
{
  "type": "matchmaking_status",
  "position": 1,
  "estimated_wait_seconds": 30
}
```

#### `matchmaking_found`
Match found, redirecting to game.

```json
{
  "type": "matchmaking_found",
  "game_id": "uuid",
  "opponent": {
    "id": "uuid",
    "display_name": "string",
    "avatar_url": "string | null",
    "elo_rating": 1000
  }
}
```

#### `game_joined`
Successfully joined a game room.

```json
{
  "type": "game_joined",
  "game_id": "uuid",
  "player_number": 1 | 2,
  "opponent": {
    "id": "uuid",
    "display_name": "string",
    "avatar_url": "string | null"
  } | null
}
```

#### `game_player_joined`
Another player joined the game.

```json
{
  "type": "game_player_joined",
  "game_id": "uuid",
  "player": {
    "id": "uuid",
    "display_name": "string",
    "avatar_url": "string | null"
  }
}
```

#### `game_player_ready`
A player signaled ready.

```json
{
  "type": "game_player_ready",
  "game_id": "uuid",
  "player_number": 1 | 2
}
```

#### `game_countdown`
Game starting countdown.

```json
{
  "type": "game_countdown",
  "game_id": "uuid",
  "seconds_remaining": 3
}
```

#### `game_state`
Authoritative game state broadcast. Sent at 30Hz.

```json
{
  "type": "game_state",
  "game_id": "uuid",
  "state": {
    "ball": {
      "x": 400,
      "y": 300,
      "vx": 5,
      "vy": 3
    },
    "paddle1": {
      "y": 250
    },
    "paddle2": {
      "y": 250
    },
    "score": {
      "player1": 0,
      "player2": 0
    },
    "status": "playing" | "paused" | "countdown",
    "timestamp": 1704067200000
  }
}
```

#### `game_score`
Score update (sent in addition to game_state for event handling).

```json
{
  "type": "game_score",
  "game_id": "uuid",
  "player1_score": 5,
  "player2_score": 3,
  "scorer": 1 | 2
}
```

#### `game_ended`
Game completed.

```json
{
  "type": "game_ended",
  "game_id": "uuid",
  "winner_id": "uuid",
  "final_score": {
    "player1": 11,
    "player2": 7
  },
  "reason": "score" | "forfeit" | "disconnect",
  "elo_change": {
    "player1": 15,
    "player2": -15
  }
}
```

#### `game_player_disconnected`
Opponent disconnected (30-second grace period starts).

```json
{
  "type": "game_player_disconnected",
  "game_id": "uuid",
  "player_number": 1 | 2,
  "reconnect_deadline": 1704067230000
}
```

#### `game_player_reconnected`
Disconnected player reconnected.

```json
{
  "type": "game_player_reconnected",
  "game_id": "uuid",
  "player_number": 1 | 2
}
```

#### `chat_received`
Chat message from another player.

```json
{
  "type": "chat_received",
  "game_id": "uuid",
  "sender": {
    "id": "uuid",
    "display_name": "string"
  },
  "content": "string",
  "timestamp": 1704067200000
}
```

#### `ai_explanation`
AI decision explanation (response to ai_explain).

```json
{
  "type": "ai_explanation",
  "game_id": "uuid",
  "explanation": {
    "predicted_ball_y": 350,
    "target_paddle_y": 340,
    "decision": "moving_up",
    "confidence": 0.85,
    "reasoning": "Ball trajectory predicts impact at y=350, moving paddle to intercept"
  }
}
```

#### `presence_update`
Friend came online/offline (sent to users who have them as friends).

```json
{
  "type": "presence_update",
  "user_id": "uuid",
  "is_online": true,
  "last_seen": "2024-01-01T00:00:00Z"
}
```

---

## Game Constants

Used for client-side rendering and prediction.

```typescript
const GAME_CONSTANTS = {
  // Canvas dimensions
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // Paddle
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 100,
  PADDLE_SPEED: 8,
  PADDLE_MARGIN: 20,  // Distance from edge

  // Ball
  BALL_RADIUS: 8,
  BALL_INITIAL_SPEED: 5,
  BALL_MAX_SPEED: 12,
  BALL_SPEED_INCREMENT: 0.5,  // Per hit

  // Game rules
  WINNING_SCORE: 11,
  COUNTDOWN_SECONDS: 3,

  // Timing
  SERVER_TICK_RATE: 30,      // Updates per second
  CLIENT_INPUT_RATE: 60,     // Inputs per second
  RECONNECT_GRACE_MS: 30000, // 30 seconds

  // Limits
  CHAT_MAX_LENGTH: 200,
  CHAT_RATE_LIMIT: 5,        // Messages per 10 seconds
};
```

---

## Connection Lifecycle

```
┌─────────────┐
│   Connect   │
└──────┬──────┘
       │
       ▼
┌─────────────┐  fail   ┌─────────────┐
│  Handshake  │────────►│   Closed    │
└──────┬──────┘         └─────────────┘
       │ success
       ▼
┌─────────────┐
│    Idle     │◄───────────────┐
└──────┬──────┘                │
       │ matchmaking_join      │ game_ended
       ▼                       │
┌─────────────┐                │
│   Queued    │                │
└──────┬──────┘                │
       │ matchmaking_found     │
       ▼                       │
┌─────────────┐                │
│  In Game    │────────────────┘
└─────────────┘
```

---

## Reconnection Protocol

1. Client detects disconnect (WebSocket `close` event)
2. Client enters exponential backoff: 1s, 2s, 4s, 8s, max 30s
3. On reconnect, client sends last known `game_id` in URL: `/api/ws?resume=<game_id>`
4. Server validates session and checks if game is within grace period
5. If valid, server sends `game_joined` with current state
6. If expired, server sends `error` with `GAME_EXPIRED` code

```typescript
// Client reconnection example
async function reconnect(gameId?: string) {
  let delay = 1000;
  const maxDelay = 30000;

  while (true) {
    try {
      const url = gameId
        ? `/api/ws?resume=${gameId}`
        : '/api/ws';
      await connect(url);
      return;
    } catch (e) {
      await sleep(delay);
      delay = Math.min(delay * 2, maxDelay);
    }
  }
}
```
