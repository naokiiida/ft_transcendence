# Implementation Plan: ft_transcendence - Multiplayer Pong Platform

**Branch**: `002-pong-multiplayer` | **Date**: 2026-01-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-pong-multiplayer/spec.md`

## Summary

Full-stack Pong multiplayer platform built with **Deno Fresh** (SSR + Islands architecture). Core deliverables: real-time WebSocket gameplay, 42 OAuth + email auth, tournament brackets, AI opponent with explainability, and Prometheus/Grafana observability. Targets **19 module points** (14 required) for 42 project evaluation.

## Technical Context

**Language/Version**: TypeScript (Deno ≥1.40 native)
**Primary Dependencies**: Fresh ≥1.6, Preact ≥10.0, DaisyUI + Tailwind, Zod
**Storage**: SQLite with WAL mode (`data/pong.db`)
**Testing**: `deno test` (built-in)
**Target Platform**: Docker containers (linux/amd64), accessed via HTTPS at `pong.taiida.com`
**Project Type**: Web (Fresh monolith - combined frontend/backend)
**Performance Goals**: ≥30 game state updates/sec, <100ms LAN latency, ≥100 concurrent games
**Constraints**: Single `docker compose up` startup, no microservices, SQLite only
**Scale/Scope**: 50 concurrent games, ~100 users, 42 evaluation readiness

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate Criteria | Status |
|-----------|---------------|--------|
| I. Fresh-First Monolithic | Single codebase, no microservices, Islands for interactivity | ✅ PASS |
| II. Type Safety First | `strict: true`, no `any`, Zod validation on all inputs | ✅ PASS |
| III. Security by Default | `db.prepare()` only, bcrypt, CSRF tokens, HTTPS | ✅ PASS |
| IV. Real-Time Game Architecture | Server-authoritative physics, WebSocket protocol, 30 tick/sec | ✅ PASS |
| V. Observable Operations | `/metrics`, `/health`, JSON logs, Grafana dashboards | ✅ PASS |
| VI. Simplicity and YAGNI | No premature abstractions, minimal dependencies | ✅ PASS |

**Pre-Design Gate**: PASSED - Proceed to Phase 0

**Post-Design Gate** (2026-01-08): PASSED - All principles maintained
- ✅ Single Fresh codebase with Islands architecture
- ✅ Zod schemas defined in `shared/schemas/`
- ✅ `db.prepare()` pattern in research.md examples
- ✅ Server-authoritative game loop at 30 tick/sec
- ✅ `/metrics` and `/health` endpoints planned
- ✅ Minimal dependencies (Deno stdlib + Fresh + Zod)

## Project Structure

### Documentation (this feature)

```text
specs/002-pong-multiplayer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Fresh Monolith Structure (per Constitution §I)
ft_transcendence/
├── deno.json              # Deno config + tasks
├── tailwind.config.ts     # Tailwind + DaisyUI
├── docker-compose.yml     # Container orchestration
├── Dockerfile             # Multi-stage build
├── fresh.gen.ts           # Fresh manifest (auto-generated)
├── main.ts                # Entry point
├── data/
│   └── pong.db            # SQLite database (WAL mode)
├── routes/
│   ├── _app.tsx           # App wrapper
│   ├── _middleware.ts     # Auth + CSRF middleware
│   ├── index.tsx          # Home page
│   ├── login.tsx          # Email/password + 42 OAuth
│   ├── register.tsx       # Email registration
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts       # POST /api/auth/login
│   │   │   ├── logout.ts      # POST /api/auth/logout
│   │   │   ├── register.ts    # POST /api/auth/register
│   │   │   └── oauth/
│   │   │       └── 42/        # 42 OAuth callback
│   │   ├── users/
│   │   │   ├── [id].ts        # GET/PATCH user profile
│   │   │   └── me.ts          # GET current user
│   │   ├── friends/           # Friend request endpoints
│   │   ├── games/             # Game history endpoints
│   │   ├── tournaments/       # Tournament CRUD
│   │   ├── matchmaking.ts     # POST /api/matchmaking
│   │   └── ws.ts              # WebSocket upgrade
│   ├── game/
│   │   ├── [id].tsx           # Game room page
│   │   └── ai.tsx             # AI opponent page
│   ├── profile/
│   │   ├── [id].tsx           # User profile view
│   │   └── edit.tsx           # Profile edit page
│   ├── tournament/
│   │   ├── index.tsx          # Tournament list
│   │   ├── create.tsx         # Create tournament
│   │   └── [id].tsx           # Tournament bracket view
│   ├── metrics.ts             # Prometheus /metrics
│   └── health.ts              # Health check /health
├── islands/
│   ├── PongCanvas.tsx         # Game rendering (Canvas 2D)
│   ├── ChatBox.tsx            # Real-time chat
│   ├── OnlineStatus.tsx       # Friend presence indicator
│   ├── MatchmakingQueue.tsx   # Queue UI with timer
│   ├── TournamentBracket.tsx  # Interactive bracket
│   └── AIExplainer.tsx        # AI decision visualization
├── components/
│   ├── ui/                    # DaisyUI wrappers
│   ├── layout/                # Page layouts
│   └── forms/                 # Form components
├── shared/
│   ├── types/
│   │   ├── user.ts            # User, Session types
│   │   ├── game.ts            # GameState, PlayerInput types
│   │   ├── tournament.ts      # Tournament, Match types
│   │   └── ws.ts              # WebSocket message types
│   ├── schemas/
│   │   ├── auth.ts            # Login, Register schemas (Zod)
│   │   ├── user.ts            # Profile update schemas
│   │   ├── game.ts            # Game action schemas
│   │   └── tournament.ts      # Tournament schemas
│   └── game/
│       ├── physics.ts         # Ball/paddle physics
│       ├── constants.ts       # Game dimensions, speeds
│       └── ai.ts              # AI decision logic
├── lib/
│   ├── db.ts                  # SQLite with db.prepare() only
│   ├── auth.ts                # Session management
│   ├── ws.ts                  # WebSocket handlers
│   ├── matchmaking.ts         # Queue management
│   ├── metrics.ts             # Prometheus metrics
│   └── oauth42.ts             # 42 OAuth client
├── static/
│   └── styles.css             # Compiled Tailwind
├── tests/
│   ├── unit/
│   │   ├── physics.test.ts
│   │   ├── ai.test.ts
│   │   └── auth.test.ts
│   ├── integration/
│   │   ├── game.test.ts
│   │   └── tournament.test.ts
│   └── e2e/
│       └── gameplay.test.ts
└── infra/
    ├── traefik/
    │   └── traefik.yml        # Traefik config
    ├── prometheus/
    │   └── prometheus.yml     # Scrape config
    └── grafana/
        ├── provisioning/      # Dashboard provisioning
        └── dashboards/        # Pre-built dashboards
```

**Structure Decision**: Fresh monolith with Islands architecture per Constitution §I. Routes handle SSR pages and API endpoints. Interactive components (game canvas, chat, brackets) are Islands with selective hydration. Shared types/schemas enable type-safe client-server communication.

## Complexity Tracking

> No violations - design follows Constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
