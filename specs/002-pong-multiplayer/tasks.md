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
- [ ] T002 [P] Configure deno.json: strict TypeScript, tasks (dev, build, lint, test, setup), lint/fmt rules; setup task runs `git config core.hooksPath .hooks`
- [ ] T003 [P] Configure tailwind.config.ts with DaisyUI plugin per research.md
- [ ] T005 [P] Create .env.example with FT_CLIENT_ID, FT_CLIENT_SECRET, FT_REDIRECT_URI, SESSION_SECRET
- [ ] T006 Create directory structure per plan.md: routes/, islands/, components/, shared/, lib/, static/, infra/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Types

- [ ] T007 Create lib/db.ts with SQLite WAL mode initialization per research.md (jsr:@db/sqlite@0.13)
- [ ] T008 Create lib/migrations/001_initial_schema.sql with all tables from data-model.md
- [ ] T009 [P] Create shared/types/user.ts with User, Session, Friendship types
- [ ] T010 [P] Create shared/types/game.ts with Game, GameState, GameType types
- [ ] T011 [P] Create shared/types/tournament.ts with Tournament, TournamentMatch types
- [ ] T012 [P] Create shared/types/ws.ts with all WebSocket message types per contracts/websocket-protocol.md
- [ ] T013 [P] Create shared/schemas/user.ts with Zod schemas for user input validation
- [ ] T014 [P] Create shared/schemas/game.ts with Zod schemas for game/WebSocket messages
- [ ] T015 [P] Create shared/schemas/tournament.ts with Zod schemas for tournament input

### Core Infrastructure

- [ ] T016 Create lib/logger.ts with JSON structured logging and correlation IDs
- [ ] T017 Create lib/metrics.ts with Prometheus metrics per research.md (ts_prometheus)
- [ ] T018 Create routes/_middleware.ts with CSRF token generation/validation framework
- [ ] T019 Create routes/_app.tsx with Tailwind styles and DaisyUI theme
- [ ] T020 [P] Create components/layout/Header.tsx with navigation structure
- [ ] T021 [P] Create components/layout/Footer.tsx
- [ ] T022 [P] Create components/layout/Nav.tsx with auth-aware navigation
- [ ] T023 [P] Create components/ui/Button.tsx as DaisyUI wrapper
- [ ] T024 [P] Create components/ui/Card.tsx as DaisyUI wrapper
- [ ] T025 [P] Create components/ui/Modal.tsx as DaisyUI wrapper
- [ ] T026 [P] Create components/ui/Badge.tsx as DaisyUI wrapper

### System Endpoints

- [ ] T027 Create routes/api/health.ts returning { status: "healthy", database: "connected" }
- [ ] T028 Create routes/api/metrics.ts exposing Prometheus metrics per contracts/openapi.yaml

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 2 - Authentication (Priority: P1) 🎯 MVP-BLOCKING

**Goal**: Users can authenticate via email/password OR 42 OAuth and receive a session

**Independent Test**: (a) Register with email/password, login, verify profile; (b) Click "Login with 42", complete OAuth, verify profile

**Why before US1**: Authentication is required for matchmaking and game creation

### Core Auth Infrastructure

- [ ] T029 [P] [US2] Create shared/schemas/auth.ts with Zod schemas: emailSchema (regex), passwordSchema (≥8 chars), loginSchema, registerSchema
- [ ] T030 [US2] Create lib/password.ts with hashPassword(), verifyPassword() using bcrypt (cost factor 12)
- [ ] T031 [US2] Create lib/session.ts with createSession(), getSession(), deleteSession() using db.prepare()
- [ ] T032 [US2] Create lib/auth.ts with getAuthorizationUrl(), exchangeCodeForToken(), fetchUserProfile() per research.md

### Email/Password Auth

- [ ] T033 [P] [US2] Create routes/register.tsx with email, password, display name form + validation
- [ ] T034 [P] [US2] Create routes/login.tsx with email/password form + "Login with 42" OAuth button
- [ ] T035 [US2] Create routes/api/auth/register.ts: validate input, check email uniqueness, hash password, create user, create session
- [ ] T036 [US2] Create routes/api/auth/login.ts: validate input, verify password, rate-limit (5 attempts/15 min), create session

### 42 OAuth Auth

- [ ] T037 [US2] Create routes/api/auth/callback.ts: OAuth code exchange, account merge if email exists, user creation, session creation

### Common Auth

