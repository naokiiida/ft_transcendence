# ft_transcendence Module Verification Guide

> README.ja.md と specs/modules.md に基づく全15モジュールの実装箇所・テスト・検証方法

## Summary

| # | Module | Spec # | Type | Points | 担当 | 状態 | Test File |
|---|--------|--------|------|--------|------|------|-----------|
| 1 | Web (Next.js + NestJS) | #1 | Major | 2 | 全員 | 完了 | all E2E tests |
| 2 | Standard User Management | #19 | Major | 2 | niida | 完了 | auth, profile, friendships |
| 3 | Web-based game (Pong) | #35 | Major | 2 | mkaihori | 完了 | - (manual) |
| 4 | AI Opponent | #26 | Major | 2 | oohba | 完了 | games (AI score test) |
| 5 | Remote Players | #36 | Major | 2 | oohba | 完了 | - (manual/WS) |
| 6 | DevOps (Prometheus + Grafana) | #46 | Major | 2 | niida | 完了 | observability |
| 7 | Advanced Analytics Dashboard | #49 | Major | 2 | niida | 完了 | - (Grafana UI) |
| 8 | User interaction (Chat) | #5 | Major | 2 | niida | 完了 | chat.service.spec |
| 9 | Public API | #6 | Major | 2 | niida | 完了 | api-key, rate-limit |
| 10 | 42 OAuth | #21 | Minor | 1 | mkaihori | 未完了 | - (manual) |
| 11 | Game Customization | #42 | Minor | 1 | oohba | 完了 | - (manual) |
| 12 | Custom Design System | #12 | Minor | 1 | masho | 完了 | - (Storybook) |
| 13 | Game Statistics | #20 | Minor | 1 | niida | 完了 | games, game-statistics |
| 14 | Server-Side Rendering (SSR) | #10 | Minor | 1 | 全員 | 完了 | - (manual) |
| 15 | ORM (Drizzle) | #7 | Minor | 1 | 全員 | 完了 | all (DB-backed) |
| | **Total** | | | **24** | | | |

---

## E2E Test Execution

```bash
# 全テスト一括実行
cd backend && npx jest --config test/jest-e2e.json

# 個別実行
cd backend && npx jest --config test/jest-e2e.json auth
cd backend && npx jest --config test/jest-e2e.json profile
cd backend && npx jest --config test/jest-e2e.json friendships
cd backend && npx jest --config test/jest-e2e.json games
cd backend && npx jest --config test/jest-e2e.json game-statistics
cd backend && npx jest --config test/jest-e2e.json matchmaking
cd backend && npx jest --config test/jest-e2e.json api-key
cd backend && npx jest --config test/jest-e2e.json observability
cd backend && npx jest --config test/jest-e2e.json rate-limit
```

---

## Module Details

### 1. Web — Use a framework (Next.js + NestJS) — Major 2pt — Spec #1

> Frontend framework + Backend framework。Full-stack (Next.js + NestJS) で両方をカバー。

**Implementation:**
- `backend/src/main.ts` — NestJS bootstrap, OpenAPI/Swagger setup, Scalar API Reference
- `backend/src/app.module.ts` — Root module (imports all feature modules)
- `backend/package.json` — NestJS v11, Express adapter
- `frontend/app/layout.tsx` — Next.js App Router root layout
- `frontend/next.config.ts` — Next.js configuration
- `frontend/package.json` — Next.js 16, React 19
- `docker-compose.yml` — 全サービスのコンテナ化

**Tests:** 全 E2E テストが NestJS フレームワークの動作を証明。

**Manual Verification:**
```bash
# Swagger UI
open http://localhost:3001/api/docs

# Scalar API Reference
open http://localhost:3001/api/reference

# Health check
curl http://localhost:3001/api/health

# Frontend
open http://localhost:3000
```

---

### 2. Standard User Management and Authentication — Major 2pt — Spec #19

> Profile updates, avatar upload, add friends/see online status, profile page.

**Implementation:**
- `backend/src/auth/auth.controller.ts` — POST /api/auth/register, /api/auth/login, /api/auth/logout
- `backend/src/auth/auth.service.ts` — bcrypt hashing, session management
- `backend/src/auth/session.controller.ts` — GET /api/me, PATCH /api/me/profile, DELETE /api/me, avatar upload
- `backend/src/auth/auth.guard.ts` — Global auth guard (session + API key)
- `backend/src/auth/decorators.ts` — @Public, @RequireUser, @CurrentUser, @OptionalAuth
- `backend/src/users/users.service.ts` — User CRUD, profile update
- `backend/src/friendships/` — Friend request lifecycle (send, accept, decline, list, delete)
- `backend/src/db/schema.ts` — users, sessions, friendships tables
- `frontend/app/login/page.tsx` — Login/registration UI
- `frontend/app/user/page.tsx` — Profile page (stats, records, settings tabs)
- `frontend/components/shared/avatar-upload.tsx` — Avatar upload component
- `frontend/components/shared/online-indicator.tsx` — Online status indicator

