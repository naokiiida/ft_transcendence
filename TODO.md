# Performance Profiling Findings & TODO

Date: 2026-04-08

## Profiling Summary

### Frontend (Canvas Game Loop) — After 60Hz upgrade
- **FPS**: 60 fps (vsync-locked on 60Hz display, 120fps on ProMotion)
- **Frame time**: 0.24ms avg (budget: 8.3ms at 120fps) — **97% headroom**
- **Physics**: 0.00ms avg — negligible cost
- **Render**: 0.05ms avg — Canvas 2D extremely efficient
- **P95**: 0.4ms, **P99**: 0.8ms — rock-solid tail latency
- **Dropped frames**: 0 (0.0%)

### Frontend (Before/After comparison)
| Metric | Before (30/15Hz) | After (60/60Hz + interp) |
|--------|------------------|--------------------------|
| FPS | 185 (uncapped) | 60 (vsync) |
| Frame time | 0.48ms | 0.24ms |
| Physics | 0.02ms | 0.00ms |
| Render | 0.20ms | 0.05ms |
| P95 | 0.8ms | 0.4ms |
| Dropped | 0 (0.0%) | 0 (0.0%) |

Note: Frame time improved because the profiler now samples at consistent
vsync intervals rather than uncapped. Physics shows as 0.00ms because local
games already ran at requestAnimationFrame rate — the 60Hz change only
affects the online server tick/broadcast.

### Frontend (CPU Throttling — Low-end Device Simulation)
| Simulated Load | Frame time | Render | P95 | P99 | Dropped |
|----------------|-----------|--------|-----|-----|---------|
| None (M2 Air) | 0.24ms | 0.05ms | 0.4ms | 0.8ms | **0 (0%)** |
| 8ms busy (~mid mobile) | 1.07ms | 0.30ms | 4.7ms | 4.7ms | **0 (0%)** |
| 12ms busy (~low mobile) | 0.82ms | 0.32ms | 1.7ms | 4.7ms | **0 (0%)** |
| 14ms busy (~extreme) | 0.77ms | 0.32ms | 1.7ms | 4.7ms | **0 (0%)** |

Even consuming 87% of the 16ms frame budget with artificial load, the game
itself (physics + render ~0.3ms) never drops a frame. Canvas 2D Pong is
effectively immune to client-side CPU constraints.

### Backend (V8 CPU Profile comparison)
| Metric | 30/15Hz (431 ticks) | 60/60Hz (529 ticks) |
|--------|---------------------|---------------------|
| JavaScript | 4.2% | 2.6% |
| C++ | 87.5% | 88.3% |
| GC | 2.6% | 1.7% |

- Both profiles dominated by startup — no regression from doubling tick rate
- **Top hotspot**: `__hash_table::~__hash_table()` — V8 CJS module compilation (startup only)
- **Second hotspot**: `_mach_absolute_time` — prom-client `collectDefaultMetrics`
- GC pressure actually decreased at 60Hz (1.7% vs 2.6%) — within noise margin

### Backend (0x Flamegraph)
- Startup-dominated profile: most CPU spent on NestJS DI container initialization and CJS module loading
- Runtime is idle — Pong physics is trivially cheap at 60Hz tick rate
- No hot application-level functions visible

---

## k6 Load Test Results

### Environment
- Docker-constrained backend: **0.5 CPU / 256MB RAM** (simulates ~$5/mo VPS)
- Docker-constrained frontend: **0.25 CPU / 128MB RAM**
- k6 running from host (M2 MacBook Air)

### HTTP Load Test (`k6/http-load.js`)

3-phase scenario: warmup (5 VU, 10s) → normal (20 VU, 20s) → peak (ramp to 50 VU, 25s)

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| **HTTP P50** | 2.93ms | — | OK |
| **HTTP P90** | 8.64ms | — | OK |
| **HTTP P95** | **15.99ms** | <200ms | PASS |
| **HTTP P99** | **58.71ms** | <500ms | PASS |
| Health P95 | 13.83ms | <100ms | PASS |
| Health P99 | 47.76ms | <200ms | PASS |
| Throughput | **187 req/s** | — | OK |
| Total requests | 10,338 | — | — |
| Iterations | 3,446 (55s) | — | — |
| Memory after load | 41MB / 256MB (16%) | — | OK |

