<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: 1.0.0 → 2.0.0 (MAJOR - Architecture pivot from microservices to monolith)

Modified principles:
  - "Microservices Architecture" → REMOVED (replaced with Fresh-First Monolith)
  - "Web-First Development" → Updated for Fresh Islands architecture (not SPA)
  - "Type Safety First" → Updated for Deno native TypeScript
  - "Docker-First Development" → Simplified to "Container-Based Development"
  - "Test-Driven Development" → Relaxed to "Test-Supported Development"

Added sections:
  - 42 Project Modules (19 points tracking)
  - Security Layers (defense-in-depth table)

Removed sections:
  - Microservices service list (api-gateway, auth-service, etc.)
  - Bun/Hono/React stack details
  - Drizzle ORM

Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible (monolith structure option exists)
  - .specify/templates/spec-template.md: ✅ Compatible (User Stories structure aligns)
  - .specify/templates/tasks-template.md: ✅ Compatible (Phase structure aligns)

Follow-up TODOs:
  - Create git hook to prevent raw db.query() usage (enforce db.prepare())
  - Create Claude Code hook for same SQL injection prevention
================================================================================
-->

# ft_transcendence Constitution

## Core Principles

### I. Fresh-First Monolithic Architecture

The application MUST be built as a single deployable unit using Deno Fresh.

- **Single Codebase**: All application code (routes, islands, APIs, game logic)
  MUST reside in one Fresh project; microservices are prohibited
- **Islands Architecture**: Interactive components MUST use Fresh Islands for selective hydration;
  full-page client-side hydration is prohibited
- **Server-Side Rendering**: All pages MUST render on the server first (SSR module = 1pt);
  client-only routes are prohibited except for WebSocket endpoints
- **File-Based Routing**: Routes MUST follow Fresh conventions (`routes/`, `islands/`);
  custom routing abstractions are prohibited

**Rationale**: A monolithic Fresh app reduces deployment complexity, eliminates
inter-service communication overhead, and allows a 4-5 person team to iterate faster.
Fresh's Islands architecture provides SPA-like interactivity without the complexity.

### II. Type Safety First

Deno's native TypeScript MUST be leveraged with strict settings and runtime validation.

- **Strict Mode**: `"strict": true` in `deno.json`; implicit `any` is prohibited
- **No `any` Type**: Usage of `any` is prohibited; `unknown` with type guards
  or explicit generics MUST be used instead
- **Runtime Validation**: All external inputs (form data, WebSocket messages, URL params)
  MUST be validated using Zod schemas before processing
- **Shared Types**: Game state, user models, and API contracts MUST be defined
  in a `shared/` directory imported by both server and client code

**Rationale**: Deno runs TypeScript natively without transpilation;
strict typing catches errors at development time rather than production.

### III. Security by Default

Security MUST be built into every layer; the 42 evaluation will test for vulnerabilities.

- **SQL Injection Prevention**: All database queries MUST use `db.prepare()` with
  parameterized statements; raw string interpolation in SQL is PROHIBITED
  and MUST be enforced by git hooks and Claude Code hooks
- **XSS Protection**: Preact's auto-escaping MUST be relied upon;
  `dangerouslySetInnerHTML` is prohibited without explicit security review
- **CSRF Protection**: Fresh middleware MUST validate CSRF tokens on all
  state-changing requests (POST, PUT, DELETE)
- **Authentication**: OAuth 2.0 via 42 API for login; session tokens stored
  in HTTP-only secure cookies
- **Password Hashing**: Local passwords (if any) MUST use bcrypt with cost factor ≥10
- **Input Validation**: Zod schemas MUST validate all user inputs on both
  client (UX) and server (security) sides
- **HTTPS Only**: Traefik MUST terminate TLS; all HTTP traffic redirects to HTTPS

**Rationale**: The 42 project requires security; failing security checks fails the project.
Defense-in-depth with multiple layers prevents single points of failure.

### IV. Real-Time Game Architecture

Game state MUST be authoritative on the server with client-side prediction for responsiveness.

- **Server Authority**: Game physics and scoring MUST be calculated server-side;
  clients send inputs, server broadcasts state
- **WebSocket Protocol**: Game and chat MUST share a single WebSocket connection per client;
  message types distinguished by a `type` field in JSON payloads