**Tests:**
- `backend/test/auth.e2e-spec.ts` — Registration, login (13 tests)
- `backend/test/profile.e2e-spec.ts` — Profile update, score (9 tests)
- `backend/test/friendships.e2e-spec.ts` — Friend request lifecycle (26 tests)

**Manual Verification:**
```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test1234","display_name":"TestUser"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test1234"}' -c cookies.txt

# Get profile
curl http://localhost:3001/api/me -b cookies.txt

# Update profile
curl -X PATCH http://localhost:3001/api/me/profile \
  -H 'Content-Type: application/json' \
  -d '{"display_name":"NewName"}' -b cookies.txt
```

---

### 3. Web-based game (Pong) — Major 2pt — Spec #35

> Real-time multiplayer game with live matches, clear rules, win/loss conditions.

**Implementation:**
- `frontend/lib/game/engine.ts` — PongEngine class, game state initialization, main loop
- `frontend/lib/game/physics.ts` — Ball physics, paddle collision, scoring logic
- `frontend/lib/game/state.ts` — GameState type definitions (paddles, ball, score)
- `frontend/lib/game/renderer.ts` — Canvas 2D rendering (paddles, ball, scores, UI)
- `frontend/lib/game/match.ts` — LocalMatch class orchestrating game execution
- `frontend/app/game/local/page.tsx` — Local 2-player game page

**Manual Verification:**
1. http://localhost:3000/game/local にアクセス
2. プレイヤー1: W/S キー、プレイヤー2: ↑/↓ キーで操作
3. 11点先取でゲーム終了
4. スコア表示とゲーム終了画面を確認

---

### 4. AI Opponent — Major 2pt — Spec #26

> Challenging AI that wins occasionally, simulates human-like behavior. Must be able to explain during evaluation.

**Implementation:**
- `frontend/lib/game/controllers.ts` — AIController class with 4 difficulty configs:
  - Easy: 高反応遅延、低精度、高ミス率
  - Medium: 中程度のバランス
  - Hard: 低反応遅延、高精度
  - EuropeanHard: 最低遅延、最高精度（隠し難易度）
- `frontend/app/game/ai/page.tsx` — AI game page with difficulty selection
- `frontend/lib/game/ball-colors.ts` — ランクに基づくボールカラーシステム
- `backend/src/db/schema.ts` — games.game_type='ai', games.ai_difficulty field

**AI 動作原理（評価時に説明可能であること）:**
- パドル追跡アルゴリズム: ボール位置を予測し、ノイズ付きでパドルを移動
- 設定可能パラメータ: reaction delay, decision interval, aim noise, miss chance, dead zone
- 人間的振る舞い: ランダムなミスとノイズで完璧すぎない動きを再現

**Tests:**
- `backend/test/games.e2e-spec.ts` — 「AI ゲームではスコア未変動」テスト

**Manual Verification:**
1. http://localhost:3000/game/ai にアクセス
2. 難易度を選択（Easy / Medium / Hard / EuropeanHard）
3. AI がボールを追跡し、難易度に応じた精度で応答することを確認
4. ゲーム終了後、user_score が変動しないことを確認（AI戦はランキング対象外）

---

### 5. Remote Players — Major 2pt — Spec #36

> Two players on separate computers play in real-time. Handle latency/disconnections, smooth UX.

**Implementation:**
- `backend/src/realtime/game.gateway.ts` — WebSocket gateway for game events
- `backend/src/realtime/game-session.service.ts` — Game session lifecycle management
- `backend/src/realtime/game/engine.ts` — Server-side game engine (server authoritative model)
- `backend/src/realtime/game/physics.ts` — Server-side ball/paddle physics
- `backend/src/realtime/game/state.ts` — Game state definition
- `backend/src/matchmaking/matchmaking.controller.ts` — POST /join, /leave, GET /status
- `backend/src/matchmaking/matchmaking.service.ts` — Queue management, pairing logic
- `frontend/app/game/online/page.tsx` — Queue/matchmaking UI
- `frontend/app/game/online/match/online-match-client.tsx` — WebSocket client-side sync
- `frontend/components/game/matchmaking-queue.tsx` — Queue UI component

