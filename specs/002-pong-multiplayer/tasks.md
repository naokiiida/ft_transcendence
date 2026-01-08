# Tasks: ft_transcendence - Multiplayer Pong Platform

**Input**: Design documents from `/specs/002-pong-multiplayer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - omitting test tasks (add via `/speckit.tasks` with TDD flag if needed)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US7 maps to spec.md P1-P4 stories)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization per plan.md structure

- [ ] T001 Create Fresh project with `deno run -A -r https://fresh.deno.dev` in repository root
- [ ] T002 [P] Configure deno.json: strict TypeScript, tasks (dev, build, lint, test, setup), import maps
- [ ] T003 [P] Configure tailwind.config.ts with DaisyUI plugin per research.md
- [ ] T004 [P] Create .env.example with FT_CLIENT_ID, FT_CLIENT_SECRET, FT_REDIRECT_URI, SESSION_SECRET
- [ ] T005 Create directory structure per plan.md: routes/, islands/, components/, shared/, lib/, static/, infra/
- [ ] T006 [P] Create .hooks/pre-commit with `deno task lint && deno task check` and configure in deno.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Types

- [ ] T007 Create lib/db.ts with SQLite WAL mode initialization per research.md (jsr:@db/sqlite@0.13)
- [ ] T008 Create lib/migrations/001_initial_schema.sql with all tables from data-model.md
- [ ] T009 Create lib/migrations/runner.ts with migration version tracking
- [ ] T010 [P] Create shared/types/user.ts with User, Session, Friendship types per data-model.md
- [ ] T011 [P] Create shared/types/game.ts with Game, GameState, GameType types per data-model.md
- [ ] T012 [P] Create shared/types/tournament.ts with Tournament, TournamentMatch, TournamentParticipant types
- [ ] T013 [P] Create shared/types/ws.ts with all WebSocket message types per contracts/websocket.md
- [ ] T014 [P] Create shared/schemas/auth.ts with Zod schemas: RegisterRequest, LoginRequest per contracts/api.yaml
- [ ] T015 [P] Create shared/schemas/user.ts with UpdateProfileRequest schema per contracts/api.yaml
- [ ] T016 [P] Create shared/schemas/game.ts with GameInput, ChatMessage schemas per contracts/websocket.md
- [ ] T017 [P] Create shared/schemas/tournament.ts with CreateTournamentRequest schema per contracts/api.yaml

### Core Infrastructure

- [ ] T018 Create lib/logger.ts with JSON structured logging and correlation IDs
- [ ] T019 Create lib/metrics.ts with Prometheus metrics per research.md (ts_prometheus)
- [ ] T020 Create routes/_middleware.ts with CSRF token generation/validation framework
- [ ] T021 Create routes/_app.tsx with Tailwind styles and DaisyUI theme provider
- [ ] T022 [P] Create components/layout/Header.tsx with navigation structure
- [ ] T023 [P] Create components/layout/Footer.tsx with copyright
- [ ] T024 [P] Create components/layout/Nav.tsx with auth-aware navigation links
- [ ] T025 [P] Create components/ui/Button.tsx as DaisyUI wrapper
- [ ] T026 [P] Create components/ui/Card.tsx as DaisyUI wrapper
- [ ] T027 [P] Create components/ui/Modal.tsx as DaisyUI wrapper
- [ ] T028 [P] Create components/ui/Badge.tsx as DaisyUI wrapper

### System Endpoints

- [ ] T029 Create routes/health.ts returning { status: "ok", timestamp } per contracts/api.yaml
- [ ] T030 Create routes/metrics.ts exposing Prometheus metrics in text/plain format

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 2 - Authentication (Priority: P1) 🎯 MVP-BLOCKING

**Goal**: Users can authenticate via email/password OR 42 OAuth and receive a session

**Independent Test**: (a) Register with email/password, login, verify profile; (b) Click "Login with 42", complete OAuth, verify profile

**Why before US1**: Authentication is required for matchmaking and game creation

### Core Auth Infrastructure