- **Reconnection Handling**: Clients MUST automatically reconnect on disconnect;
  server MUST maintain game state for 30 seconds to allow rejoin
- **Tick Rate**: Server MUST broadcast game state at ≥30 updates/second for Pong;
  clients interpolate between updates for smooth rendering

**Rationale**: Server-authoritative game logic prevents cheating and ensures
fair play—critical for tournament integrity.

### V. Observable Operations

System health MUST be visible through Prometheus metrics and Grafana dashboards.

- **Metrics Endpoint**: Fresh MUST expose `/metrics` in Prometheus format;
  custom metrics for active games, connected users, and match completions
- **Grafana Dashboards**: Pre-configured dashboards MUST show system health,
  game statistics, and user activity
- **Structured Logging**: All logs MUST be JSON format with request correlation IDs
- **Health Checks**: `/health` endpoint MUST return service status for Docker

**Rationale**: Prometheus + Grafana module (2pts) and Analytics Dashboard module (2pts)
require observable infrastructure; this also helps debugging in production.

### VI. Simplicity and YAGNI

Features MUST solve current requirements; speculative abstractions are prohibited.

- **Start Simple**: Implement the simplest solution that works;
  refactor when complexity is proven necessary
- **No Premature Abstraction**: Do not create factories, repositories, or plugins
  until three concrete use cases require them
- **Delete Dead Code**: Unused code MUST be removed immediately;
  commented-out code is prohibited in committed files
- **Dependency Minimalism**: Every external dependency MUST justify its inclusion;
  prefer Deno stdlib and Fresh built-ins over third-party packages

**Rationale**: The 42 project deadline requires focused development;
over-engineering wastes time and creates maintenance burden.

## 42 Project Modules

### Selected Modules (19 points / 14 required)

| Module | Category | Points | Implementation |
|--------|----------|--------|----------------|
| Web-based game (Pong) | Gaming | 2 | Canvas 2D + server-side physics |
| Remote players | Gaming | 2 | WebSocket real-time multiplayer |
| Frontend + Backend framework | Web | 2 | Fresh (full-stack, counts as both) |
| Real-time WebSockets | Web | 2 | Game state + chat |
| Standard user management | User | 2 | Profiles, friends, avatars, stats |
| Prometheus + Grafana | DevOps | 2 | `/metrics` endpoint + dashboards |
| Analytics Dashboard | Data | 2 | Grafana + SQLite plugin |
| AI Opponent | AI | 2 | Pong AI (must be explainable) |
| SSR | Web | 1 | Fresh built-in (free) |
| OAuth 2.0 | User | 1 | 42 API integration |
| Tournament system | Gaming | 1 | Brackets + matchmaking |
| **Total** | | **19** | **5pt buffer** |

### Module Dependencies

```
Tournament system ──────► Web-based game (Pong) [required]
AI Opponent ────────────► Web-based game (Pong) [required]
Remote players ─────────► Web-based game (Pong) [required]
Analytics Dashboard ────► Prometheus + Grafana  [data source]
Game statistics ────────► Web-based game (Pong) [if added later]
```

### Standard User Management Requirements (2pts)

Per 42 spec, this module MUST include:
- Users can update their profile information
- Users can upload an avatar (with default fallback)
- Users can add other users as friends and see online status
- Users have a profile page displaying their information
- Track user game statistics (wins, losses, ranking)
- Display match history (1v1 games, dates, results, opponents)

## Technology Stack

### Runtime and Framework

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Runtime | Deno | ≥1.40 | Native TypeScript, secure by default, built-in tooling |
| Framework | Fresh | ≥1.6 | SSR + Islands, file-based routing, Preact integration |
| UI Library | Preact | ≥10.0 | Lightweight React alternative, auto-escaping XSS |
| Database | SQLite/libSQL | Latest | Simple, file-based, `db.prepare()` prevents SQL injection |
| Reverse Proxy | Traefik | ≥3.0 | HTTPS termination, automatic TLS, Docker integration |

### Development Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| Biome | Linting + Formatting | `biome.json` at repo root |
| Deno | Testing | Built-in `deno test` |
| Docker | Containerization | `docker-compose.yml` for local dev |

### Security Layers