**Tests:**
- `backend/test/matchmaking.e2e-spec.ts` — キュー参加/離脱/ステータス/自動マッチング (10 tests)

**Manual Verification:**
1. ブラウザ2つで http://localhost:3000 にログイン（別ユーザー）
2. 両方で「Online Game」→「Join Queue」
3. マッチングされたら対戦開始
4. 入力がリアルタイムに同期されることを確認
5. 一方が切断した場合の forfeit 処理を確認

---

### 6. DevOps — Prometheus + Grafana Monitoring — Major 2pt — Spec #46

> Set up Prometheus, configure exporters, custom Grafana dashboards, alerting rules, secure access.

**Implementation:**
- `backend/src/observability/metrics.service.ts` — prom-client metrics collection (custom metrics)
- `backend/src/observability/metrics.interceptor.ts` — HTTP request/response duration tracking
- `backend/src/observability/metrics.controller.ts` — GET /api/metrics (Prometheus text format)
- `backend/src/observability/health.controller.ts` — GET /api/health
- `frontend/app/api/metrics/route.ts` — Frontend metrics endpoint
- `frontend/app/api/health/route.ts` — Frontend health endpoint
- `infra/prometheus/prometheus.yml` — Prometheus scrape config (backend, frontend, self)
- `infra/grafana/dashboards/backend-overview.json` — Pre-built Grafana dashboard
- `infra/grafana/provisioning/datasources/datasources.yml` — Prometheus datasource
- `infra/grafana/provisioning/dashboards/dashboards.yml` — Dashboard provisioning

**Tests:**
- `backend/test/observability.e2e-spec.ts` — Health endpoint, Prometheus format (4 tests)

**Manual Verification:**
```bash
# Health
curl http://localhost:3001/api/health

# Metrics (Prometheus text format)
curl http://localhost:3001/api/metrics

# Prometheus UI
open http://localhost:9090

# Grafana UI (admin/admin)
open http://localhost:3002
```

---

### 7. Advanced Analytics Dashboard — Major 2pt — Spec #49

> Interactive charts/graphs, real-time data updates, customizable date ranges and filters.

**Implementation:**
- `infra/grafana/dashboards/backend-overview.json` — バックエンド概要ダッシュボード
  - HTTP リクエスト数/秒、レイテンシ、ステータスコード分布
  - WebSocket 接続数、アクティブゲーム数
  - リアルタイム更新
- `infra/grafana/provisioning/` — Datasource & dashboard 自動プロビジョニング
- `docker-compose.yml` — Grafana サービス (port 3002)、デフォルトホームダッシュボード設定

**Manual Verification:**
1. http://localhost:3002 にアクセス（admin/admin）
2. ダッシュボードでリアルタイムメトリクスを確認
3. 時間範囲フィルターを変更して対話的操作を確認
4. グラフの種類（line, bar 等）を確認

---

### 8. User interaction — Chat, Profile, Friends — Major 2pt — Spec #5

> Basic chat system (send/receive), profile system (view user info), friends system (add/remove, see friends list).

**Implementation:**
- `backend/src/realtime/chat.service.ts` — ChatService (rate limiting: 5 messages/10s, 200 chars max)
- `backend/src/realtime/game.gateway.ts` — WebSocket `chat_message` / `chat_received` handling
- `backend/src/realtime/chat.service.spec.ts` — Chat rate limiting unit test
- `backend/src/friendships/` — Friend system (request, accept, decline, list, delete)
- `frontend/components/game/chat-panel.tsx` — In-game chat UI
- `frontend/app/user/page.tsx` — Profile page
- `frontend/components/user/profile-tab.tsx` — Profile display
- `frontend/components/user/friends-tab.tsx` — Friends list/management

**Tests:**
- `backend/src/realtime/chat.service.spec.ts` — Chat rate limiting unit tests
- `backend/test/friendships.e2e-spec.ts` — Friend request lifecycle (26 tests)

**Manual Verification:**
1. ブラウザ2つでオンライン対戦を開始
2. チャットパネルでメッセージ送受信を確認
3. レート制限（5通/10秒）を超えた場合のエラーを確認
4. フレンドリストでオンライン状態を確認

---

### 9. Public API — Major 2pt — Spec #6

> API with secured API key, rate limiting, documentation, and at least 5 endpoints (GET, POST, PUT, DELETE).

**Implementation:**
- `backend/src/main.ts` — OpenAPI document generation (DocumentBuilder), Scalar API Reference
- `backend/src/auth/auth.guard.ts` — API key authentication (X-API-Key header)
- `backend/src/app.module.ts` — ThrottlerModule (rate limiting)
- Scalar UI: `/api/reference`、Swagger UI: `/api/docs`
- Tag groups: Public (auth, observability) vs Private (session, users, games, friendships, matchmaking)

