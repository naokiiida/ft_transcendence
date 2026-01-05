# Feature Specification: ft_transcendence - Multiplayer Pong Platform

**Feature Branch**: `002-pong-multiplayer`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "create spec for everything in constitution"

---

## Executive Summary

ft_transcendence is a full-stack web application for playing Pong online with real-time multiplayer capabilities. Built with Deno + Fresh (SSR + Islands architecture), it includes user management, tournaments, AI opponents, and comprehensive observability through Prometheus/Grafana.

**42 Project Modules**: 19 points selected (14 required minimum)

| Module | Points | Status |
|--------|--------|--------|
| Web-based game (Pong) | 2 | Core |
| Remote players | 2 | Core |
| Frontend + Backend framework | 2 | Core |
| Real-time WebSockets | 2 | Core |
| Standard user management | 2 | Core |
| Prometheus + Grafana | 2 | DevOps |
| Analytics Dashboard | 2 | Data |
| AI Opponent | 2 | AI |
| SSR | 1 | Free (Fresh) |
| OAuth 2.0 | 1 | Auth |
| Tournament system | 1 | Gaming |
| **Total** | **19** | 5pt buffer |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play a Quick Match Online (Priority: P1)

A user wants to play Pong against another real player over the internet without any complex setup.

**Why this priority**: This is the core value proposition - if users can't play Pong remotely, the entire project fails. This satisfies the "Web-based game (Pong)" and "Remote players" modules (4pts combined).

**Independent Test**: Can be fully tested by two users opening the app in different browsers, clicking "Quick Match", and playing a complete game. Delivers immediate entertainment value.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the home page, **When** they click "Quick Match", **Then** they are placed in a matchmaking queue with visual feedback showing wait time.

2. **Given** two users in the matchmaking queue, **When** the server pairs them, **Then** both users are redirected to the same game room and see the Pong canvas with their paddle positions.

3. **Given** an active game, **When** Player A moves their paddle using W/S keys, **Then** Player B sees Player A's paddle move within 100ms (accounting for network latency).

4. **Given** an active game, **When** the ball passes Player B's paddle, **Then** Player A's score increments by 1 and both players see the updated score.

5. **Given** a game in progress, **When** a player reaches 11 points, **Then** the game ends, winner is declared, and stats are recorded to the database.

---

### User Story 2 - Create Account and Login via 42 OAuth (Priority: P1)

A 42 student wants to quickly create an account using their 42 credentials without remembering another password.

**Why this priority**: Authentication is required for all other features. The 42 OAuth module (1pt) is essential for the 42 school context, and user management (2pts) depends on having user accounts.

**Independent Test**: Can be tested by clicking "Login with 42", completing OAuth flow, and verifying a user profile page appears with 42 intra data.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user on the login page, **When** they click "Login with 42", **Then** they are redirected to 42's OAuth authorization page.

2. **Given** a user who authorizes the app on 42's OAuth page, **When** they are redirected back, **Then** a new user record is created (if first login) with their 42 intra username, email, and profile picture.

3. **Given** an existing user who logs in via OAuth, **When** they complete the flow, **Then** they are redirected to their profile page with a valid session cookie (HTTP-only, secure).

4. **Given** a logged-in user, **When** they click "Logout", **Then** their session is invalidated and they are redirected to the home page.

---

### User Story 3 - Manage Profile and Friends (Priority: P2)

A user wants to customize their profile, add friends, and see who is online.

**Why this priority**: Per 42 spec, the "Standard user management" module (2pts) requires profile updates, avatars, friends, online status, and match history. This builds on P1 authentication.

**Independent Test**: Can be tested by editing profile name, uploading an avatar, sending a friend request, and verifying the friend appears in the friends list with online status indicator.

**Acceptance Scenarios**:

1. **Given** a logged-in user on their profile page, **When** they update their display name and click "Save", **Then** the new name is persisted and displayed across the application.

