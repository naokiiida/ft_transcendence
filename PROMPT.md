<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: 1.1.0 → 1.2.0 (MINOR - Add UI stack, domain architecture)

Modified principles:
  - III. Type Safety First: Updated data layer from Drizzle to Prisma TypedSQL
  - V. Security by Default: Added email/password auth requirement per 42 spec
  - Technology Stack: Added shadcn/ui, Lucide icons, domain architecture

Added sections:
  - 42 Project Requirements (mandatory compliance section)
  - Module Point Tracking
  - Domain Architecture (pong.taiida.com)

Removed sections: None

Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section exists)
  - .specify/templates/spec-template.md: ✅ Compatible (User Stories structure aligns)
  - .specify/templates/tasks-template.md: ✅ Compatible (Phase structure aligns)

Follow-up TODOs: None
================================================================================
-->

# ft_transcendence Constitution

## Core Principles

### I. Web-First Development

All features MUST be designed for browser-native execution with real-time capabilities.

- **Single Page Application (SPA)**: The frontend MUST operate as an SPA with client-side routing;
  full page reloads are prohibited except for initial load and authentication redirects
- **Real-Time First**: Game state, chat, and presence MUST use WebSocket connections;
  HTTP polling is prohibited for real-time features
- **Responsive Design**: UI MUST function on viewport widths from 320px to 2560px;
  breakpoints MUST be defined in a central theme configuration
- **Browser APIs**: MUST leverage native APIs (Canvas 2D for game rendering,
  Notification API for alerts, Web Audio for sound) before third-party alternatives

**Rationale**: ft_transcendence is a browser-based multiplayer game;
performance and user experience depend on minimizing network round-trips
and maximizing browser-native capabilities.

### II. Microservices Architecture

The system MUST be decomposed into independently deployable services with clear boundaries.

- **Service Boundaries**: Each microservice MUST own its data and expose a REST API;
  direct database access across service boundaries is prohibited
- **Services Required**:
  - `api-gateway`: Request routing, rate limiting, CORS
  - `auth-service`: OAuth 2.0, JWT issuance, session management
  - `user-service`: Registration, profiles, avatars, friends, stats
  - `game-service`: Match orchestration, game state, history
  - `chat-service`: Real-time messaging, channels, DMs
- **Communication**: Services MUST communicate via HTTP REST for synchronous operations
  and WebSocket/events for real-time state propagation
- **Independence**: Each service MUST be startable, testable, and deployable in isolation

**Rationale**: Microservices enable independent scaling, fault isolation,
and team parallelization—critical for a real-time multiplayer system.

### III. Type Safety First

TypeScript strict mode MUST be enforced across all codebases with runtime validation at boundaries.

