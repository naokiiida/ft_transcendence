# リサーチ: ft_transcendence 技術的決定

**機能**: 002-pong-multiplayer
**日付**: 2026-01-08（2026-01-06から更新）
**ステータス**: 完了

このドキュメントは技術コンテキストからのすべての「要明確化」項目を解決し、主要な技術決定を文書化します。

---

## 1. DenoでのWALモード付きSQLite

### 決定: `@db/sqlite`（jsr:@db/sqlite）を使用

### 根拠
- JSRのFFIベースライブラリはWALモードを完全にサポート（WASMベースの`deno.land/x/sqlite`はサポートしない）
- 「Deno用の最速かつ正確なSQLite3モジュール」と説明されている
- 憲法で要求される`db.prepare()`パターンを完全にサポート

### 検討した代替案
- **deno.land/x/sqlite** - WASMベース、ファイルシステムAPI制限によりWALサポートなし
- **node:sqlite**（Deno v2.2+） - 動作するが、エコシステムの成熟度が低い
- **npm経由のBetter-sqlite3** - 不要なnpm依存関係を追加

### 実装パターン

```typescript
// lib/db.ts
import { Database } from "jsr:@db/sqlite@0.13";

const db = new Database("data/pong.db");

// WALモードを有効化（接続間で永続化）
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA synchronous = NORMAL");  // 安全性/速度のバランス
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA busy_timeout = 5000");   // ロック時5秒待機

// プリペアドステートメントパターン（SQLインジェクション防止）
const getUserById = db.prepare("SELECT * FROM users WHERE id = ?");
const user = getUserById.get(userId);

// 名前付きパラメータ
const createUser = db.prepare(`
  INSERT INTO users (id, intra_username, email, display_name, created_at, last_seen)
  VALUES (:id, :intra_username, :email, :display_name, :created_at, :last_seen)
`);
createUser.run({ id, intra_username, email, display_name, created_at: now, last_seen: now });

// バッチ操作用トランザクション
const batchInsert = db.transaction((items) => {
  for (const item of items) {
    insertStmt.run(item);
  }
});
```

### 必要な権限
```bash
deno run --allow-env --allow-ffi --allow-read --allow-write --allow-net app.ts
```

---

## 2. FreshでのWebSocket実装

### 決定: ネイティブ`Deno.upgradeWebSocket()`とルームベースの接続マネージャーを使用

### 根拠
- 外部依存関係不要
- ネイティブDeno APIは十分に文書化されており安定
- ルームベースパターンはマルチプレイヤーゲーム要件に適合

### 実装パターン

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

### ルーム管理パターン

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

### メッセージ多重化（ゲーム + チャット）

型安全な処理のためにTypeScriptの判別共用体を使用：

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

### 指数バックオフによる再接続（クライアント）

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

## 3. 42 OAuth統合

### 決定: SQLiteセッションストレージのためのカスタムOAuth実装（deno_kv_oauthではない）

### 根拠
- `deno_kv_oauth`はDeno KVを使用するが、SQLiteに標準化している
- 42 APIはリフレッシュトークンを提供しない（7200秒有効期限）
- セッションモデルとの緊密な統合が必要

### OAuthエンドポイント

| 目的 | URL |
|---------|-----|
| 認可 | `https://api.intra.42.fr/oauth/authorize` |
| トークン交換 | `https://api.intra.42.fr/oauth/token` |
| ユーザープロフィール | `https://api.intra.42.fr/v2/me` |

### OAuthフロー

```
1. ユーザーが「42でログイン」をクリック
   → リダイレクト先: https://api.intra.42.fr/oauth/authorize
       ?client_id=CLIENT_ID
       &redirect_uri=https://pong.taiida.com/api/auth/callback
       &response_type=code
       &scope=public
       &state=CSRF_TOKEN

2. ユーザーが認可、42がコールバックにリダイレクト
   → GET /api/auth/callback?code=AUTH_CODE&state=CSRF_TOKEN

3. サーバーがコードをトークンに交換
   → POST https://api.intra.42.fr/oauth/token
       grant_type=authorization_code
       code=AUTH_CODE
       client_id=CLIENT_ID
       client_secret=CLIENT_SECRET
       redirect_uri=CALLBACK_URL

4. サーバーがユーザープロフィールを取得
   → GET https://api.intra.42.fr/v2/me
       Authorization: Bearer ACCESS_TOKEN

5. サーバーがセッションを作成、HTTP専用Cookieを設定
```

### 実装パターン

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

### レート制限
- **2リクエスト/秒**
- **1200リクエスト/時**

---

## 4. Prometheusメトリクス

### 決定: `ts_prometheus`ライブラリを使用

### 根拠
- Deno用の最も成熟したPrometheusクライアント
- すべてのメトリックタイプをサポート（Counter、Gauge、Histogram、Summary）
- ラベルサポート付きのシンプルなAPI

### インポート
```typescript
import { Counter, Gauge, Histogram, Registry } from "https://deno.land/x/ts_prometheus@v0.3.0/mod.ts";
```

### メトリクス定義