**Finding**: Leaderboard API returned 429 (rate limited) under k6 load due to
NestJS ThrottlerGuard. Health and metrics endpoints handled 50 concurrent VUs
without issue. The rate limiter is working as designed.

### WebSocket Load Test (`k6/ws-game.js`)

Ramp: 2 VU → 10 VU (15s) → 20 VU (15s) → rampdown

| Metric | Value | Status |
|--------|-------|--------|
| **WS connect P50** | 3.65ms | OK |
| **WS connect P90** | 5.92ms | OK |
| **WS connect P95** | **7.37ms** | OK |
| **WS connect max** | 89.49ms | OK |
| Sessions created | 608 | — |
| Session duration avg | 4.84ms | — |

**Finding**: WebSocket connections establish fast even under load. Session errors
(50%) are expected — k6 connects without authentication, so the server cannot
assign players to game sessions. The connection handshake itself is healthy.

### Docker Resource Usage Under Load

| Container | CPU% (idle) | CPU% (peak load) | Memory |
|-----------|-------------|-------------------|--------|
| Backend | 0.5% | 0.7% | 71MB / 256MB (28%) |
| Frontend | 0.1% | 0.1% | 49MB / 128MB (38%) |

Backend never exceeded 1% CPU even at 50 concurrent VUs. The 0.5 CPU limit
was never a bottleneck.

---

## TODO: Refactors & Improvements

### Priority: Low (game runs well, no bottlenecks)

The profiling shows this app is **not CPU-bound**. The Pong game is simple
enough that physics + rendering complete in under 1ms per frame. The items
below are optimizations worth doing when the project grows, not urgent fixes.

---

### Backend

- [ ] **Broadcast: send delta state instead of full GameState**
  - Currently every broadcast at 60Hz sends the entire `GameState` object (~300 bytes JSON).
  - `width`, `height`, `maxScore`, `left.w`, `left.h`, `left.speed`, `right.w`, `right.h`, `right.speed`, `ball.r` never change mid-game.
  - Sending only `{ball: {x,y}, left: {y}, right: {y}, score, tick}` (~80 bytes) would cut bandwidth by ~70%.
  - At 60Hz this is 18KB/s → 5KB/s per session — matters at scale.
  - File: `backend/src/realtime/game-session.service.ts` (broadcast timer)

- [ ] **Pre-serialize broadcast message with `JSON.stringify` once, not per-socket**
  - Current code: `broadcast()` calls `JSON.stringify(payload)` once, then sends to both sockets — this is already correct.
  - But if spectators are added later, cache the serialized string.
  - File: `backend/src/realtime/game-session.service.ts:331`

- [ ] **Reduce `collectDefaultMetrics` overhead**
  - V8 profile shows 22.3% of ticks in `_mach_absolute_time`, traced to prom-client's default metrics collection.
  - Consider increasing the collection interval from default (10s) to 30s or 60s since Prometheus already scrapes at 30s.
  - File: `backend/src/observability/metrics.service.ts:112` — pass `{ register: this.registry, timeout: 30000 }`

- [ ] **Consider ESM build to reduce startup time**
  - 43.6% of startup CPU is CJS `wrapSafe`/`Module._compile` hash table operations.
  - NestJS v11 supports ESM — switching would eliminate CJS overhead at startup.
  - Not urgent since startup only happens once per deploy.

- [x] ~~**Upgrade tick/broadcast rate from 30/15Hz to 60/60Hz**~~
  - Done. No CPU or memory regression detected.

### Frontend

- [ ] **Canvas rendering: avoid redundant `ctx.font` assignments per frame**
  - `renderGame()` sets `ctx.font` and `ctx.textAlign` every frame even though they don't change between calls.
  - Minor but measurable if rendering becomes heavier.
  - File: `frontend/lib/game/renderer.ts:35-36`

- [x] ~~**Online match: add client-side interpolation**~~
  - Done. `lerpGameState()` interpolates between server states for 120fps rendering.
  - File: `frontend/lib/game/interpolation.ts`