**Endpoints (5+ with GET, POST, PUT, DELETE):**
- GET: `/api/me`, `/api/games/history/:userId`, `/api/users/leaderboard`, `/api/users/search`, `/api/health`, `/api/metrics`
- POST: `/api/auth/register`, `/api/auth/login`, `/api/matchmaking/join`, `/api/friendships/:userId/request`
- PATCH: `/api/me/profile`, `/api/friendships/:id/accept`
- DELETE: `/api/me`, `/api/auth/logout`, `/api/matchmaking/leave`, `/api/friendships/:id`

**Tests:**
- `backend/test/api-key.e2e-spec.ts` — API key authentication, endpoint protection (13 tests)
- `backend/test/rate-limit.e2e-spec.ts` — Rate limiting (2 tests)

**Manual Verification:**
```bash
# API Reference (interactive documentation)
open http://localhost:3001/api/reference

# API key access
curl http://localhost:3001/api/users/leaderboard -H 'X-API-Key: <key>'

# Rate limiting test (rapid requests)
for i in $(seq 1 20); do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/health; done
```

---

### 10. 42 OAuth — Minor 1pt — Spec #21 — 未完了

> Implement OAuth 2.0 (42).

**Implementation (partial):**
- `backend/src/auth/strategies/ft.strategy.ts` — Passport-42 strategy
- `backend/src/auth/auth.controller.ts` — GET /api/auth/42 (redirect), GET /api/auth/42/callback
- `backend/src/auth/auth.service.ts` — login42() method
- `backend/src/db/schema.ts` — users.intra_id, users.intra_username fields
- `frontend/app/login/page.tsx` — 「Login with 42」ボタン

**Configuration:** `.env` の FT_CLIENT_ID, FT_CLIENT_SECRET, FT_CALLBACK_URL

**状態:** 未完了

---

### 11. Game Customization — Minor 1pt — Spec #42

> Power-ups, attacks, special abilities, different maps/themes, customizable settings, default options available.

**Implementation:**
- `frontend/lib/game/ball-colors.ts` — ランクに基づくボールカラーシステム
- `frontend/lib/game/preferences.ts` — LocalStorage ベースのゲーム設定
  - `getBallColorByRankEnabled()` / `setBallColorByRankEnabled()`
  - Custom React hook: `useBallColorByRankEnabled()`
- `frontend/lib/game/rank.ts` — ランクシステム（ビジュアルカスタマイズ）

**Manual Verification:**
1. ゲーム画面でカスタマイズオプションを確認
2. ランクに応じたボールカラーの変化を確認
3. 設定がローカルストレージに保存されることを確認

---

### 12. Custom Design System — Minor 1pt — Spec #12

> Reusable components with proper color palette, typography, and icons (minimum: 10 reusable components).

**Implementation:**
- `frontend/.storybook/` — Storybook setup (main.ts, preview.tsx, manager.ts)
- `frontend/Dockerfile.storybook` — Containerized Storybook
- `frontend/tailwind.config.ts` — Theme config with custom CSS variables
- `frontend/app/globals.css` — CSS variable definitions, dark mode

**UI Components (17+ reusable components):**
- `frontend/components/ui/button.tsx` — Button with variants
- `frontend/components/ui/card.tsx` — Card container
- `frontend/components/ui/input.tsx` — Form input
- `frontend/components/ui/label.tsx` — Form labels
- `frontend/components/ui/dialog.tsx` — Modal dialog
- `frontend/components/ui/tabs.tsx` — Tab navigation
- `frontend/components/ui/avatar.tsx` — User avatars
- `frontend/components/ui/badge.tsx` — Badge/tag
- `frontend/components/ui/progress.tsx` — Progress bar
- `frontend/components/ui/dropdown-menu.tsx` — Dropdown menu
- `frontend/components/ui/scroll-area.tsx` — Scrollable area
- `frontend/components/ui/separator.tsx` — Divider
- `frontend/components/ui/tooltip.tsx` — Tooltip
- `frontend/components/ui/alert.tsx` — Alert box
- `frontend/components/ui/skeleton.tsx` — Loading skeleton
- `frontend/components/ui/table.tsx` — Data table
- `frontend/components/ui/sonner.tsx` — Toast notifications

**Storybook Stories:** 主要コンポーネントに `.stories.tsx` ファイルあり

**Manual Verification:**
```bash
# Storybook UI
open http://localhost:6006

# Application UI (consistent design)
open http://localhost:3000
```

---