```typescript
// lib/metrics.ts
import { Counter, Gauge, Histogram, Registry } from "https://deno.land/x/ts_prometheus@v0.3.0/mod.ts";

// 接続メトリクス
export const connectedUsers = Gauge.with({
  name: "websocket_connections_total",
  help: "現在のWebSocket接続数",
});

// ゲームメトリクス
export const activeGames = Gauge.with({
  name: "games_active_total",
  help: "現在進行中のゲーム数",
  labels: ["game_type"],
});

export const gamesCompleted = Counter.with({
  name: "games_completed_total",
  help: "完了したゲームの総数",
  labels: ["game_type", "outcome"],
});

export const gameDuration = Histogram.with({
  name: "game_duration_seconds",
  help: "ゲーム時間（秒）",
  buckets: [30, 60, 120, 300, 600, 1800],
});

// マッチメイキング
export const playersInQueue = Gauge.with({
  name: "matchmaking_queue_size",
  help: "マッチメイキングキューで待機中のプレイヤー数",
});

// HTTPメトリクス
export const httpRequestDuration = Histogram.with({
  name: "http_request_duration_seconds",
  help: "リクエスト時間（秒）",
  labels: ["method", "path", "status"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

export function getMetrics(): string {
  return Registry.default.metrics();
}
```

### メトリクスエンドポイント

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

## 5. 追加の決定

### DaisyUI + Tailwind CSS

Freshドキュメントに従い、公式DaisyUIプラグインを使用：

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

### Dockerマルチステージビルド

Freshデプロイメントドキュメントに従い：

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

### Zodバリデーション

すべての外部入力バリデーション（フォームデータ、WebSocketメッセージ、URLパラメータ）にZodを使用：

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

## 6. Canvasゲームループ & クライアント-サーバー同期

### 決定: 固定タイムステップサーバーループとクライアント補間

### 根拠
- サーバーは毎秒30ティック（33msごと）で権威ある物理を実行
- クライアントはrequestAnimationFrameを使用して60 FPSでレンダリング
- クライアントはスムーズな視覚のために受信したサーバー状態間を補間
- パドル入力は即座に送信されクライアントサイド予測を使用

### サーバーティックループ

```typescript
// lib/game-loop.ts
const TICK_RATE = 30; // 毎秒30更新
const TICK_INTERVAL = 1000 / TICK_RATE; // 約33.33ms

class GameLoop {
  private lastTick = performance.now();
  private accumulator = 0;

  start() {
    setInterval(() => {
      const now = performance.now();
      const delta = now - this.lastTick;
      this.lastTick = now;
      this.accumulator += delta;

      while (this.accumulator >= TICK_INTERVAL) {
        this.fixedUpdate();
        this.accumulator -= TICK_INTERVAL;
      }
    }, TICK_INTERVAL);
  }

  private fixedUpdate() {
    for (const [gameId, game] of activeGames) {
      if (game.status === "playing") {
        updatePhysics(game);
        broadcastToRoom(gameId, { type: "game_state", state: game.state });
      }
    }
  }
}
```

### クライアント補間

```typescript
// islands/PongCanvas.tsx
const INTERPOLATION_DELAY = 100; // 100msバッファ

class GameRenderer {
  private stateBuffer: { state: GameState; timestamp: number }[] = [];

  receiveState(state: GameState) {
    this.stateBuffer.push({ state, timestamp: Date.now() });
    // 最後の1秒分の状態のみ保持
    const cutoff = Date.now() - 1000;
    this.stateBuffer = this.stateBuffer.filter(s => s.timestamp > cutoff);
  }

  render(ctx: CanvasRenderingContext2D) {
    const renderTime = Date.now() - INTERPOLATION_DELAY;
    const interpolated = this.interpolateState(renderTime);
    this.drawGame(ctx, interpolated);
  }

  private interpolateState(targetTime: number): GameState {
    // 補間する2つの状態を見つける
    let before: { state: GameState; timestamp: number } | null = null;
    let after: { state: GameState; timestamp: number } | null = null;

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (this.stateBuffer[i].timestamp <= targetTime &&
          this.stateBuffer[i + 1].timestamp >= targetTime) {
        before = this.stateBuffer[i];
        after = this.stateBuffer[i + 1];
        break;
      }
    }

    if (!before || !after) {
      return this.stateBuffer[this.stateBuffer.length - 1]?.state ?? initialState;
    }

    const t = (targetTime - before.timestamp) / (after.timestamp - before.timestamp);
    return {
      ball: {
        x: lerp(before.state.ball.x, after.state.ball.x, t),
        y: lerp(before.state.ball.y, after.state.ball.y, t),
      },
      paddle1: { y: lerp(before.state.paddle1.y, after.state.paddle1.y, t) },
      paddle2: { y: lerp(before.state.paddle2.y, after.state.paddle2.y, t) },
      score: after.state.score, // スコアは補間しない
    };
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

### パドルのクライアントサイド予測

```typescript
// islands/PongCanvas.tsx
class PaddleController {
  private localY: number;
  private serverY: number;
  private velocity = 0;