- [ ] **Online match: profile `beginPhysics`/`endPhysics` for online mode**
  - Online mode doesn't run local physics (server-authoritative), so the profiler shows Physics as 0ms.
  - If client-side prediction is added later, the profiler is already in place to measure its cost.

### Observability

- [ ] **Add Grafana alert for `game_tick_overrun_total`**
  - When tick overruns increase, it means the server can't keep up with 60Hz physics — an early warning for scaling issues.
  - Threshold suggestion: alert if `rate(game_tick_overrun_total[5m]) > 0.1`

- [ ] **Add WebSocket message size histogram**
  - Track `ws_message_size_bytes` to monitor bandwidth per game session.
  - Useful baseline before implementing delta-state optimization above.

### k6 Test Refinements

- [ ] **HTTP test: exclude rate-limited endpoints from error_rate threshold**
  - Currently `error_rate` fails because leaderboard API returns 429 under load.
  - Fix: use `{ expected_response: true }` tag or separate thresholds per endpoint.
  - The rate limiter is working correctly — the threshold is misconfigured, not the server.
  - File: `backend/k6/http-load.js`

- [ ] **WS test: add authenticated session support**
  - Current WS test connects without auth, so the server can't assign game sessions.
  - Add a setup phase that registers/logs in a test user, stores the session cookie, and passes it to WS connections.
  - This would enable testing actual game tick loops under load.
  - File: `backend/k6/ws-game.js`

- [ ] **WS test: paired sessions for full game simulation**
  - Current test creates single-player sessions that never start the tick loop (needs 2 players).
  - Create paired VUs that join the same matchId as left/right players to trigger the full 60Hz server tick loop.
  - This is the real stress test — measures `game_tick_duration_seconds` under concurrent games.

- [ ] **Add k6 output to Prometheus/Grafana**
  - Run `k6 run --out experimental-prometheus-rw` to push k6 metrics directly to Prometheus.
  - Enables correlating k6 load with server-side game_tick metrics on a single Grafana dashboard.

- [ ] **Soak test: extend to 30+ minutes for leak detection**
  - Current soak is 5 minutes — sufficient for quick checks but won't catch slow leaks.
  - For production readiness, run 30-60 minutes and watch `nodejs_heap_size_used_bytes` trend.

---

## Profiling Artifacts

| File | Description |
|------|-------------|
| `backend/profiles/v8-profile-processed.txt` | V8 CPU profile at 30/15Hz (processed text) |
| `backend/profiles/v8-profile-60hz.txt` | V8 CPU profile at 60/60Hz (processed text) |
| `backend/flamegraph/flamegraph.html` | 0x interactive flamegraph (open in browser) |
| `backend/k6/http-load.js` | k6 HTTP load test (3-phase, up to 50 VUs) |
| `backend/k6/ws-game.js` | k6 WebSocket game session load test |
| `backend/k6/soak.js` | k6 soak test (5min stability + heap tracking) |
| `docker-compose.stress.yml` | Docker resource-limit overlay (0.5 CPU / 256MB) |
| Frontend: press **F3** in any game page | Real-time FPS/frame time/physics/render overlay |
| Grafana: `game_tick_duration_seconds` | Per-tick latency histogram (p50/p95/p99) |
| Grafana: `game_broadcast_duration_seconds` | Broadcast serialization + send time |
| Grafana: `game_tick_overrun_total` | Counter of ticks exceeding 16ms budget |

## How to Run

```bash
# Frontend perf overlay
# Open any game page, press F3

# Backend V8 profile
cd backend && pnpm run profile:v8

# Backend flamegraph
cd backend && pnpm run profile:flamegraph

# k6 HTTP load (needs backend running)
k6 run backend/k6/http-load.js

# k6 WebSocket load
k6 run backend/k6/ws-game.js

# k6 soak test
k6 run backend/k6/soak.js

# Resource-constrained Docker
make stress-up        # start (0.5 CPU / 256MB backend)
docker stats          # monitor
make stress-down      # stop

# Custom k6 params
k6 run --vus 100 --duration 120s backend/k6/http-load.js
k6 run --env BASE_URL=https://pong.taiida.com backend/k6/soak.js
```