2. **Given** a logged-in user on their profile page, **When** they upload an avatar image (≤2MB, PNG/JPG), **Then** the image is stored and displayed as their profile picture.

3. **Given** a logged-in user viewing another user's profile, **When** they click "Add Friend", **Then** a friend request is sent and the target user sees a notification.

4. **Given** a user with a pending friend request, **When** they accept the request, **Then** both users appear in each other's friends list.

5. **Given** a user viewing their friends list, **When** a friend is online, **Then** a green indicator appears next to their name; when offline, a gray indicator.

6. **Given** a user viewing their profile, **When** they scroll to "Match History", **Then** they see a list of their past games with date, opponent, and result (win/loss/score).

---

### User Story 4 - Play Against AI Opponent (Priority: P2)

A user wants to practice Pong against an AI when no human players are available.

**Why this priority**: The AI Opponent module (2pts) provides single-player value and allows users to practice. It depends on the core game being implemented (P1).

**Independent Test**: Can be tested by clicking "Play vs AI", selecting difficulty, and playing a complete game against the computer.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the game menu, **When** they click "Play vs AI", **Then** they see difficulty options (Easy, Medium, Hard).

2. **Given** a user who selects "Easy" difficulty, **When** the game starts, **Then** the AI paddle moves with intentional delays and imperfect positioning (misses ~40% of reachable balls).

3. **Given** a user who selects "Hard" difficulty, **When** the game starts, **Then** the AI predicts ball trajectory and positions optimally (misses ≤5% of reachable balls).

4. **Given** an AI game in progress, **When** the user clicks "Explain AI" button, **Then** a panel shows the AI's current decision-making (predicted ball position, chosen paddle movement) - required by 42 for AI explainability.

---

### User Story 5 - Participate in Tournament (Priority: P3)

A user wants to compete in a structured tournament with brackets and multiple rounds.

**Why this priority**: Tournament system (1pt) adds competitive structure but depends on core gameplay (P1) and user management (P2) being complete.

**Independent Test**: Can be tested by creating a tournament with 4 players, running all matches through to finals, and verifying the bracket displays correctly.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they click "Create Tournament", **Then** they can set tournament name, max players (4, 8, or 16), and game settings.

2. **Given** a tournament in "Open" state, **When** users join until max capacity, **Then** the tournament automatically transitions to "Ready" state and brackets are generated.

3. **Given** a tournament in "Ready" state, **When** the creator clicks "Start Tournament", **Then** first-round matches are scheduled and participants are notified.

4. **Given** a scheduled tournament match, **When** both players join the game room, **Then** the match starts with tournament rules (best of 3 games).

5. **Given** a completed tournament match, **When** a winner is determined, **Then** the bracket updates to show the winner advancing, and the next match is scheduled.

---

### User Story 6 - Chat During Games (Priority: P3)

A user wants to communicate with their opponent during a match.

**Why this priority**: Chat enhances social interaction but is not strictly required for core gameplay. Shares WebSocket infrastructure with game state (P1).

**Independent Test**: Can be tested by sending a chat message during a game and verifying the opponent receives it.

**Acceptance Scenarios**:

1. **Given** two users in an active game, **When** Player A types a message and presses Enter, **Then** Player B sees the message in the chat panel within 200ms.

2. **Given** a chat message with special characters (`<script>`), **When** rendered, **Then** the message is escaped and displayed as plain text (no XSS).

3. **Given** a user who sends more than 5 messages in 10 seconds, **When** they try to send another, **Then** they see "Rate limit exceeded, wait a moment" and the message is not sent.

---

### User Story 7 - View System Metrics (Priority: P4)

A developer/admin wants to monitor system health and usage patterns.

**Why this priority**: Prometheus + Grafana (2pts) and Analytics Dashboard (2pts) are DevOps concerns that support the application but don't affect end-user gameplay.