  handleInput(direction: "up" | "down" | "none") {
    // レスポンシブ性のために即座に適用
    const speed = PADDLE_SPEED;
    this.velocity = direction === "up" ? -speed : direction === "down" ? speed : 0;

    // サーバーに送信
    ws.send(JSON.stringify({ type: "game_input", game_id, direction }));
  }

  update(deltaMs: number) {
    this.localY += this.velocity * (deltaMs / 1000);
    this.localY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, this.localY));
  }

  reconcile(serverState: GameState, isPlayer1: boolean) {
    this.serverY = isPlayer1 ? serverState.paddle1.y : serverState.paddle2.y;
    // サーバー位置に向けてスムーズに補正
    const diff = this.serverY - this.localY;
    if (Math.abs(diff) > 5) {
      this.localY += diff * 0.3; // サーバーに向けて30%ブレンド
    }
  }
}
```

---

## 7. ゲーム切断処理

### 決定: 10秒再接続ウィンドウでの一時停止

仕様明確化（2026-01-08）に従い、プレイヤーが切断した場合：

1. ゲームは即座に一時停止
2. 対戦相手には「ゲーム一時停止中 - 対戦相手を待っています」と表示
3. 10秒タイマーが開始
4. プレイヤーが10秒以内に再接続した場合、ゲームは再開
5. タイムアウトが切れた場合、対戦相手が棄権勝ち

### 実装パターン

```typescript
// lib/game.ts
const RECONNECT_TIMEOUT = 10_000; // 10秒

function handlePlayerDisconnect(gameId: string, playerId: string) {
  const game = activeGames.get(gameId);
  if (!game || game.status !== "playing") return;

  game.status = "paused";
  game.disconnectedPlayer = playerId;
  game.pausedAt = Date.now();

  // 残りのプレイヤーに通知
  const remainingPlayerId = game.player1_id === playerId ? game.player2_id : game.player1_id;
  sendToPlayer(remainingPlayerId, {
    type: "game_paused",
    reason: "opponent_disconnected",
    message: "ゲーム一時停止中 - 対戦相手を待っています",
    timeoutMs: RECONNECT_TIMEOUT,
  });

  // 棄権タイマーを開始
  game.forfeitTimer = setTimeout(() => {
    if (game.status === "paused") {
      game.status = "forfeit";
      game.winner_id = remainingPlayerId;
      endGame(gameId, "forfeit");
    }
  }, RECONNECT_TIMEOUT);
}

function handlePlayerReconnect(gameId: string, playerId: string) {
  const game = activeGames.get(gameId);
  if (!game || game.status !== "paused" || game.disconnectedPlayer !== playerId) return;

  clearTimeout(game.forfeitTimer);
  game.status = "playing";
  game.disconnectedPlayer = null;

  // 両プレイヤーに通知
  broadcastToRoom(gameId, { type: "game_resumed" });
}
```

---

## 8. トーナメントルール

### 決定: 2のべき乗のみ（4または8人のプレイヤー）、シードなし

仕様明確化（2026-01-08）に従い：

- トーナメントは最大定員4、8、または16で作成可能
- 作成者は正確に**4または8**人のプレイヤーが参加した時に手動で開始可能
- シードロジック不要 - ブラケットは常に満員
- すべてのトーナメントマッチで3本勝負形式

### ブラケット生成

```typescript
// lib/tournament.ts
function generateBracket(participants: string[]): TournamentMatch[] {
  const count = participants.length;
  if (count !== 4 && count !== 8) {
    throw new Error("トーナメントは正確に4または8人のプレイヤーが必要です");
  }

  // ランダムシードのためにシャッフル
  const shuffled = [...participants].sort(() => Math.random() - 0.5);

  const matches: TournamentMatch[] = [];
  const rounds = Math.log2(count);

  // 1回戦のマッチを生成
  for (let i = 0; i < count / 2; i++) {
    matches.push({
      id: crypto.randomUUID(),
      round: 1,
      match_index: i,
      player1_id: shuffled[i * 2],
      player2_id: shuffled[i * 2 + 1],
      status: "ready",
    });
  }

  // 後続ラウンドのプレースホルダーマッチを生成
  let prevRoundMatches = count / 2;
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = prevRoundMatches / 2;
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: crypto.randomUUID(),
        round,
        match_index: i,
        player1_id: null, // 前のラウンドから未定
        player2_id: null,
        status: "pending",
      });
    }
    prevRoundMatches = matchesInRound;
  }

  return matches;
}
```

---

## テクノロジースタックのまとめ

| コンポーネント | 決定 | バージョン/URL |
|-----------|----------|-------------|
| ランタイム | Deno | 1.40以上 |
| フレームワーク | Fresh | 1.6以上 |
| データベース | @db/sqlite経由のSQLite | jsr:@db/sqlite@0.13 |
| CSS | DaisyUI + Tailwind | 最新 |
| メトリクス | ts_prometheus | deno.land/x/ts_prometheus@v0.3.0 |
| バリデーション | Zod | npm:zod |
| WebSocket | ネイティブDeno.upgradeWebSocket | 組み込み |
| OAuth | カスタム42 API統合 | N/A |