- [ ] T038 [US2] Create routes/api/auth/logout.ts invalidating session and clearing cookie
- [ ] T039 [US2] Update routes/_middleware.ts to extract session and populate ctx.state.user
- [ ] T040 [US2] Create routes/api/users/me.ts returning current user profile per contracts/openapi.yaml
- [ ] T041 [US2] Create routes/index.tsx (home page) with auth-aware content

**Checkpoint**: Users can register/login via email/password OR 42 OAuth and see their profile data

---

## Phase 4: User Story 1 - Quick Match Online (Priority: P1) 🎯 MVP

**Goal**: Two users can play a complete Pong game over the internet

**Independent Test**: Two browsers → Quick Match → Matched → Play to 11 points → Stats recorded

### Game Physics & Constants

- [ ] T042 [P] [US1] Create shared/game/constants.ts with CANVAS_WIDTH, PADDLE_HEIGHT, BALL_SPEED, etc.
- [ ] T043 [P] [US1] Create shared/game/physics.ts with ball movement, collision detection (shared for client prediction)

### Server-Side Game Logic

- [ ] T044 [US1] Create lib/ws.ts with WebSocket connection manager, room management per research.md
- [ ] T045 [US1] Create lib/matchmaking.ts with FIFO queue, pair matching, game creation
- [ ] T046 [US1] Create lib/game-server.ts with game loop (30 tick/sec), state broadcast, score tracking
- [ ] T047 [US1] Create routes/api/ws.ts with Deno.upgradeWebSocket(), message routing per contracts/websocket-protocol.md

### Game Persistence

- [ ] T048 [US1] Create routes/api/games/index.ts with GET (history) per contracts/openapi.yaml
- [ ] T049 [US1] Create routes/api/games/[id].ts with GET (game details) per contracts/openapi.yaml
- [ ] T050 [US1] Add game completion handler: persist to DB, update user wins/losses/elo

### Client-Side Game UI

- [ ] T051 [P] [US1] Create islands/PongCanvas.tsx with Canvas 2D rendering, ball/paddle drawing
- [ ] T052 [P] [US1] Create islands/PongControls.tsx with W/S key input handling at 60fps
- [ ] T053 [US1] Create islands/MatchmakingQueue.tsx with queue position, wait time display
- [ ] T054 [P] [US1] Create components/game/ScoreDisplay.tsx showing both player scores
- [ ] T055 [P] [US1] Create components/game/GameOverModal.tsx with winner, final score, rematch option
- [ ] T056 [US1] Create routes/game/index.tsx (lobby) with "Quick Match" button triggering matchmaking
- [ ] T057 [US1] Create routes/game/[id].tsx (game room) integrating PongCanvas, controls, score

### WebSocket Client Integration

- [ ] T058 [US1] Add ReconnectingWebSocket class to islands/PongCanvas.tsx per research.md
- [ ] T059 [US1] Implement game_state message handling with client-side interpolation
- [ ] T060 [US1] Implement reconnection grace period (30 seconds) handling

**Checkpoint**: Two users can complete a full multiplayer Pong game

---

## Phase 5: User Story 3 - Profile & Friends (Priority: P2)

**Goal**: Users can customize profile, add friends, see online status and match history

**Independent Test**: Edit name → Upload avatar → Send friend request → Accept → See online indicator

### Profile Management

- [ ] T061 [P] [US3] Create routes/api/users/[id].ts with GET per contracts/openapi.yaml
- [ ] T062 [US3] Add PATCH to routes/api/users/me.ts for display_name update
- [ ] T063 [US3] Create routes/api/users/me/avatar.ts handling multipart upload (≤2MB, PNG/JPG/GIF)
- [ ] T064 [US3] Create routes/profile/index.tsx showing current user profile, edit form
- [ ] T065 [US3] Create routes/profile/[id].tsx showing other user's profile (public view)
- [ ] T066 [US3] Create islands/AvatarUpload.tsx with drag-drop, preview, upload progress

### Friends System

- [ ] T067 [P] [US3] Create routes/api/users/me/friends.ts with GET (list), POST (send request) per contracts/openapi.yaml
- [ ] T068 [US3] Create routes/api/users/me/friends/[id].ts with PATCH (accept/decline), DELETE (unfriend)
- [ ] T069 [US3] Create islands/OnlineStatus.tsx with presence indicator (green/gray dot)
- [ ] T070 [US3] Add presence tracking to lib/ws.ts using heartbeat messages
- [ ] T071 [US3] Add friends list section to routes/profile/index.tsx with OnlineStatus indicators