- [ ] T031 [US2] Create lib/password.ts with hashPassword(), verifyPassword() using bcrypt (cost factor 12)
- [ ] T032 [US2] Create lib/session.ts with createSession(), getSession(), deleteSession() using db.prepare()
- [ ] T033 [US2] Create lib/oauth42.ts with getAuthorizationUrl(), exchangeCodeForToken(), fetchUserProfile() per research.md

### Email/Password Auth

- [ ] T034 [P] [US2] Create routes/register.tsx with email, password, display_name form + client validation
- [ ] T035 [P] [US2] Create routes/login.tsx with email/password form + "Login with 42" button
- [ ] T036 [US2] Create routes/api/auth/register.ts: validate with Zod, check email uniqueness, hash password, create user, create session
- [ ] T037 [US2] Create routes/api/auth/login.ts: validate, verify password, rate-limit (5 attempts/15 min), create session

### 42 OAuth Auth

- [ ] T038 [US2] Create routes/api/auth/oauth/42/index.ts: generate state, redirect to 42 authorize URL
- [ ] T039 [US2] Create routes/api/auth/oauth/42/callback.ts: validate state, exchange code, merge/create user, create session
- [ ] T040 [US2] Implement account merge logic in callback: link OAuth to existing user if email matches

### Common Auth

- [ ] T041 [US2] Create routes/api/auth/logout.ts: invalidate session, clear cookie
- [ ] T042 [US2] Update routes/_middleware.ts to extract session from cookie and populate ctx.state.user
- [ ] T043 [US2] Create routes/api/users/me.ts returning current user profile per contracts/api.yaml
- [ ] T044 [US2] Create routes/index.tsx (home page) with auth-aware content (Quick Match button for logged-in users)

**Checkpoint**: Users can register/login via email/password OR 42 OAuth and see their profile data

---

## Phase 4: User Story 1 - Quick Match Online (Priority: P1) 🎯 MVP

**Goal**: Two users can play a complete Pong game over the internet

**Independent Test**: Two browsers → Quick Match → Matched → Play to 11 points → Stats recorded

### Game Physics & Constants

- [ ] T045 [P] [US1] Create shared/game/constants.ts with CANVAS_WIDTH=800, CANVAS_HEIGHT=600, PADDLE_SPEED=400, BALL_INITIAL_SPEED=300, TICK_RATE=30, WINNING_SCORE=11 per contracts/websocket.md
- [ ] T046 [P] [US1] Create shared/game/physics.ts with updateBall(), updatePaddle(), checkCollision() functions

### Server-Side Game Logic

- [ ] T047 [US1] Create lib/ws.ts with WebSocket connection manager, room join/leave/broadcast per research.md
- [ ] T048 [US1] Create lib/matchmaking.ts with FIFO queue (max 100), pair matching, game creation
- [ ] T049 [US1] Create lib/game-loop.ts with 30 tick/sec server loop, physics update, state broadcast per research.md
- [ ] T050 [US1] Create lib/game.ts with createGame(), updateGameState(), endGame(), handleDisconnect() (10s timeout, forfeit)
- [ ] T051 [US1] Create routes/api/ws.ts with Deno.upgradeWebSocket(), message routing per contracts/websocket.md

### Game Persistence

- [ ] T052 [US1] Add game CRUD functions to lib/db.ts: createGame(), updateGame(), getGame(), getGamesByUser()
- [ ] T053 [US1] Create lib/elo.ts with calculateElo() using K=32 formula per spec.md
- [ ] T054 [US1] Add game completion handler to lib/game.ts: persist to DB, update user wins/losses/elo

### Matchmaking API

- [ ] T055 [US1] Create routes/api/matchmaking/join.ts: add to queue, return position per contracts/api.yaml
- [ ] T056 [US1] Create routes/api/matchmaking/leave.ts: remove from queue
- [ ] T057 [US1] Add matchmaking_found WebSocket message when paired per contracts/websocket.md

### Client-Side Game UI

