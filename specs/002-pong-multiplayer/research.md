# Research: ft_transcendence Technical Decisions

**Feature**: 002-pong-multiplayer
**Date**: 2026-01-06
**Status**: Complete

This document resolves all "NEEDS CLARIFICATION" items from the Technical Context and documents key technology decisions.

---

## 1. SQLite with WAL Mode in Deno

### Decision: Use `@db/sqlite` (jsr:@db/sqlite)

### Rationale
- The FFI-based library from JSR fully supports WAL mode (WASM-based `deno.land/x/sqlite` does NOT)
- Described as "the fastest and correct SQLite3 module for Deno"
- `db.prepare()` pattern required by constitution is fully supported

### Alternatives Considered
- **deno.land/x/sqlite** - WASM-based, no WAL support due to filesystem API limitations
- **node:sqlite** (Deno v2.2+) - Also works, but less mature ecosystem
- **Better-sqlite3 via npm** - Adds unnecessary npm dependency

### Implementation Pattern

```typescript
// lib/db.ts
import { Database } from "jsr:@db/sqlite@0.13";

const db = new Database("data/pong.db");

// Enable WAL mode (persistent across connections)
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA synchronous = NORMAL");  // Balance safety/speed
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA busy_timeout = 5000");   // Wait 5s on lock

// Prepared statement pattern (SQL injection prevention)
const getUserById = db.prepare("SELECT * FROM users WHERE id = ?");
const user = getUserById.get(userId);

// Named parameters
const createUser = db.prepare(`
  INSERT INTO users (id, intra_username, email, display_name, created_at, last_seen)
  VALUES (:id, :intra_username, :email, :display_name, :created_at, :last_seen)
`);
createUser.run({ id, intra_username, email, display_name, created_at: now, last_seen: now });

// Transactions for batch operations
const batchInsert = db.transaction((items) => {
  for (const item of items) {
    insertStmt.run(item);
  }
});
```

### Permissions Required
```bash
deno run --allow-env --allow-ffi --allow-read --allow-write --allow-net app.ts
```

---

## 2. WebSocket Implementation in Fresh

### Decision: Use native `Deno.upgradeWebSocket()` with room-based connection manager

### Rationale
- No external dependencies needed
- Native Deno API is well-documented and stable
- Room-based pattern fits multiplayer game requirements

### Implementation Pattern

```typescript
// routes/api/ws.ts
export const handler = (req: Request): Response => {
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => handleConnection(socket, req);
  socket.onmessage = (e) => handleMessage(socket, JSON.parse(e.data));
  socket.onclose = () => handleDisconnect(socket);
  socket.onerror = (e) => console.error("WebSocket error:", e);

  return response;
};
```

### Room Management Pattern

```typescript
// lib/ws.ts
type Room = Map<string, WebSocket>;
const rooms = new Map<string, Room>();

function joinRoom(roomId: string, playerId: string, socket: WebSocket) {
  const room = rooms.get(roomId) ?? new Map();
  rooms.set(roomId, room);
  room.set(playerId, socket);
}

function broadcastToRoom(roomId: string, message: object, exclude?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const payload = JSON.stringify(message);
  for (const [id, client] of room) {
    if (id !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
```

### Message Multiplexing (Game + Chat)

Use TypeScript discriminated unions for type-safe handling:

```typescript
// shared/types/ws.ts
type ClientMessage =
  | { type: "game_input"; game_id: string; direction: "up" | "down" | "none" }
  | { type: "chat_message"; game_id: string; content: string }
  | { type: "ping" };

type ServerMessage =
  | { type: "game_state"; state: GameState }
  | { type: "chat_received"; sender: string; content: string }
  | { type: "pong" };
```

### Reconnection with Exponential Backoff (Client)

```typescript
class ReconnectingWebSocket {
  private attempts = 0;
  private baseDelay = 1000;
  private maxDelay = 30000;

  private scheduleReconnect() {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempts) + Math.random() * 1000,
      this.maxDelay
    );
    this.attempts++;
    setTimeout(() => this.connect(), delay);
  }
}
```

---

## 3. 42 OAuth Integration

### Decision: Custom OAuth implementation (not deno_kv_oauth) for SQLite session storage

### Rationale
- `deno_kv_oauth` uses Deno KV, but we're standardizing on SQLite
- 42 API doesn't provide refresh tokens (7200s expiration)
- Need tight integration with our session model

### OAuth Endpoints

| Purpose | URL |
|---------|-----|
| Authorization | `https://api.intra.42.fr/oauth/authorize` |
| Token Exchange | `https://api.intra.42.fr/oauth/token` |
| User Profile | `https://api.intra.42.fr/v2/me` |

### OAuth Flow

```
1. User clicks "Login with 42"
   → Redirect to: https://api.intra.42.fr/oauth/authorize
       ?client_id=CLIENT_ID
       &redirect_uri=https://pong.taiida.com/api/auth/callback
       &response_type=code
       &scope=public
       &state=CSRF_TOKEN

2. User authorizes, 42 redirects to callback
   → GET /api/auth/callback?code=AUTH_CODE&state=CSRF_TOKEN

3. Server exchanges code for token
   → POST https://api.intra.42.fr/oauth/token
       grant_type=authorization_code
       code=AUTH_CODE
       client_id=CLIENT_ID
       client_secret=CLIENT_SECRET
       redirect_uri=CALLBACK_URL

4. Server fetches user profile
   → GET https://api.intra.42.fr/v2/me
       Authorization: Bearer ACCESS_TOKEN

5. Server creates session, sets HTTP-only cookie
```

