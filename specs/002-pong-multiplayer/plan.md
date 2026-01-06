# Implementation Plan: ft_transcendence - Multiplayer Pong Platform

**Branch**: `002-pong-multiplayer` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-pong-multiplayer/spec.md`

## Summary

Build a full-stack multiplayer Pong web application using Deno Fresh with SSR + Islands architecture. The platform supports real-time gameplay via WebSockets, 42 OAuth authentication, user profiles with friends/stats, AI opponents with explainable decision-making, tournament brackets, and observability through Prometheus/Grafana. Target: 19 points across 11 42 project modules.

## Technical Context

**Language/Version**: TypeScript (Deno ≥1.40 native)
**Primary Dependencies**: Fresh ≥1.6, Preact ≥10.0, DaisyUI + Tailwind, Zod
**Storage**: SQLite with WAL mode (`data/pong.db`)
**Testing**: Deno built-in (`deno test`)
**Target Platform**: Web (Chrome required for 42 eval), Docker deployment
**Project Type**: web (monolithic Fresh app with SSR + Islands)
**Performance Goals**: ≥30 game state updates/sec, <100ms input latency (LAN), 50 concurrent games
**Constraints**: Server-authoritative game logic, single WebSocket per client, no `any` types
**Scale/Scope**: 50 concurrent users, single domain (pong.taiida.com)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Fresh-First Monolithic | ✅ PASS | Single Fresh app, no microservices, Islands for interactivity |
| II. Type Safety First | ✅ PASS | Strict TS, Zod validation, shared types in `shared/` |
| III. Security by Default | ✅ PASS | db.prepare(), CSRF middleware, OAuth 2.0, Zod input validation |
| IV. Real-Time Game Architecture | ✅ PASS | Server-authoritative physics, single WebSocket, 30 tick/sec |
| V. Observable Operations | ✅ PASS | /metrics, /health, JSON logs, Grafana dashboards |
| VI. Simplicity and YAGNI | ✅ PASS | No premature abstractions, direct implementations |

**Gate Result**: PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/002-pong-multiplayer/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Fresh Monolithic Structure (per Constitution)
deno.json                 # Deno config + tasks (includes lint/fmt rules)
tailwind.config.ts        # Tailwind + DaisyUI config
docker-compose.yml        # Container orchestration
Dockerfile                # Multi-stage build
fresh.gen.ts              # Fresh manifest (auto-generated)
main.ts                   # Entry point

data/
└── pong.db               # SQLite database (WAL mode)

routes/
├── _app.tsx              # App wrapper (Tailwind styles)
├── _middleware.ts        # CSRF, auth, session middleware
├── index.tsx             # Home page
├── login.tsx             # Login page (email/password + 42 OAuth)
├── register.tsx          # Registration page (email/password)
├── api/
│   ├── auth/
│   │   ├── register.ts   # Email/password registration
│   │   ├── login.ts      # Email/password login
│   │   ├── callback.ts   # OAuth callback handler (with account merge)
│   │   └── logout.ts     # Session invalidation
│   ├── users/
│   │   ├── [id].ts       # User CRUD
│   │   ├── me.ts         # Current user
│   │   └── me/
│   │       └── friends.ts # Friend management (GET, POST, PATCH, DELETE)
│   ├── games/
│   │   ├── index.ts      # Game history, create game
│   │   └── [id].ts       # Specific game details
│   ├── tournaments/
│   │   ├── index.ts      # List/create tournaments
│   │   └── [id].ts       # Tournament details/join
│   ├── ws.ts             # WebSocket upgrade endpoint
│   ├── metrics.ts        # Prometheus metrics
│   └── health.ts         # Health check
├── game/
│   ├── index.tsx         # Game lobby
│   ├── [id].tsx          # Game room page
│   └── ai.tsx            # AI opponent page
├── profile/
│   ├── index.tsx         # Current user profile
│   └── [id].tsx          # Other user profile
└── tournament/
    ├── index.tsx         # Tournament list
    ├── create.tsx        # Create tournament
    └── [id].tsx          # Tournament bracket view

islands/
├── PongCanvas.tsx        # Game rendering (Canvas 2D)
├── PongControls.tsx      # Keyboard input handling
├── ChatBox.tsx           # Real-time chat
├── OnlineStatus.tsx      # Friend presence indicators
├── MatchmakingQueue.tsx  # Queue UI with wait time
├── TournamentBracket.tsx # Bracket visualization
├── AIExplainer.tsx       # AI decision visualization
└── AvatarUpload.tsx      # Profile image upload

components/
├── ui/                   # DaisyUI wrappers (server-rendered)
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   └── Badge.tsx
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Nav.tsx
└── game/
    ├── ScoreDisplay.tsx
    └── GameOverModal.tsx

shared/
├── types/
│   ├── user.ts           # User, Friendship types
│   ├── game.ts           # Game, GameState types
│   ├── tournament.ts     # Tournament types
│   └── ws.ts             # WebSocket message types
├── schemas/
│   ├── auth.ts           # Zod schemas for login/register (email regex, password ≥8)
│   ├── user.ts           # Zod schemas for user input
│   ├── game.ts           # Zod schemas for game messages
│   └── tournament.ts     # Zod schemas for tournament input
└── game/
    ├── physics.ts        # Ball/paddle physics (shared for prediction)
    ├── constants.ts      # Game dimensions, speeds
    └── ai.ts             # AI logic (server-only runtime)

lib/
├── db.ts                 # Database (db.prepare() only!)
├── auth.ts               # Session management, OAuth helpers
├── password.ts           # bcrypt hash/verify (cost factor 12)
├── ws.ts                 # WebSocket connection manager
├── game-server.ts        # Game loop, state management
├── matchmaking.ts        # Queue logic
├── metrics.ts            # Prometheus metric definitions
└── logger.ts             # JSON structured logging

static/
└── styles.css            # Compiled Tailwind output

tests/
├── unit/
│   ├── physics.test.ts   # Game physics tests
│   ├── ai.test.ts        # AI decision tests
│   └── schemas.test.ts   # Zod schema tests
├── integration/
│   ├── auth.test.ts      # OAuth flow tests
│   ├── game.test.ts      # Game lifecycle tests
│   └── ws.test.ts        # WebSocket tests
└── e2e/
    └── game-flow.test.ts # Full game E2E

infra/
├── traefik/
│   └── traefik.yml       # Reverse proxy config
├── prometheus/
│   └── prometheus.yml    # Scrape config
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   └── dashboards/
    └── dashboards/
        ├── system-health.json
        └── game-analytics.json
```

**Structure Decision**: Fresh monolithic structure following constitution conventions. All source code in single deployable unit. Routes use file-based routing, Islands for interactive components only.

## Complexity Tracking

> No violations detected - design follows constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