- [ ] T058 [P] [US1] Create islands/PongCanvas.tsx with Canvas 2D rendering, ball/paddle drawing
- [ ] T059 [US1] Add client-side interpolation to PongCanvas.tsx with 100ms buffer, lerp per research.md
- [ ] T060 [US1] Add paddle input handling to PongCanvas.tsx: W/S keys, client prediction, server reconciliation
- [ ] T061 [P] [US1] Create islands/MatchmakingQueue.tsx with queue position, wait time, cancel button
- [ ] T062 [P] [US1] Create components/game/ScoreDisplay.tsx showing player1 vs player2 scores
- [ ] T063 [P] [US1] Create components/game/GameStatus.tsx showing countdown, paused, ended states

### Game Pages

- [ ] T064 [US1] Create routes/game/index.tsx (lobby) with "Quick Match" button triggering matchmaking
- [ ] T065 [US1] Create routes/game/[id].tsx integrating PongCanvas, ScoreDisplay, GameStatus
- [ ] T066 [US1] Create routes/api/games/[id].ts with GET game details per contracts/api.yaml

### WebSocket Reconnection

- [ ] T067 [US1] Add reconnection with exponential backoff to PongCanvas.tsx per research.md
- [ ] T068 [US1] Add game_paused/game_resumed message handling per contracts/websocket.md

**Checkpoint**: Two users can complete a full multiplayer Pong game

---

## Phase 5: User Story 3 - Profile & Friends (Priority: P2)

**Goal**: Users can customize profile, add friends, see online status and match history

**Independent Test**: Edit name → Upload avatar → Send friend request → Accept → See online indicator

### Profile Management

- [ ] T069 [US3] Create routes/api/users/[id].ts with GET (public profile), PATCH (own profile) per contracts/api.yaml
- [ ] T070 [US3] Create routes/api/users/[id]/avatar.ts handling multipart upload (≤2MB, PNG/JPG/GIF)
- [ ] T071 [US3] Store avatars in static/avatars/ with UUID filenames, return avatar_url
- [ ] T072 [P] [US3] Create routes/profile/edit.tsx with display_name form, avatar upload
- [ ] T073 [P] [US3] Create routes/profile/[id].tsx showing user profile (public view)
- [ ] T074 [US3] Create islands/AvatarUpload.tsx with drag-drop, preview, size validation

### Friends System

- [ ] T075 [US3] Add friendship CRUD to lib/db.ts: createFriendRequest(), acceptFriend(), declineFriend(), removeFriend(), getFriends()
- [ ] T076 [US3] Create routes/api/friends/index.ts with GET (friend list with online status) per contracts/api.yaml
- [ ] T077 [US3] Create routes/api/friends/requests.ts with GET (pending), POST (send request) per contracts/api.yaml
- [ ] T078 [US3] Create routes/api/friends/requests/[id].ts with PATCH (accept/decline)
- [ ] T079 [US3] Create routes/api/friends/[id].ts with DELETE (remove friend)

### Online Presence

- [ ] T080 [US3] Create lib/presence.ts with setOnline(), setOffline(), isOnline(), getOnlineFriends()
- [ ] T081 [US3] Update lib/ws.ts to track presence via ping/pong heartbeats (30s interval)
- [ ] T082 [US3] Create islands/OnlineStatus.tsx with green/gray dot indicator
- [ ] T083 [US3] Add friend_online/friend_offline WebSocket messages to lib/ws.ts per contracts/websocket.md
- [ ] T084 [US3] Add friend_request WebSocket notification per contracts/websocket.md

### Match History & Stats

- [ ] T085 [US3] Create routes/api/users/[id]/games.ts with pagination (limit, offset) per contracts/api.yaml
- [ ] T086 [US3] Create components/MatchHistory.tsx displaying game list with date, opponent, result
- [ ] T087 [US3] Add match history section to routes/profile/[id].tsx

**Checkpoint**: Full user management with profiles, friends, and stats

---

## Phase 6: User Story 4 - AI Opponent (Priority: P2)

