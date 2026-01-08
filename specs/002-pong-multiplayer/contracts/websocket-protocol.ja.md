# WebSocketプロトコル: ft_transcendence

**エンドポイント**: `wss://pong.taiida.com/api/ws`
**認証**: セッションCookieが必要

## 接続

```
GET /api/ws
Cookie: session=<session_token>
Upgrade: websocket
Connection: Upgrade
```

すべてのメッセージは`type`フィールドを識別子として持つJSONです。

## メッセージタイプ

### クライアント → サーバー

#### `ping`
接続維持とオンラインプレゼンスのためのハートビート。

```json
{
  "type": "ping",
  "timestamp": 1704067200000
}
```

#### `matchmaking_join`
クイックマッチのマッチメイキングキューに参加。

```json
{
  "type": "matchmaking_join"
}
```

#### `matchmaking_leave`
マッチメイキングキューから離脱。

```json
{
  "type": "matchmaking_leave"
}
```

#### `game_join`
特定のゲームルームに参加。

```json
{
  "type": "game_join",
  "game_id": "uuid"
}
```

#### `game_leave`
現在のゲームルームから離脱。

```json
{
  "type": "game_leave",
  "game_id": "uuid"
}
```

#### `game_ready`
開始準備完了を通知（両プレイヤーが送信する必要あり）。

```json
{
  "type": "game_ready",
  "game_id": "uuid"
}
```

#### `game_input`
パドル入力を送信。クライアントから60Hzで送信。

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
現在のゲームルームでチャットメッセージを送信。

```json
{
  "type": "chat_message",
  "game_id": "uuid",
  "content": "string (最大200文字)"
}
```

#### `ai_explain`
AI判断の説明をリクエスト（AIゲームのみ）。

```json
{
  "type": "ai_explain",
  "game_id": "uuid"
}
```

---

### サーバー → クライアント

#### `pong`
pingへの応答。

```json
{
  "type": "pong",
  "timestamp": 1704067200000,
  "server_time": 1704067200005
}
```

#### `error`
エラー通知。

```json
{
  "type": "error",
  "code": "string",
  "message": "string"
}
```

エラーコード:
- `UNAUTHORIZED` - 無効または期限切れのセッション
- `INVALID_MESSAGE` - 不正なメッセージ形式
- `RATE_LIMITED` - メッセージ送信過多
- `GAME_NOT_FOUND` - ゲームが存在しない
- `NOT_IN_GAME` - ゲーム内でのアクションが必要
- `GAME_FULL` - ゲームには既に2人のプレイヤーがいる

#### `matchmaking_status`
キュー位置の更新。

```json
{
  "type": "matchmaking_status",
  "position": 1,
  "estimated_wait_seconds": 30
}
```

#### `matchmaking_found`
マッチが見つかり、ゲームへリダイレクト。

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
ゲームルームへの参加成功。

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
別のプレイヤーがゲームに参加。

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
プレイヤーが準備完了を通知。

```json
{
  "type": "game_player_ready",
  "game_id": "uuid",
  "player_number": 1 | 2
}
```

#### `game_countdown`
ゲーム開始カウントダウン。

```json
{
  "type": "game_countdown",
  "game_id": "uuid",
  "seconds_remaining": 3
}
```

#### `game_state`
権威あるゲーム状態のブロードキャスト。30Hzで送信。

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
スコア更新（イベント処理のためgame_stateに加えて送信）。

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
ゲーム終了。

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
対戦相手が切断（30秒の猶予期間開始）。

```json
{
  "type": "game_player_disconnected",
  "game_id": "uuid",
  "player_number": 1 | 2,
  "reconnect_deadline": 1704067230000
}
```

#### `game_player_reconnected`
切断されたプレイヤーが再接続。

```json
{
  "type": "game_player_reconnected",
  "game_id": "uuid",
  "player_number": 1 | 2
}
```

#### `chat_received`
別のプレイヤーからのチャットメッセージ。

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
AI判断の説明（ai_explainへの応答）。

```json
{
  "type": "ai_explanation",
  "game_id": "uuid",
  "explanation": {
    "predicted_ball_y": 350,
    "target_paddle_y": 340,
    "decision": "moving_up",
    "confidence": 0.85,
    "reasoning": "ボールの軌道からy=350での衝突を予測、パドルを移動して迎撃"
  }
}
```

#### `presence_update`
フレンドがオンライン/オフラインになった（フレンドとして登録しているユーザーに送信）。

```json
{
  "type": "presence_update",
  "user_id": "uuid",
  "is_online": true,
  "last_seen": "2024-01-01T00:00:00Z"
}
```

---

## ゲーム定数

クライアントサイドのレンダリングと予測に使用。

```typescript
const GAME_CONSTANTS = {
  // キャンバスサイズ
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,

  // パドル
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 100,
  PADDLE_SPEED: 8,
  PADDLE_MARGIN: 20,  // 端からの距離

  // ボール
  BALL_RADIUS: 8,
  BALL_INITIAL_SPEED: 5,
  BALL_MAX_SPEED: 12,
  BALL_SPEED_INCREMENT: 0.5,  // ヒットごと

  // ゲームルール
  WINNING_SCORE: 11,
  COUNTDOWN_SECONDS: 3,

  // タイミング
  SERVER_TICK_RATE: 30,      // 毎秒更新回数
  CLIENT_INPUT_RATE: 60,     // 毎秒入力回数
  RECONNECT_GRACE_MS: 30000, // 30秒

  // 制限
  CHAT_MAX_LENGTH: 200,
  CHAT_RATE_LIMIT: 5,        // 10秒あたりのメッセージ数
};
```

---

## 接続ライフサイクル

```
┌─────────────┐
│   接続      │
└──────┬──────┘
       │
       ▼
┌─────────────┐  失敗   ┌─────────────┐
│ ハンドシェイク │────────►│   切断      │
└──────┬──────┘         └─────────────┘
       │ 成功
       ▼
┌─────────────┐
│   待機      │◄───────────────┐
└──────┬──────┘                │
       │ matchmaking_join      │ game_ended
       ▼                       │
┌─────────────┐                │
│ キュー中    │                │
└──────┬──────┘                │
       │ matchmaking_found     │
       ▼                       │
┌─────────────┐                │
│  ゲーム中   │────────────────┘
└─────────────┘
```

---

## 再接続プロトコル

1. クライアントが切断を検出（WebSocket `close`イベント）
2. クライアントが指数バックオフを開始: 1秒、2秒、4秒、8秒、最大30秒
3. 再接続時、クライアントは最後の既知の`game_id`をURLに含める: `/api/ws?resume=<game_id>`
4. サーバーがセッションを検証し、ゲームが猶予期間内かを確認
5. 有効な場合、サーバーは現在の状態と共に`game_joined`を送信
6. 期限切れの場合、サーバーは`GAME_EXPIRED`コードでエラーを送信

```typescript
// クライアント再接続の例
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