| Layer | Tool | Protects Against |
|-------|------|------------------|
| Reverse Proxy | Traefik | HTTPS, TLS termination |
| Input Validation | Zod (shared) | Invalid data, injection setup |
| SQL | `db.prepare()` | SQL injection |
| Passwords | bcrypt | Rainbow tables, brute force |
| Auth | Session + middleware | Unauthorized access |
| XSS | Preact auto-escape | Script injection |
| CSRF | Fresh middleware | Cross-site requests |

### Communication Protocols

| Use Case | Protocol | Implementation |
|----------|----------|----------------|
| Page Rendering | HTTP/2 | Fresh SSR |
| REST API | HTTP/2 | Fresh API routes (`/api/*`) |
| Game + Chat | WebSocket | Single shared connection |
| File Uploads | HTTP multipart | Avatars only; ≤2MB |

## Project Structure

```
ft_transcendence/
├── deno.json              # Deno config + tasks
├── biome.json             # Linting/formatting
├── docker-compose.yml     # Container orchestration
├── fresh.gen.ts           # Fresh manifest (auto-generated)
├── main.ts                # Entry point
├── routes/
│   ├── index.tsx          # Home page
│   ├── api/               # API endpoints
│   │   ├── auth/          # OAuth callbacks
│   │   ├── users/         # User CRUD
│   │   ├── games/         # Game history
│   │   └── ws.ts          # WebSocket upgrade
│   ├── game/              # Game pages
│   ├── profile/           # User profiles
│   └── tournament/        # Tournament brackets
├── islands/               # Interactive components
│   ├── PongCanvas.tsx     # Game rendering
│   ├── ChatBox.tsx        # Real-time chat
│   └── OnlineStatus.tsx   # Friend presence
├── shared/
│   ├── types/             # Shared TypeScript types
│   ├── schemas/           # Zod validation schemas
│   └── game/              # Game logic (shared server/client)
├── lib/
│   ├── db.ts              # Database (db.prepare only!)
│   ├── auth.ts            # Session management
│   └── ws.ts              # WebSocket handlers
├── static/                # Static assets
├── tests/                 # Test files
└── infra/
    ├── traefik/           # Reverse proxy config
    ├── prometheus/        # Metrics config
    └── grafana/           # Dashboard provisioning
```

## Development Workflow

### Branch Strategy

- `main`: Production-ready; protected; requires PR approval
- `develop`: Integration branch
- `feature/<name>`: Individual features
- `fix/<name>`: Bug fixes

### Commit Standards

- **Format**: `<type>(<scope>): <description>` (Conventional Commits)
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Scope**: `game`, `auth`, `user`, `chat`, `infra`, `shared`

### Code Review Requirements

- All changes MUST be reviewed by at least one team member
- Reviews MUST verify:
  - No raw SQL (only `db.prepare()`)
  - Zod validation on all inputs
  - No `any` types
  - Constitution principles followed
- Self-merges prohibited for non-trivial changes

### Definition of Done

A feature is complete when:
1. No TypeScript errors (`deno check`)
2. Biome passes (`deno task lint`)
3. Code review approved
4. `docker compose up` works
5. Manually tested in Chrome (42 requirement)

## Container Configuration

### Docker Compose Services

```yaml
services:
  fresh:        # Main application (Deno + Fresh)
  traefik:      # Reverse proxy + TLS termination
  prometheus:   # Metrics collection
  grafana:      # Dashboards + analytics
```

### Single Command Startup

Development environment MUST start with:
```bash
docker compose up
```

No additional setup commands required after initial clone.

## Governance

### Constitution Authority

This constitution supersedes all other development practices.
When conflicts arise, this document takes precedence.

### Amendment Procedure

1. **Proposal**: Any team member may propose amendments via PR
2. **Discussion**: Amendments MUST be discussed for ≥24 hours
3. **Approval**: Requires approval from ≥50% of active team members
4. **Migration**: Breaking amendments MUST include migration plan

### Versioning Policy

- **MAJOR** (X.0.0): Architecture changes, principle removals
- **MINOR** (x.Y.0): New principles, sections, or expansions
- **PATCH** (x.y.Z): Clarifications, typo fixes

### Principle Violations

- **Soft Violations**: Documented in code review; fix promptly
- **Hard Violations** (Security, SQL injection): Block merge; immediate fix required

**Version**: 2.0.0 | **Ratified**: 2026-01-06 | **Last Amended**: 2026-01-06