**Goal**: Users can practice against AI with explainable decision-making

**Independent Test**: Play vs AI → Select Hard → See AI predict ball → Click "Explain AI" → See reasoning

### AI Logic

- [ ] T088 [P] [US4] Create shared/game/ai.ts with predictBallPosition(), calculateTargetY(), shouldMiss(difficulty)
- [ ] T089 [US4] Implement difficulty-based miss rates: Easy 40%, Medium 20%, Hard ≤5% per spec.md
- [ ] T090 [US4] Add AI explanation generation: predicted_ball_y, target_paddle_y, confidence, reason per contracts/websocket.md

### AI Game Integration

- [ ] T091 [US4] Add AI paddle control to lib/game-loop.ts for game_type='ai' games
- [ ] T092 [US4] Create routes/api/games/ai.ts POST to start AI game with difficulty selection per contracts/api.yaml
- [ ] T093 [US4] Add ai_explain WebSocket message handler returning AIExplanation per contracts/websocket.md

### AI Game UI

- [ ] T094 [P] [US4] Create routes/game/ai.tsx with difficulty selector (Easy/Medium/Hard)
- [ ] T095 [US4] Create islands/AIExplainer.tsx showing predicted ball path, target position, confidence bar
- [ ] T096 [US4] Add "Explain AI" button to game UI triggering ai_explain request

**Checkpoint**: AI opponent works with all difficulties and explainability

---

## Phase 7: User Story 5 - Tournament System (Priority: P3)

**Goal**: Users can create/join tournaments with bracket progression

**Independent Test**: Create 4-player tournament → All join → Start → Play matches → Winner displayed

### Tournament Backend

- [ ] T097 [US5] Add tournament CRUD to lib/db.ts: createTournament(), joinTournament(), startTournament(), getTournament()
- [ ] T098 [US5] Add tournament match CRUD to lib/db.ts: createMatches(), updateMatchWinner(), getNextMatch()
- [ ] T099 [US5] Create lib/tournament.ts with generateBracket() for 4/8 players only (no byes) per research.md
- [ ] T100 [US5] Add best-of-3 logic: track games_won per player, first to 2 wins advances per spec.md
- [ ] T101 [US5] Add winner advancement: update bracket, populate next round match, check tournament completion

### Tournament API

- [ ] T102 [US5] Create routes/api/tournaments/index.ts with GET (list), POST (create) per contracts/api.yaml
- [ ] T103 [US5] Create routes/api/tournaments/[id].ts with GET (details + bracket)
- [ ] T104 [US5] Create routes/api/tournaments/[id]/join.ts POST to join open tournament
- [ ] T105 [US5] Create routes/api/tournaments/[id]/leave.ts POST to leave before start
- [ ] T106 [US5] Create routes/api/tournaments/[id]/start.ts POST (creator only, requires 4 or 8 players)

### Tournament UI

- [ ] T107 [P] [US5] Create routes/tournament/index.tsx listing open/in_progress/completed tournaments
- [ ] T108 [P] [US5] Create routes/tournament/create.tsx with name, max_players (4/8/16) form
- [ ] T109 [US5] Create routes/tournament/[id].tsx showing participants, bracket, match status
- [ ] T110 [US5] Create islands/TournamentBracket.tsx visualizing rounds, matches, winners

### Tournament WebSocket

- [ ] T111 [US5] Add tournament_match_ready message to lib/ws.ts per contracts/websocket.md
- [ ] T112 [US5] Notify participants when their match is ready to play
- [ ] T113 [US5] Implement 5-minute join timeout (forfeit) per spec.md

**Checkpoint**: Complete tournament system with brackets

---

## Phase 8: User Story 6 - Game Chat (Priority: P3)

**Goal**: Players can chat during matches

**Independent Test**: Send message → Opponent sees it → Send `<script>` → Renders as text (XSS safe)

### Chat Implementation

