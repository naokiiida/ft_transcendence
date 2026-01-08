# WebSocketプロトコル: ft_transcendence

**バージョン**: 1.0.0
**エンドポイント**: `wss://pong.taiida.com/api/ws`

## 接続

### 認証

WebSocket接続には有効なセッションCookieが必要です。接続は以下の場合にのみアップグレードされます：
1. リクエストに`session` Cookieが含まれている
2. セッションが有効で期限切れでない

### 接続URL

```
wss://pong.taiida.com/api/ws?game_id={gameId}
```

**クエリパラメータ:**
- `game_id`（オプション）: 参加するゲームのUUID。省略した場合、接続はプレゼンス/チャット専用。

---

## メッセージ形式

すべてのメッセージは`type`識別子フィールドを持つJSONです。

```typescript
interface BaseMessage {
  type: string;
  timestamp?: number;  // サーバーが送信時に追加
}
```

---

## クライアント → サーバーメッセージ

### `ping`
キープアライブハートビート。30秒ごとに送信。

```json
{ "type": "ping" }
```

### `game_input`
アクティブなゲーム中のパドル移動入力。

```json
{
  "type": "game_input",
  "game_id": "uuid",
  "direction": "up" | "down" | "none"
}
```

### `chat_message`
ゲーム中にチャットメッセージを送信。

```json
{
  "type": "chat_message",
  "game_id": "uuid",
  "content": "string (最大200文字)"
}
```

### `join_game`
特定のゲームルームに参加。

```json
{
  "type": "join_game",
  "game_id": "uuid"
}
```

### `leave_game`
現在のゲームルームから離脱。

```json
{
  "type": "leave_game",
  "game_id": "uuid"
}
```

### `ai_explain`
AI判断の説明をリクエスト（AIゲームのみ）。

```json
{
  "type": "ai_explain",
  "game_id": "uuid"
}
```

---

## サーバー → クライアントメッセージ

### `pong`
pingへの応答。

```json
{ "type": "pong" }
```

### `game_state`
権威あるゲーム状態更新。アクティブなゲーム中は30 Hzで送信。

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
ゲームルーム参加の確認。

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
ゲームが開始（カウントダウン開始）。

```json
{
  "type": "game_start",
  "game_id": "uuid",
  "countdown_seconds": 3
}
```

### `game_paused`
切断によりゲームが一時停止。

```json
{
  "type": "game_paused",
  "game_id": "uuid",
  "reason": "opponent_disconnected",
  "message": "ゲーム一時停止中 - 対戦相手を待っています",
  "timeout_ms": 10000
}
```

### `game_resumed`
再接続後にゲーム再開。

```json
{
  "type": "game_resumed",
  "game_id": "uuid"
}
```

### `game_ended`
ゲーム終了。

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
対戦相手からのチャットメッセージ。

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
チャットレート制限超過。

```json
{
  "type": "chat_rate_limited",
  "retry_after_ms": 10000
}
```

### `matchmaking_found`
キューからマッチが見つかった。

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
AI判断の説明（ai_explainへの応答）。

```json
{
  "type": "ai_explanation",
  "game_id": "uuid",
  "decision": {
    "predicted_ball_y": 320,
    "target_paddle_y": 315,
    "movement": "up",
    "confidence": 0.85,
    "reason": "ボールの軌道からy=320での衝突を予測"
  }
}
```

### `tournament_match_ready`
トーナメントマッチの開始準備完了。

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
フレンドがオンラインになった。

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
フレンドがオフラインになった。

```json
{
  "type": "friend_offline",
  "friend_id": "uuid"
}
```

### `friend_request`
フレンドリクエストを受信。

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
エラーメッセージ。

```json
{
  "type": "error",
  "code": "string",
  "message": "string"
}
```

**エラーコード:**
- `INVALID_MESSAGE` - 不正なJSONまたは不明なメッセージタイプ
- `GAME_NOT_FOUND` - ゲームIDが存在しない
- `NOT_IN_GAME` - 参加せずに入力を送信しようとした
- `UNAUTHORIZED` - セッション期限切れ
- `RATE_LIMITED` - メッセージ送信過多

---

## ゲーム定数

物理シミュレーションのためにクライアントとサーバーで共有。

```typescript
// shared/game/constants.ts
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 100;
export const PADDLE_SPEED = 400;  // ピクセル/秒
export const BALL_RADIUS = 10;
export const BALL_INITIAL_SPEED = 300;
export const BALL_MAX_SPEED = 600;
export const BALL_SPEED_INCREMENT = 1.05;  // ヒットごとに5%速く
export const WINNING_SCORE = 11;
export const TICK_RATE = 30;  // サーバー更新/秒
```

---

## 接続ライフサイクル

```
1. クライアントがセッションCookie付きでWebSocketを開く
2. サーバーがセッションを検証
3. サーバーが初期状態を送信（game_idが提供された場合）
4. クライアントは30秒ごとにpingを送信
5. サーバーはアクティブなゲーム中は30 Hzでgame_stateを送信
6. 切断時: 10秒再接続ウィンドウ
7. タイムアウト時: 棄権してクローズ
```

---

## レート制限

| メッセージタイプ | 制限 |
|--------------|-------|
| `game_input` | 60/秒（ゲームごと） |
| `chat_message` | 5/10秒（ゲームごと） |
| `ping` | 1/秒 |
| その他 | 10/秒 |
