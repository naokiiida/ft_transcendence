# WebSocket Protocol: ft_transcendence

**Version**: 1.0.0
**Endpoint**: `wss://pong.taiida.com/api/ws`

## Connection

### Authentication

WebSocket connections require a valid session cookie. The connection is upgraded only if:
1. Request includes `session` cookie
2. Session is valid and not expired

### Connection URL

```
wss://pong.taiida.com/api/ws?game_id={gameId}
```

**Query Parameters:**
- `game_id` (optional): UUID of game to join. If omitted, connection is for presence/chat only.

---

## Message Format

All messages are JSON with a `type` discriminator field.

```typescript
interface BaseMessage {
  type: string;
  timestamp?: number;  // Server adds this on send
}
```

---

## Client → Server Messages

### `ping`
Keep-alive heartbeat. Send every 30 seconds.

```json
{ "type": "ping" }
```

### `game_input`
Paddle movement input during active game.

```json
{
  "type": "game_input",
  "game_id": "uuid",
  "direction": "up" | "down" | "none"
}
```

### `chat_message`
Send chat message during game.

```json
{
  "type": "chat_message",
  "game_id": "uuid",
  "content": "string (max 200 chars)"
}
```

### `join_game`
Join a specific game room.

```json
{
  "type": "join_game",
  "game_id": "uuid"
}
```

### `leave_game`
Leave current game room.

```json
{
  "type": "leave_game",
  "game_id": "uuid"
}
```

### `ai_explain`
Request AI decision explanation (AI games only).

```json
{
  "type": "ai_explain",
  "game_id": "uuid"
}
```

---

## Server → Client Messages

### `pong`
Response to ping.

```json
{ "type": "pong" }
```

### `game_state`
Authoritative game state update. Sent at 30 Hz during active games.

```json
{
  "type": "game_state",
  "game_id": "uuid",
  "state": {
    "ball": { "x": 400, "y": 300, "vx": 5, "vy": 3 },
    "paddle1": { "y": 250 },
    "paddle2": { "y": 280 },
    "score": { "player1": 3, "player2": 2 },
    "status": "playing" | "countdown" | "paused" | "ended"
  },
  "timestamp": 1704672000000
}
```

### `game_joined`
Confirmation of joining game room.

```json
{
  "type": "game_joined",
  "game_id": "uuid",
  "player_number": 1 | 2,
  "opponent": {
    "id": "uuid",
    "display_name": "string",
    "avatar_url": "string | null"
  }
}
```

### `game_start`
Game is starting (countdown begins).

```json
{
  "type": "game_start",
  "game_id": "uuid",
  "countdown_seconds": 3
}
```

### `game_paused`
Game paused due to disconnection.

```json
{
  "type": "game_paused",
  "game_id": "uuid",
  "reason": "opponent_disconnected",
  "message": "Game paused - waiting for opponent",
  "timeout_ms": 10000
}
```

### `game_resumed`
Game resumed after reconnection.

```json
{
  "type": "game_resumed",
  "game_id": "uuid"
}
```

### `game_ended`
Game has ended.

```json
{
  "type": "game_ended",
  "game_id": "uuid",
  "winner_id": "uuid",
  "final_score": { "player1": 11, "player2": 8 },
  "reason": "score" | "forfeit",
  "elo_change": 15
}
```

### `chat_received`
Chat message from opponent.

```json
{
  "type": "chat_received",
  "game_id": "uuid",
  "sender": {
    "id": "uuid",
    "display_name": "string"
  },
  "content": "string",
  "timestamp": 1704672000000
}
```

### `chat_rate_limited`
Chat rate limit exceeded.

```json
{
  "type": "chat_rate_limited",
  "retry_after_ms": 10000
}
```

### `matchmaking_found`
Match found from queue.

```json
{
  "type": "matchmaking_found",
  "game_id": "uuid",
  "opponent": {
    "id": "uuid",
    "display_name": "string",
    "avatar_url": "string | null",
    "elo_rating": 1200
  }
}
```

### `ai_explanation`
AI decision explanation (response to ai_explain).

```json
{
  "type": "ai_explanation",
  "game_id": "uuid",
  "decision": {
    "predicted_ball_y": 320,
    "target_paddle_y": 315,
    "movement": "up",
    "confidence": 0.85,
    "reason": "Ball trajectory predicts impact at y=320"
  }
}
```

### `tournament_match_ready`
Tournament match is ready to start.

```json
{
  "type": "tournament_match_ready",
  "tournament_id": "uuid",
  "match_id": "uuid",
  "opponent": {
    "id": "uuid",
    "display_name": "string"
  },
  "round": 1,
  "join_timeout_seconds": 300
}
```

### `friend_online`
Friend came online.

```json
{
  "type": "friend_online",
  "friend": {
    "id": "uuid",
    "display_name": "string"
  }
}
```

### `friend_offline`
Friend went offline.

```json
{
  "type": "friend_offline",
  "friend_id": "uuid"
}
```

### `friend_request`
Received friend request.

```json
{
  "type": "friend_request",
  "from": {
    "id": "uuid",
    "display_name": "string",
    "avatar_url": "string | null"
  }
}
```

### `error`
Error message.

```json
{
  "type": "error",
  "code": "string",
  "message": "string"
}
```

**Error Codes:**
- `INVALID_MESSAGE` - Malformed JSON or unknown message type
- `GAME_NOT_FOUND` - Game ID doesn't exist
- `NOT_IN_GAME` - Tried to send input without joining
- `UNAUTHORIZED` - Session expired
- `RATE_LIMITED` - Too many messages

---

## Game Constants

Shared between client and server for physics simulation.

```typescript
// shared/game/constants.ts
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 100;
export const PADDLE_SPEED = 400;  // pixels per second
export const BALL_RADIUS = 10;
export const BALL_INITIAL_SPEED = 300;
export const BALL_MAX_SPEED = 600;
export const BALL_SPEED_INCREMENT = 1.05;  // 5% faster each hit
export const WINNING_SCORE = 11;
export const TICK_RATE = 30;  // server updates per second
```

---

## Connection Lifecycle

```
1. Client opens WebSocket with session cookie
2. Server validates session
3. Server sends initial state (if game_id provided)
4. Client sends ping every 30s
5. Server sends game_state at 30 Hz during active games
6. On disconnect: 10-second reconnection window
7. On timeout: forfeit and close
```

---

## Rate Limits

| Message Type | Limit |
|--------------|-------|
| `game_input` | 60/second (per game) |
| `chat_message` | 5/10 seconds (per game) |
| `ping` | 1/second |
| All others | 10/second |