**Independent Test**: Can be tested by accessing `/metrics` endpoint and verifying Prometheus scrapes data, then viewing pre-configured Grafana dashboards.

**Acceptance Scenarios**:

1. **Given** a running application, **When** Prometheus scrapes `/metrics`, **Then** it receives metrics for: active_games_count, connected_users_count, matches_completed_total, websocket_connections.

2. **Given** a Grafana installation, **When** a user opens the "System Health" dashboard, **Then** they see real-time graphs of CPU usage, memory, active connections, and game statistics.

3. **Given** match data in SQLite, **When** a user opens the "Analytics" dashboard, **Then** they see aggregated statistics: games played per day, average game duration, most active users.

---

### Edge Cases

- **Network Disconnection Mid-Game**: If a player disconnects, server maintains game state for 30 seconds. If they reconnect within that window, they rejoin. If timeout expires, opponent wins by forfeit.
- **Simultaneous Ball Contact**: Server-authoritative physics resolves all collisions; client rendering interpolates to mask latency.
- **OAuth Token Expiry**: Refresh tokens are used automatically; if refresh fails, user is redirected to login.
- **Full Matchmaking Queue**: Queue has max capacity of 100; additional users see "Server busy, try again shortly".
- **Invalid Avatar Upload**: Files >2MB or non-image MIME types are rejected with clear error message.
- **Tournament Abandonment**: If a player fails to join a tournament match within 5 minutes, they forfeit that match.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Core Game (FR-1xx)

- **FR-101**: System MUST render Pong game using Canvas 2D API
- **FR-102**: System MUST process paddle input at ≥60 FPS client-side
- **FR-103**: Server MUST calculate ball physics and broadcast state at ≥30 updates/second
- **FR-104**: System MUST detect collisions (ball-paddle, ball-wall) server-side
- **FR-105**: System MUST track and display score for both players in real-time
- **FR-106**: Game MUST end when a player reaches 11 points

#### Multiplayer (FR-2xx)

- **FR-201**: System MUST support remote play via WebSocket connections
- **FR-202**: Server MUST pair players in matchmaking queue (FIFO)
- **FR-203**: System MUST handle player reconnection within 30-second grace period
- **FR-204**: System MUST share single WebSocket connection for game state and chat

#### User Management (FR-3xx)

- **FR-301**: Users MUST authenticate via 42 OAuth 2.0
- **FR-302**: Users MUST be able to update their display name
- **FR-303**: Users MUST be able to upload avatar (≤2MB, PNG/JPG/GIF)
- **FR-304**: Users MUST be able to send/accept/decline friend requests
- **FR-305**: System MUST display friend online/offline status in real-time
- **FR-306**: System MUST display user's match history (date, opponent, result)
- **FR-307**: System MUST track user statistics (wins, losses, ranking)

#### AI Opponent (FR-4xx)

- **FR-401**: System MUST provide AI opponent with 3 difficulty levels
- **FR-402**: AI decision-making MUST be explainable (visible to user on request)
- **FR-403**: AI MUST run server-side (no client-side cheating possible)

#### Tournament (FR-5xx)

- **FR-501**: Users MUST be able to create tournaments (4, 8, or 16 players)
- **FR-502**: System MUST auto-generate single-elimination brackets
- **FR-503**: System MUST track tournament progress and display bracket UI
- **FR-504**: Tournament matches MUST use best-of-3 format

#### Chat (FR-6xx)

- **FR-601**: Users MUST be able to send text messages during games
- **FR-602**: System MUST rate-limit chat (max 5 messages per 10 seconds)
- **FR-603**: Chat messages MUST be escaped to prevent XSS

#### Observability (FR-7xx)

- **FR-701**: System MUST expose `/metrics` endpoint in Prometheus format
- **FR-702**: System MUST expose `/health` endpoint for Docker health checks
- **FR-703**: All logs MUST be JSON format with correlation IDs
- **FR-704**: Grafana dashboards MUST be pre-configured via provisioning