- [ ] T114 [US6] Add chat_message handler to lib/ws.ts: validate with Zod, check game membership
- [ ] T115 [US6] Add XSS escaping in chat handler: escape <, >, &, ", ' characters
- [ ] T116 [US6] Add rate limiting: 5 messages per 10 seconds, return chat_rate_limited on exceed per contracts/websocket.md
- [ ] T117 [US6] Create islands/ChatBox.tsx with message list (scrollable), input field, send button
- [ ] T118 [US6] Integrate ChatBox into routes/game/[id].tsx as collapsible panel

**Checkpoint**: Chat works with rate limiting and XSS protection

---

## Phase 9: User Story 7 - System Metrics (Priority: P4)

**Goal**: Prometheus/Grafana monitoring with analytics dashboards

**Independent Test**: Play games → Check /metrics → Grafana shows stats

### Application Metrics

- [ ] T119 [US7] Add game metrics to lib/metrics.ts: games_active_total, games_completed_total, game_duration_seconds
- [ ] T120 [US7] Add connection metrics: websocket_connections_total, matchmaking_queue_size
- [ ] T121 [US7] Add HTTP metrics: http_request_duration_seconds with method/path/status labels

### Infrastructure Config

- [ ] T122 [P] [US7] Create infra/prometheus/prometheus.yml with scrape config for Fresh app (/metrics)
- [ ] T123 [P] [US7] Create infra/grafana/provisioning/datasources/prometheus.yml
- [ ] T124 [US7] Create infra/grafana/provisioning/dashboards/dashboards.yml (auto-provisioning)

### Dashboards

- [ ] T125 [US7] Create infra/grafana/dashboards/system-health.json with CPU, memory, connections panels
- [ ] T126 [US7] Create infra/grafana/dashboards/game-analytics.json with games/day, avg duration, active users

**Checkpoint**: Full observability with Prometheus + Grafana

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Docker deployment, security hardening, final validation

### Docker Deployment

- [ ] T127 Create Dockerfile with multi-stage build per research.md
- [ ] T128 Create docker-compose.yml with fresh, traefik, prometheus, grafana services per plan.md
- [ ] T129 Create infra/traefik/traefik.yml with HTTPS config, Let's Encrypt, routing rules
- [ ] T130 Verify `docker compose up --build` starts all services and app is accessible

### Security Hardening

- [ ] T131 [P] Audit all routes: CSRF token validation on all POST/PATCH/DELETE endpoints
- [ ] T132 [P] Audit lib/db.ts: all queries use db.prepare(), no string interpolation
- [ ] T133 [P] Audit password handling: bcrypt cost factor ≥12, no plain-text storage
- [ ] T134 Add API rate limiting middleware in routes/_middleware.ts (100 req/min general)
- [ ] T135 [P] Verify session cookies: HttpOnly, Secure, SameSite=Strict

### Code Quality

- [ ] T136 [P] Run `deno check` and fix all type errors
- [ ] T137 [P] Run `deno lint` and fix all lint issues
- [ ] T138 [P] Run `deno fmt` and format entire codebase

### Final Validation

- [ ] T139 Run quickstart.md validation: clone → setup → docker compose up → play game
- [ ] T140 Test all 7 user stories work independently (manual verification)
- [ ] T141 Verify 42 evaluation criteria: all modules demonstrable, security checks pass
- [ ] T142 Test multi-machine multiplayer (different networks/IPs)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ────────► Phase 2 (Foundational) ────────► User Stories
                                    │
                                    ▼
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
                Phase 3         Phase 4         Phase 9
                (US2 Auth)      (US1 Game)      (US7 Metrics)
                    │               │
                    │               ├──────────────┬──────────────┐
                    ▼               ▼              ▼              ▼
                Phase 5         Phase 6        Phase 7        Phase 8
                (US3 Profile)   (US4 AI)       (US5 Tourn)    (US6 Chat)
                                    │              │              │
                    └───────────────┴──────────────┴──────────────┘
                                    │
                                    ▼
                            Phase 10 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US2 (Auth) | Foundation only | US7 (Metrics) |