- **Compiler Configuration**: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`
  MUST be enabled in all `tsconfig.json` files
- **No `any` Type**: Usage of `any` is prohibited; `unknown` with type guards
  or explicit generics MUST be used instead
- **Runtime Validation**: All external inputs (API requests, WebSocket messages, environment variables)
  MUST be validated using Zod schemas; unvalidated data MUST NOT propagate beyond service boundaries
- **Shared Types**: Common types (API contracts, game state, user models)
  MUST be defined in a shared `types` package imported by all services

**Rationale**: Type safety eliminates entire categories of runtime errors;
runtime validation ensures malformed data cannot corrupt system state.

### IV. Test-Driven Development (NON-NEGOTIABLE)

Tests MUST be written before implementation; no feature code without failing tests first.

- **Red-Green-Refactor**: Write failing test → implement minimal code to pass → refactor;
  this cycle is mandatory for all new functionality
- **Test Categories**:
  - **Contract Tests**: API endpoint request/response schemas MUST have contract tests
  - **Integration Tests**: Cross-service flows (auth → game, user → chat) MUST have integration tests
  - **Unit Tests**: Business logic with branching MUST have unit tests
- **Coverage Thresholds**: Services MUST maintain ≥80% line coverage;
  critical paths (auth, game logic) MUST have ≥95% coverage
- **Test Naming**: Tests MUST follow `[unit|integration|contract]_[feature]_[scenario]_[expected]` pattern

**Rationale**: TDD produces more maintainable code, serves as living documentation,
and catches regressions before they reach production.

### V. Security by Default

Security MUST be built into every layer; vulnerabilities are treated as critical bugs.

- **Authentication**: OAuth 2.0 with JWT tokens; tokens MUST expire within 15 minutes;
  refresh tokens MUST be HTTP-only secure cookies
- **Authorization**: All endpoints MUST verify JWT and check permissions before processing;
  default-deny policy for all resources
- **Input Validation**: All user inputs MUST be sanitized; SQL injection, XSS, and CSRF
  protections MUST be active on all routes
- **Secrets Management**: Secrets MUST be injected via environment variables;
  hardcoded credentials in source code are prohibited
- **HTTPS Only**: All production traffic MUST use TLS 1.3; HTTP redirects to HTTPS

**Rationale**: ft_transcendence handles user credentials, personal data, and real-time game state;
security breaches would compromise user trust and violate 42 project requirements.

### VI. Docker-First Development

All development and deployment MUST use containerized environments for consistency.

- **Docker Compose**: Development environment MUST be startable with a single `docker compose up` command
- **Service Isolation**: Each microservice MUST have its own Dockerfile;
  multi-stage builds MUST be used to minimize image size
- **Database Containers**: LibSQL/Turso MUST run in containers for local development;
  production connections use Turso cloud
- **Environment Parity**: Development containers MUST mirror production configuration;
  "works on my machine" scenarios are prohibited
- **Health Checks**: All services MUST expose `/health` endpoints checked by Docker

**Rationale**: Containerization eliminates environment drift between team members
and ensures predictable deployments.

### VII. Simplicity and YAGNI

Features MUST solve current requirements; speculative abstractions are prohibited.

- **Start Simple**: Implement the simplest solution that passes tests;
  refactor when complexity is proven necessary
- **No Premature Abstraction**: Do not create factories, strategies, or plugins
  until three concrete use cases require them
- **Delete Dead Code**: Unused code MUST be removed immediately;
  commented-out code is prohibited in committed files
- **Dependency Minimalism**: Every external dependency MUST justify its inclusion;
  prefer stdlib or small focused libraries over large frameworks

**Rationale**: Over-engineering wastes development time and creates maintenance burden;
the ft_transcendence deadline requires focused, efficient development.

## Technology Stack Constraints

### Runtime and Framework

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Runtime | Bun | ≥1.0 | Fast startup, native TypeScript, built-in test runner |
| Backend Framework | Hono | ≥4.0 | Lightweight, fast, middleware-focused, Bun-optimized |
| Frontend Framework | React | ≥18.0 | Component model, hooks, ecosystem maturity |
| Database | LibSQL (Turso) | Latest | SQLite fork with edge replication, serverless-friendly |
| Data Layer | Prisma TypedSQL | ≥6.0 | Raw SQL with type generation; no ORM abstraction |

### Prisma TypedSQL Workflow

Raw SQL queries are preferred over ORM abstractions. Prisma TypedSQL provides type safety without hiding the SQL:

```
prisma/sql/
├── getUsers.sql           # Raw SQL queries
├── createUser.sql
├── getMatchHistory.sql
└── updateUserStats.sql
```

**Workflow**:
1. Write raw `.sql` files in `prisma/sql/`
2. Run `prisma generate --sql` to generate typed client
3. Import and use: `import { getUsers } from "@prisma/client/sql"`
4. Execute with `client.$queryRawTyped(getUsers({ email }))`

**Turso Compatibility**: Use `@prisma/adapter-libsql` driver adapter

### UI Framework

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| Component Library | shadcn/ui | Latest | Copy-paste components; full customization; built on Radix UI |
| CSS Framework | Tailwind CSS | ≥3.4 | Required by shadcn/ui; utility-first |
| Icons | Lucide | Latest | Clean, consistent icon set; tree-shakeable |
| Primitives | Radix UI | Latest | Accessible, unstyled primitives (via shadcn/ui) |

**shadcn/ui Workflow**:
- Components are copied into `frontend/src/components/ui/`
- Full ownership—modify as needed; no version lock-in
- Use `bunx shadcn@latest add <component>` to add new components

### Development Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| Biome | Linting + Formatting | `biome.json` at repo root; format on save enforced |
| TypeScript | Type checking | Strict mode; shared `tsconfig.base.json` |
| Bun Test | Testing | Built-in; `bun test` for all test execution |
| Docker | Containerization | `docker-compose.yml` for local dev; per-service Dockerfiles |

### Authentication

- **Provider**: OAuth 2.0 (42 API as primary; optionally Google/GitHub)
- **Token Format**: JWT with RS256 signing
- **Session Storage**: HTTP-only secure cookies for refresh tokens
- **Token Lifetime**: Access token 15min, Refresh token 7 days

### Communication Protocols

| Use Case | Protocol | Library |
|----------|----------|---------|
| REST API | HTTP/2 | Hono built-in |
| Real-time Game | WebSocket | Hono WebSocket upgrade |
| Real-time Chat | WebSocket | Shared connection with game |
| File Uploads | HTTP multipart | Avatar images only; ≤2MB |

### Domain Architecture

**Base Domain**: `pong.taiida.com`

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `pong.taiida.com` | React SPA; main user interface |
| API Gateway | `api.pong.taiida.com` | REST API entry point; routes to microservices |
| WebSocket | `ws.pong.taiida.com` | Real-time game and chat connections |
| Auth Callback | `api.pong.taiida.com/auth/callback` | OAuth 2.0 redirect URI |

**Frontend Routes** (client-side routing under `pong.taiida.com`):

| Route | Purpose |
|-------|---------|
| `/` | Landing page / game lobby |
| `/login` | Authentication page |
| `/user/:id` | User profile page |
| `/game/:id` | Active game room |
| `/tournament/:id` | Tournament bracket view |
| `/settings` | User settings |
| `/privacy` | Privacy Policy (required) |
| `/terms` | Terms of Service (required) |

**API Routes** (under `api.pong.taiida.com`):

| Route | Service | Purpose |
|-------|---------|---------|
| `/auth/*` | auth-service | OAuth, JWT, sessions |
| `/users/*` | user-service | Profiles, friends, stats |
| `/games/*` | game-service | Match orchestration, history |
| `/chat/*` | chat-service | Messages, channels |
| `/health` | all | Health check endpoint |

**CORS Configuration**:
- Allow origin: `https://pong.taiida.com`
- Allow credentials: `true`
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`

**SSL/TLS**: All domains MUST use HTTPS (TLS 1.3); managed via Let's Encrypt or Cloudflare

## Development Workflow

### Branch Strategy

- `main`: Production-ready code; protected; requires PR approval
- `develop`: Integration branch; all feature branches merge here first
- `feature/<name>`: Individual features; short-lived (≤1 week)
- `fix/<name>`: Bug fixes
- `release/<version>`: Release preparation

### Commit Standards

- **Format**: `<type>(<scope>): <description>` (Conventional Commits)
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Scope**: Service name (`auth`, `game`, `user`, `chat`, `gateway`) or `shared`
- **Atomicity**: Each commit MUST leave the codebase in a working state

### Code Review Requirements

- All changes MUST be reviewed by at least one team member
- Reviews MUST verify:
  - Tests exist and pass
  - Type safety is maintained
  - Security considerations are addressed
  - Constitution principles are followed
- Self-merges are prohibited for non-trivial changes

### Definition of Done

A feature is complete when:
1. All acceptance tests pass
2. Code coverage thresholds are met
3. Documentation is updated (if applicable)
4. Code review is approved
5. CI pipeline passes
6. Deployed to staging and manually verified

## 42 Project Requirements (NON-NEGOTIABLE)

These requirements come directly from ft_transcendence v19 and MUST be satisfied for project validation.

### Mandatory General Requirements

- **Web Application**: MUST have frontend, backend, and database
- **Containerization**: MUST deploy with Docker; single `docker compose up` command
- **Browser Compatibility**: MUST work on latest stable Google Chrome
- **Console Cleanliness**: No warnings or errors in browser console
- **Legal Pages**: Privacy Policy and Terms of Service pages MUST be accessible and contain relevant content
- **Multi-User Support**: Multiple users MUST be able to use the application simultaneously without conflicts

### Mandatory Technical Requirements

- **Responsive Frontend**: Clear, responsive, accessible across all devices
- **CSS Framework**: MUST use a styling solution (Tailwind CSS, etc.)
- **Environment Variables**: Credentials in `.env` file (git-ignored); `.env.example` MUST be provided
- **Database Schema**: Clear schema with well-defined relations
- **User Management**: Basic auth with email/password (hashed, salted); OAuth via modules
- **Form Validation**: All inputs validated on BOTH frontend AND backend
- **HTTPS**: Backend MUST use HTTPS everywhere

### Standard User Management (Module: Major - 2pts)

Per your requirements, this module MUST include:

| Feature | Requirement |
|---------|-------------|
| Profile Updates | Users can update their profile information |
| Avatar System | Upload avatar with default fallback |
| Friends System | Add/remove friends, see online status |
| Profile Page | Display user information |
| Display Names | Unique names for tournaments |
| User Stats | Track wins, losses |
| Match History | Track all games played |

### Module Point Tracking

**Target**: ≥14 points (Major = 2pts, Minor = 1pt)

**Planned Modules** (update as team decides):

| Module | Type | Points | Status |
|--------|------|--------|--------|
| Frontend + Backend Frameworks | Major | 2 | Planned |
| Real-time WebSocket Features | Major | 2 | Planned |
| Web-based Pong Game | Major | 2 | Planned |
| Remote Players | Major | 2 | Planned |
| Standard User Management | Major | 2 | Planned |
| OAuth 2.0 (42 API) | Minor | 1 | Planned |
| Tournament System | Minor | 1 | Planned |
| Backend as Microservices | Major | 2 | Planned |
| **Total** | | **14** | |

### README Requirements

The README.md MUST include (per 42 spec):

1. **First line**: Italicized 42 attribution with team logins
2. **Description**: Project name, goal, key features
3. **Instructions**: Prerequisites, .env setup, step-by-step run instructions
4. **Resources**: References + AI usage disclosure
5. **Team Information**: Roles (PO, PM, Tech Lead, Developers) with responsibilities
6. **Project Management**: Work organization, tools, communication channels
7. **Technical Stack**: Frontend, backend, database with justifications
8. **Database Schema**: Visual representation or description
9. **Features List**: Complete list with team member assignments
10. **Modules**: List with point calculations, justifications, implementation details
11. **Individual Contributions**: Detailed breakdown per team member

## Governance

### Constitution Authority

This constitution supersedes all other development practices and conventions.
When conflicts arise between this document and external guidance,
this constitution takes precedence.

### Amendment Procedure

1. **Proposal**: Any team member may propose amendments via PR to this file
2. **Discussion**: Amendments MUST be discussed for ≥24 hours before merging
3. **Approval**: Amendments require approval from ≥50% of active team members
4. **Documentation**: Amendment MUST include rationale and impact analysis
5. **Migration**: Breaking amendments MUST include migration plan for existing code

### Versioning Policy

- **MAJOR** (X.0.0): Backward-incompatible principle changes or removals
- **MINOR** (x.Y.0): New principles, sections, or material expansions
- **PATCH** (x.y.Z): Clarifications, typo fixes, non-semantic refinements

### Compliance Review

- Weekly: Quick review of recent commits against principles
- Sprint End: Comprehensive constitution compliance check
- Pre-Release: Full audit of all code against constitution

### Principle Violations

- **Soft Violations**: Documented in code review; fix in next sprint
- **Hard Violations** (Security, TDD): Block merge; immediate fix required
- **Repeated Violations**: Trigger team retrospective to identify root cause

**Version**: 1.2.0 | **Ratified**: 2026-01-05 | **Last Amended**: 2026-01-05
