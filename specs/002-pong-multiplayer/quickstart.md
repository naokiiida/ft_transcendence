# Quickstart: ft_transcendence Development

**Feature**: 002-pong-multiplayer
**Date**: 2026-01-06

This guide gets a developer from zero to running the application.

---

## Prerequisites

- **Deno** ≥1.40: `curl -fsSL https://deno.land/install.sh | sh`
- **Docker** with Docker Compose
- **42 API Application**: Register at https://profile.intra.42.fr/oauth/applications

---

## 1. Clone and Setup

```bash
git clone <repository-url>
cd ft_transcendence
```

## 2. Environment Configuration

Create `.env` file:

```bash
# 42 OAuth (get from https://profile.intra.42.fr/oauth/applications)
FT_CLIENT_ID=your_42_client_id
FT_CLIENT_SECRET=your_42_client_secret
FT_REDIRECT_URI=https://pong.taiida.com/api/auth/callback

# Session
SESSION_SECRET=generate_a_32_char_random_string

# Environment
DENO_ENV=development
```

Generate session secret:
```bash
openssl rand -hex 32
```

## 3. Database Setup

The database auto-initializes on first run. For manual setup:

```bash
mkdir -p data
deno task db:migrate
```

## 4. Run Development Server

```bash
# Start Fresh dev server with hot reload
deno task dev
```

Access at: https://pong.taiida.com (resolves to 127.0.0.1 via Cloudflare DNS)

## 5. Run with Docker (Production-like)

```bash
# Build and start all services
docker compose up --build

# Or in background
docker compose up -d
```

Services started:
- **fresh**: Application (port 8000)
- **traefik**: Reverse proxy (ports 80, 443)
- **prometheus**: Metrics (port 9090)
- **grafana**: Dashboards (port 3000)

---

## Project Structure Overview

```
ft_transcendence/
├── routes/              # Fresh routes (pages + API)
│   ├── api/             # REST + WebSocket endpoints
│   ├── game/            # Game pages
│   └── profile/         # User profile pages
├── islands/             # Interactive components (hydrated)
├── components/          # Server-rendered components
├── shared/              # Shared types + Zod schemas
├── lib/                 # Server utilities (db, auth, ws)
├── static/              # Static assets
├── tests/               # Test files
└── infra/               # Docker, Traefik, Prometheus, Grafana configs
```

---

## Common Tasks

### Run Tests

```bash
# All tests
deno task test

# Specific test file
deno test tests/unit/physics.test.ts

# With coverage
deno task test:coverage
```

### Linting & Formatting

```bash
# Lint check
deno task lint

# Format code
deno task fmt

# Type check
deno task check
```

### Database Operations

```bash
# Open SQLite CLI
sqlite3 data/pong.db

# Run migrations
deno task db:migrate

# Reset database (⚠️ deletes data)
rm data/pong.db && deno task db:migrate
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

- Routes go in `routes/`
- Interactive islands go in `islands/`
- Server utilities go in `lib/`
- Shared types go in `shared/types/`
- Zod schemas go in `shared/schemas/`

### 3. Test Locally

```bash
deno task dev
# Open https://pong.taiida.com in Chrome
```

### 4. Run Checks Before Commit

```bash
deno task check && deno task lint && deno task test
```

### 5. Commit with Convention

```bash
git commit -m "feat(game): add paddle collision detection"
```

Commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
Scopes: `game`, `auth`, `user`, `chat`, `infra`, `shared`

---

## Debugging

### View Logs

```bash
# Docker logs
docker compose logs -f fresh

# Development server logs appear in terminal
```

### Check Metrics

Visit http://localhost:9090 (Prometheus) or http://localhost:3000 (Grafana)

Default Grafana credentials: admin / admin

### Database Inspection

```bash
sqlite3 data/pong.db "SELECT * FROM users LIMIT 5;"
```

### WebSocket Testing

Use browser DevTools Network tab → WS filter, or:

```bash
# Using websocat
websocat wss://pong.taiida.com/api/ws -H "Cookie: session=YOUR_SESSION"
```

---

## Troubleshooting

### "Module not found" errors

```bash
deno cache --reload main.ts
```

### SQLite "database is locked"

Ensure only one process accesses the database, or check WAL mode:

```sql
PRAGMA journal_mode;  -- Should return 'wal'
```

### OAuth callback fails

1. Verify `FT_REDIRECT_URI` matches exactly in .env and 42 app settings
2. Check `FT_CLIENT_ID` and `FT_CLIENT_SECRET` are correct
3. Ensure https://pong.taiida.com resolves to 127.0.0.1

### Docker networking issues

```bash
docker compose down -v
docker compose up --build
```

---

## Useful Links

- [Fresh Documentation](https://fresh.deno.dev/docs)
- [Deno Manual](https://docs.deno.com)
- [DaisyUI Components](https://daisyui.com/components)
- [42 API Documentation](https://api.intra.42.fr/apidoc)
- [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)