### Match History & Stats

- [ ] T072 [US3] Create routes/api/users/[id]/stats.ts returning wins, losses, elo, win_rate
- [ ] T073 [US3] Create routes/api/users/[id]/games.ts returning paginated match history
- [ ] T074 [US3] Add match history section to profile pages showing GameSummary cards

**Checkpoint**: Full user management with profiles, friends, and stats

---

## Phase 6: User Story 4 - AI Opponent (Priority: P2)

**Goal**: Users can practice against AI with explainable decision-making

**Independent Test**: Play vs AI → Select Hard → See AI predict ball → Click "Explain AI" → See reasoning

### AI Logic

- [ ] T075 [P] [US4] Create shared/game/ai.ts with difficulty-based paddle positioning (Easy: 40% miss, Hard: 5% miss)
- [ ] T076 [US4] Add AI explanation generation: predicted_ball_y, target_paddle_y, confidence, reasoning

### AI Game Integration

- [ ] T077 [US4] Add game_type='ai' handling to lib/game-server.ts with server-side AI moves
- [ ] T078 [US4] Add POST to routes/api/games/index.ts for creating AI game per contracts/openapi.yaml
- [ ] T079 [US4] Create routes/game/ai.tsx with difficulty selection (Easy/Medium/Hard)
- [ ] T080 [US4] Create islands/AIExplainer.tsx showing real-time AI decision visualization
- [ ] T081 [US4] Add ai_explain WebSocket message handling per contracts/websocket-protocol.md

**Checkpoint**: AI opponent works with all difficulties and explainability

---

## Phase 7: User Story 5 - Tournament System (Priority: P3)

**Goal**: Users can create/join tournaments with bracket progression

**Independent Test**: Create 4-player tournament → All join → Start → Play matches → Winner displayed

### Tournament Backend

- [ ] T077 [P] [US5] Create routes/api/tournaments/index.ts with GET (list), POST (create) per contracts/openapi.yaml
- [ ] T078 [US5] Create routes/api/tournaments/[id].ts with GET (details), bracket data
- [ ] T079 [US5] Create routes/api/tournaments/[id]/join.ts for joining open tournaments
- [ ] T080 [US5] Create routes/api/tournaments/[id]/start.ts for creator to start tournament
- [ ] T081 [US5] Add bracket generation logic: seed participants, create TournamentMatch records with best-of-3 series tracking (games_won_p1, games_won_p2)
- [ ] T082 [US5] Add winner advancement logic: track best-of-3 series (first to 2 wins), update bracket, schedule next match

### Tournament UI

- [ ] T083 [US5] Create routes/tournament/index.tsx listing open/active tournaments
- [ ] T084 [US5] Create routes/tournament/create.tsx with form (name, max_players)
- [ ] T085 [US5] Create routes/tournament/[id].tsx showing bracket and match status
- [ ] T086 [US5] Create islands/TournamentBracket.tsx visualizing bracket with clickable matches

**Checkpoint**: Complete tournament system with brackets

---

## Phase 8: User Story 6 - Game Chat (Priority: P3)

**Goal**: Players can chat during matches

**Independent Test**: Send message → Opponent sees it → Send `<script>` → Renders as text (XSS safe)

### Chat Implementation

- [ ] T087 [US6] Add chat_message/chat_received handlers to lib/ws.ts
- [ ] T088 [US6] Add rate limiting (5 messages/10 seconds) to chat handler
- [ ] T089 [US6] Create islands/ChatBox.tsx with message list, input, XSS-safe rendering
- [ ] T090 [US6] Integrate ChatBox into routes/game/[id].tsx

**Checkpoint**: Chat works with rate limiting and XSS protection

---

## Phase 9: User Story 7 - System Metrics (Priority: P4)

**Goal**: Prometheus/Grafana monitoring with analytics dashboards

**Independent Test**: Play games → Check /metrics → Grafana shows stats

### Metrics & Dashboards

- [ ] T091 [US7] Add game metrics to lib/metrics.ts: active_games, games_completed, game_duration
- [ ] T092 [US7] Add WebSocket metrics: websocket_connections, matchmaking_queue_size
- [ ] T093 [US7] Create infra/prometheus/prometheus.yml with scrape config for Fresh app
- [ ] T094 [US7] Create infra/grafana/provisioning/datasources/prometheus.yml
- [ ] T095 [US7] Create infra/grafana/dashboards/system-health.json with connection/game graphs
- [ ] T096 [US7] Create infra/grafana/dashboards/game-analytics.json with play statistics