| US1 (Game) | US2 (need login for matchmaking) | - |
| US3 (Profile) | US2 | US4, US5, US6, US7 |
| US4 (AI) | US1 (game engine) | US3, US5, US6, US7 |
| US5 (Tournament) | US1 (game engine) | US3, US4, US6, US7 |
| US6 (Chat) | US1 (WebSocket) | US3, US4, US5, US7 |
| US7 (Metrics) | Foundation only | US2, US3, US4, US5, US6 |

### Within Each Phase

- Tasks marked [P] can run in parallel
- Types/schemas before services
- Services before API routes
- API routes before pages
- Pages before islands

---

## Parallel Execution Examples

### Phase 2 - Foundation (Parallel Streams)

```bash
# Stream 1: Database
T007: lib/db.ts
T008: lib/migrations/001_initial_schema.sql
T009: lib/migrations/runner.ts

# Stream 2: All types (parallel)
T010, T011, T012, T013: shared/types/*.ts

# Stream 3: All schemas (parallel)
T014, T015, T016, T017: shared/schemas/*.ts

# Stream 4: All UI components (parallel)
T022-T028: components/**/*.tsx
```

### Phase 4 - US1 Game (After T047-T051)

```bash
# Parallel UI development
T058: islands/PongCanvas.tsx
T061: islands/MatchmakingQueue.tsx
T062: components/game/ScoreDisplay.tsx
T063: components/game/GameStatus.tsx
```

---

## Implementation Strategy

### MVP First (US2 + US1 Only)

1. Complete Phase 1: Setup (~6 tasks)
2. Complete Phase 2: Foundational (~24 tasks)
3. Complete Phase 3: US2 Auth (~14 tasks)
4. Complete Phase 4: US1 Game (~24 tasks)
5. **STOP and VALIDATE**: Two users can login and play a complete Pong game
6. Deploy/demo MVP

**MVP Task Count**: ~68 tasks

### Incremental Delivery

| Increment | Stories | 42 Points | Cumulative |
|-----------|---------|-----------|------------|
| MVP | US2 + US1 | 8 pts (Web game, Remote, WebSocket, User mgmt) | 8 pts |
| +Profile/Friends | US3 | 2 pts (User mgmt enhanced) | 10 pts |
| +AI | US4 | 2 pts (AI opponent) | 12 pts |
| +Tournament | US5 | 1 pt (Tournament system) | 13 pts |
| +Chat | US6 | 0 pts (nice-to-have) | 13 pts |
| +Metrics | US7 | 4 pts (Prometheus + Analytics) | 17 pts |
| Framework + SSR | Automatic | 3 pts (Fresh provides this) | **20 pts** |

**Note**: 42 project requires 14 points minimum; we target 19+ points

### Parallel Team Strategy (2 developers)

After Phase 2:
- **Developer A**: US2 (Auth) → US1 (Game) → US4 (AI) → US5 (Tournament)
- **Developer B**: US7 (Metrics) → US3 (Profile) → US6 (Chat) → Polish

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | **142** |
| Phase 1: Setup | 6 |
| Phase 2: Foundational | 24 |
| Phase 3: US2 (Auth) | 14 |
| Phase 4: US1 (Game) | 24 |
| Phase 5: US3 (Profile) | 19 |
| Phase 6: US4 (AI) | 9 |
| Phase 7: US5 (Tournament) | 17 |
| Phase 8: US6 (Chat) | 5 |
| Phase 9: US7 (Metrics) | 8 |
| Phase 10: Polish | 16 |
| **Parallelizable [P]** | **41** |

---

## Notes

- [P] tasks can run in parallel (different files, no blocking dependencies)
- [USx] labels map to spec.md user stories for traceability
- All SQL MUST use db.prepare() per constitution (no string interpolation)
- All inputs MUST validate with Zod schemas (client + server)
- Stop at any checkpoint to validate story independently
- MVP = US2 + US1 = Authentication + Quick Match (~68 tasks)
- Each user story is independently testable after dependencies are met