### 13. Game Statistics and Match History — Minor 1pt — Spec #20

> Track stats (wins, losses, ranking), match history (1v1), leaderboard.

**Implementation:**
- `backend/src/games/games.controller.ts` — GET /api/games/:id, /api/games/history/:userId
- `backend/src/games/games.service.ts` — getMatchHistory() (pagination), findById()
- `backend/src/users/users.controller.ts` — GET /api/users/leaderboard, /api/users/search
- `backend/src/users/users.service.ts` — getLeaderboard() (RANK window), recordGameResult() (wins/losses/score ±25)
- `backend/src/db/schema.ts` — games table, indexes on player1_id, player2_id, created_at, user_score
- `frontend/components/user/stats-tab.tsx` — Stats display (wins, losses, rating)
- `frontend/components/user/record-tab.tsx` — Match history list

**Tests:**
- `backend/test/games.e2e-spec.ts` — Game detail, history, pagination, score calculation (13 tests)
- `backend/test/game-statistics.e2e-spec.ts` — Leaderboard, search, score integrity (10 tests)

**Manual Verification:**
```bash
# Leaderboard
curl 'http://localhost:3001/api/users/leaderboard?limit=10' -H 'X-API-Key: <key>'

# Match history with pagination
curl 'http://localhost:3001/api/games/history/<userId>?limit=5&offset=0' -H 'X-API-Key: <key>'

# User profile page (stats & history tabs)
open http://localhost:3000/user
```

---

### 14. Server-Side Rendering (SSR) — Minor 1pt — Spec #10

> SSR for improved performance and SEO.

**Implementation:**
- `frontend/next.config.ts` — `output: "standalone"` for production SSR
- `frontend/app/page.tsx` — Home page (`/`) — Server Component (SSR)
- `frontend/app/privacy/page.tsx` — Privacy policy page — Server Component (SSR)
- `frontend/app/terms/page.tsx` — Terms of service page — Server Component (SSR)
- `frontend/app/login/page.tsx` — Login page — Server Component (SSR)

**SSR vs CSR の区別:**
- SSR ページ: `"use client"` ディレクティブなし → サーバーサイドでレンダリング
- CSR ページ: `frontend/app/game/ai/page.tsx`, `frontend/app/game/online/match/page.tsx` など → `"use client"` で明示的にクライアントサイド

**Manual Verification:**
```bash
# Page source を確認（HTML にコンテンツが含まれている = SSR）
curl -s http://localhost:3000 | head -50

# Privacy page (SSR)
curl -s http://localhost:3000/privacy | head -50

# Terms page (SSR)
curl -s http://localhost:3000/terms | head -50

# DevTools → Network → Doc → Preview で初期HTMLにコンテンツが含まれることを確認
```

---

### 15. ORM (Drizzle) — Minor 1pt — Spec #7

> Use an ORM for the database.

**Implementation:**
- `backend/src/db/database.ts` — better-sqlite3 instance creation, getDatabase(), closeDatabase()
- `backend/src/db/schema.ts` — Drizzle schema (4 tables: users, sessions, games, friendships)
- `backend/src/db/migrate.ts` — Migration runner
- `backend/package.json` — drizzle-orm v0.45, drizzle-kit v0.31, better-sqlite3 v12.6

**Schema:**
- `users` — UUID PK, email(unique), display_name(unique), password_hash, intra_*, wins, losses, user_score
- `sessions` — FK→users(cascade), expires_at
- `games` — FK→users (player1, player2, winner), game_type, status, scores
- `friendships` — FK→users(cascade), status (pending/accepted/declined)

**CLI Commands:**
```bash
npm run db:generate   # Generate migration files
npm run db:push       # Push schema changes
npm run db:migrate    # Run migrations
npm run db:studio     # Interactive Drizzle Studio
```

**Tests:** 全 DB-backed E2E テストが ORM の動作を検証。

---

## Test Summary

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `auth.e2e-spec.ts` | 13 | Registration, login |
| `profile.e2e-spec.ts` | 9 | Profile update, score |
| `friendships.e2e-spec.ts` | 26 | Friend request lifecycle |
| `games.e2e-spec.ts` | 13 | Game detail, history, score calc |
| `game-statistics.e2e-spec.ts` | 10 | Leaderboard, search, integrity |
| `matchmaking.e2e-spec.ts` | 10 | Queue join/leave/match |
| `api-key.e2e-spec.ts` | 13 | API key auth, endpoint protection |
| `observability.e2e-spec.ts` | 4 | Health, metrics |
| `rate-limit.e2e-spec.ts` | 2 | Rate limiting |
| **Total** | **100** | |