**Checkpoint**: Full observability with Prometheus + Grafana

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Docker deployment, security hardening, cleanup

### Docker Deployment

- [ ] T097 Create Dockerfile with multi-stage build per research.md
- [ ] T098 Create docker-compose.yml with fresh, traefik, prometheus, grafana services
- [ ] T099 Create infra/traefik/traefik.yml with HTTPS config for pong.taiida.com
- [ ] T100 Verify `docker compose up` starts all services correctly

### Security Hardening

- [ ] T101 Audit all routes for CSRF token validation on POST/PUT/DELETE
- [ ] T102 Audit all SQL queries use db.prepare() (no raw string interpolation)
- [ ] T103 Verify all Zod schemas are applied on both client and server
- [ ] T104 Add rate limiting to API endpoints (beyond just chat)

### Final Validation

- [ ] T105 Run quickstart.md validation: fresh install → docker compose up → play game
- [ ] T106 Verify all 7 user stories work independently
- [ ] T107 Type check entire codebase: `deno task check` passes
- [ ] T108 Lint entire codebase: `deno task lint` passes

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
                Phase 3         Phase 4         Phase 5-9
                (US2 Auth)      (US1 Game)      (US3-US7)
                    │               │               │
                    │               │               │
                    └───────────────┴───────────────┘
                                    │
                                    ▼
                            Phase 10 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US2 (Auth) | Foundation only | - |
| US1 (Game) | US2 (need login) | - |
| US3 (Profile) | US2 | US4, US5, US6, US7 |
| US4 (AI) | US1 (game engine) | US3, US5, US6, US7 |
| US5 (Tournament) | US1 | US3, US4, US6, US7 |
| US6 (Chat) | US1 (WebSocket) | US3, US4, US5, US7 |
| US7 (Metrics) | Foundation | US3, US4, US5, US6 |

### Within Each Phase

- Tasks marked [P] can run in parallel
- Models/types before services
- Services before routes
- Backend before frontend islands

---

## Parallel Execution Examples

### Phase 2 - Foundation (8 parallel streams)

```
Stream 1: T007 (db.ts)
Stream 2: T008 (migrations)
Stream 3: T009-T015 (types/schemas - all [P])
Stream 4: T016 (logger)
Stream 5: T017 (metrics)
Stream 6: T018-T019 (middleware, _app)
Stream 7: T020-T022 (layout components - all [P])
Stream 8: T023-T026 (UI components - all [P])
```

### Phase 4 - US1 Game (3 parallel streams after T039-T042)

```
Stream 1: T046 (PongCanvas) + T047 (Controls) + T048 (Queue)
Stream 2: T049 (ScoreDisplay) + T050 (GameOverModal)
Stream 3: T043-T045 (API routes)
```

---

## Implementation Strategy

### MVP First (US2 + US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US2 (Auth) - Can now login
4. Complete Phase 4: US1 (Game) - Can now play Pong
5. **STOP and VALIDATE**: Two users play a complete game
6. Deploy/demo MVP

### Incremental Delivery

| Increment | Stories | 42 Points | Cumulative |
|-----------|---------|-----------|------------|
| MVP | US1 + US2 | 8 pts | 8 pts |
| +Friends | US3 | 2 pts | 10 pts |
| +AI | US4 | 2 pts | 12 pts |
| +Tournament | US5 | 1 pt | 13 pts |
| +Chat | US6 | 0 pts | 13 pts |
| +Metrics | US7 | 4 pts | 17 pts |
| **Total** | | | **17+ pts** |

**Note**: Framework + SSR points (3 pts) are automatic with Fresh, totaling 19+ pts

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 107 |
| Setup Tasks | 5 |
| Foundational Tasks | 22 |
| US1 (Game) Tasks | 19 |
| US2 (Auth) Tasks | 8 |
| US3 (Profile) Tasks | 14 |
| US4 (AI) Tasks | 7 |
| US5 (Tournament) Tasks | 10 |
| US6 (Chat) Tasks | 4 |
| US7 (Metrics) Tasks | 6 |
| Polish Tasks | 12 |
| Parallelizable [P] | 35 |

---

## Notes

- [P] tasks can run in parallel (different files, no blocking dependencies)
- [USx] labels map to spec.md user stories for traceability
- All SQL MUST use db.prepare() per constitution
- All inputs MUST validate with Zod schemas
- Stop at any checkpoint to validate story independently
- MVP = US2 + US1 = Login + Play Game