### Non-Functional Requirements

#### Security (NFR-1xx)

- **NFR-101**: ALL SQL queries MUST use `db.prepare()` with parameterized statements
- **NFR-102**: CSRF tokens MUST be validated on all state-changing requests
- **NFR-103**: Session cookies MUST be HTTP-only and Secure
- **NFR-104**: All inputs MUST be validated with Zod schemas (client + server)
- **NFR-105**: Passwords (if any) MUST use bcrypt with cost factor ≥10
- **NFR-106**: All traffic MUST use HTTPS (Traefik TLS termination)

#### Performance (NFR-2xx)

- **NFR-201**: Game state updates MUST arrive within 100ms (LAN conditions)
- **NFR-202**: Page load (SSR) MUST complete in <2 seconds
- **NFR-203**: WebSocket connection MUST support ≥100 concurrent games

#### Reliability (NFR-3xx)

- **NFR-301**: SQLite MUST use WAL mode for concurrent read/write
- **NFR-302**: System MUST handle graceful degradation on component failure
- **NFR-303**: User sessions MUST persist across server restarts

### Key Entities

- **User**: id, intra_username, email, display_name, avatar_url, created_at, last_seen
- **Friendship**: id, requester_id, addressee_id, status (pending/accepted/declined), created_at
- **Game**: id, player1_id, player2_id, winner_id, player1_score, player2_score, game_type (quick/tournament/ai), started_at, ended_at
- **Tournament**: id, name, creator_id, max_players, status (open/ready/in_progress/completed), created_at
- **TournamentParticipant**: tournament_id, user_id, seed, eliminated_at
- **TournamentMatch**: id, tournament_id, round, match_index, player1_id, player2_id, winner_id, game_id

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two remote users can complete a full Pong game with <150ms perceived latency
- **SC-002**: OAuth login flow completes in <5 seconds (excluding 42 API response time)
- **SC-003**: System handles 50 concurrent active games without frame drops or disconnections
- **SC-004**: 42 evaluation passes all required security checks (no SQL injection, XSS, or CSRF vulnerabilities)
- **SC-005**: All 19 module points are demonstrable and pass 42 evaluator review
- **SC-006**: Application starts with single `docker compose up` command
- **SC-007**: Grafana dashboards display real-time system metrics within 15 seconds of data generation

### 42 Evaluation Readiness

- All modules must be demonstrable to evaluators
- AI explainability must be visible in UI
- Security tests must pass (OWASP checklist)
- Multi-player must work across different machines

---

## Technical Constraints (from Constitution)

### Architecture

- **Monolithic Fresh App**: Single deployable unit, no microservices
- **Islands Architecture**: Interactive components use Fresh Islands for selective hydration
- **Server-Side Rendering**: All pages render on server first
- **File-Based Routing**: Routes follow Fresh conventions (`routes/`, `islands/`)

### Technology Stack

- **Runtime**: Deno ≥1.40
- **Framework**: Fresh ≥1.6
- **UI**: Preact ≥10.0
- **CSS**: DaisyUI + Tailwind
- **Database**: SQLite with WAL mode (`data/pong.db`)
- **Reverse Proxy**: Traefik ≥3.0

### Prohibited Patterns

- ❌ Usage of `any` type
- ❌ Raw SQL string interpolation (MUST use `db.prepare()`)
- ❌ `dangerouslySetInnerHTML` without security review
- ❌ Client-only routes (except WebSocket endpoints)
- ❌ Full-page client-side hydration
- ❌ Commented-out code in commits
- ❌ Premature abstractions (no factories/repositories until 3 use cases)

---

## Out of Scope

The following are explicitly NOT included in this specification:

- Mobile app (web-only per 42 requirements)
- Multiple game types (Pong only)
- Voice chat
- Video streaming
- Payment processing
- Email notifications
- Multiple languages (English only)
- Accessibility (WCAG compliance) - nice-to-have but not required