### Implementation Pattern

```typescript
// lib/auth.ts
const FT_AUTH_URL = "https://api.intra.42.fr/oauth/authorize";
const FT_TOKEN_URL = "https://api.intra.42.fr/oauth/token";
const FT_PROFILE_URL = "https://api.intra.42.fr/v2/me";

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: Deno.env.get("FT_CLIENT_ID")!,
    redirect_uri: Deno.env.get("FT_REDIRECT_URI")!,
    response_type: "code",
    scope: "public",
    state,
  });
  return `${FT_AUTH_URL}?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch(FT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: Deno.env.get("FT_CLIENT_ID")!,
      client_secret: Deno.env.get("FT_CLIENT_SECRET")!,
      code,
      redirect_uri: Deno.env.get("FT_REDIRECT_URI")!,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

export async function fetchUserProfile(accessToken: string) {
  const res = await fetch(FT_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}
```

### Rate Limits
- **2 requests/second**
- **1200 requests/hour**

---

## 4. Prometheus Metrics

### Decision: Use `ts_prometheus` library

### Rationale
- Most mature Prometheus client for Deno
- Supports all metric types (Counter, Gauge, Histogram, Summary)
- Simple API with label support

### Import
```typescript
import { Counter, Gauge, Histogram, Registry } from "https://deno.land/x/ts_prometheus@v0.3.0/mod.ts";
```

### Metrics Definition

```typescript
// lib/metrics.ts
import { Counter, Gauge, Histogram, Registry } from "https://deno.land/x/ts_prometheus@v0.3.0/mod.ts";

// Connection metrics
export const connectedUsers = Gauge.with({
  name: "websocket_connections_total",
  help: "Current number of WebSocket connections",
});

// Game metrics
export const activeGames = Gauge.with({
  name: "games_active_total",
  help: "Number of games currently in progress",
  labels: ["game_type"],
});

export const gamesCompleted = Counter.with({
  name: "games_completed_total",
  help: "Total games completed",
  labels: ["game_type", "outcome"],
});

export const gameDuration = Histogram.with({
  name: "game_duration_seconds",
  help: "Game duration in seconds",
  buckets: [30, 60, 120, 300, 600, 1800],
});

// Matchmaking
export const playersInQueue = Gauge.with({
  name: "matchmaking_queue_size",
  help: "Number of players waiting in matchmaking queue",
});

// HTTP metrics
export const httpRequestDuration = Histogram.with({
  name: "http_request_duration_seconds",
  help: "Request duration in seconds",
  labels: ["method", "path", "status"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

export function getMetrics(): string {
  return Registry.default.metrics();
}
```

### Metrics Endpoint

```typescript
// routes/api/metrics.ts
import { getMetrics } from "../../lib/metrics.ts";

export const handler = {
  GET(): Response {
    return new Response(getMetrics(), {
      headers: { "Content-Type": "text/plain; version=0.0.4; charset=utf-8" },
    });
  },
};
```

---

## 5. Additional Decisions

### DaisyUI + Tailwind CSS

Per Fresh documentation, use the official DaisyUI plugin:

```typescript
// tailwind.config.ts
import daisyui from "daisyui";

export default {
  content: ["{routes,islands,components}/**/*.{ts,tsx}"],
  plugins: [daisyui],
  daisyui: {
    themes: ["light", "dark"],
  },
};
```

### Docker Multi-Stage Build

Per Fresh deployment docs:

```dockerfile
FROM denoland/deno:2.1.4 AS builder
WORKDIR /app
COPY . .
RUN deno task build

FROM denoland/deno:2.1.4
WORKDIR /app
COPY --from=builder /app .
EXPOSE 8000
CMD ["run", "-A", "main.ts"]
```

### Zod Validation

Use Zod for all external input validation (form data, WebSocket messages, URL params):

```typescript
// shared/schemas/user.ts
import { z } from "zod";

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(32).regex(/^[a-zA-Z0-9_ ]+$/),
});

export const ChatMessageSchema = z.object({
  type: z.literal("chat_message"),
  game_id: z.string().uuid(),
  content: z.string().max(200),
});
```

---

## Summary of Technology Stack

| Component | Decision | Version/URL |
|-----------|----------|-------------|
| Runtime | Deno | ≥1.40 |
| Framework | Fresh | ≥1.6 |
| Database | SQLite via @db/sqlite | jsr:@db/sqlite@0.13 |
| CSS | DaisyUI + Tailwind | Latest |
| Metrics | ts_prometheus | deno.land/x/ts_prometheus@v0.3.0 |
| Validation | Zod | npm:zod |
| WebSocket | Native Deno.upgradeWebSocket | Built-in |
| OAuth | Custom 42 API integration | N/A |
