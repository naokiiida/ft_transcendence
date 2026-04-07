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
- **Render**: 0.20ms avg — Canvas 2D is very efficient for Pong
- **P95/P99**: 0.8ms / 0.8ms — no tail latency spikes
- **Dropped frames**: 0 (0.0%)

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
- Runtime is idle — Pong physics is trivially cheap at 30Hz tick rate
- No hot application-level functions visible

---

## TODO: Refactors & Improvements

### Priority: Low (game runs well, no bottlenecks)

The profiling shows this app is **not CPU-bound**. The Pong game is simple enough that physics + rendering complete in under 1ms per frame. The items below are optimizations worth doing when the project grows, not urgent fixes.

---

### Backend

- [ ] **Broadcast: send delta state instead of full GameState**
  - Currently every broadcast at 15Hz sends the entire `GameState` object (~300 bytes JSON).
  - `width`, `height`, `maxScore`, `left.w`, `left.h`, `left.speed`, `right.w`, `right.h`, `right.speed`, `ball.r` never change mid-game.
  - Sending only `{ball: {x,y}, left: {y}, right: {y}, score, tick}` (~80 bytes) would cut bandwidth by ~70%.
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

### Frontend

- [ ] **Canvas rendering: avoid redundant `ctx.font` assignments per frame**
  - `renderGame()` sets `ctx.font` and `ctx.textAlign` every frame even though they don't change between calls.
  - Minor but measurable if rendering becomes heavier.
  - File: `frontend/lib/game/renderer.ts:35-36`

- [ ] **Online match: add client-side interpolation**
  - Currently the online client renders the raw server state at 15Hz broadcast rate, creating visual stutter.
  - Interpolating between the last two server states would make motion appear smoother at 60fps.
  - Files: `frontend/app/game/online/match/online-match-client.tsx:165`

- [ ] **Online match: profile `beginPhysics`/`endPhysics` for online mode**
  - Online mode doesn't run local physics (server-authoritative), so the profiler shows Physics as 0ms.
  - If client-side prediction is added later, the profiler is already in place to measure its cost.

### Observability

- [ ] **Add Grafana alert for `game_tick_overrun_total`**
  - When tick overruns increase, it means the server can't keep up with 30Hz physics — an early warning for scaling issues.
  - Threshold suggestion: alert if `rate(game_tick_overrun_total[5m]) > 0.1`

- [ ] **Add WebSocket message size histogram**
  - Track `ws_message_size_bytes` to monitor bandwidth per game session.
  - Useful baseline before implementing delta-state optimization above.

---

## Profiling Artifacts

| File | Description |
|------|-------------|
| `backend/profiles/v8-profile-processed.txt` | V8 CPU profile (processed text) |
| `backend/flamegraph/flamegraph.html` | 0x interactive flamegraph (open in browser) |
| Frontend: press **F3** in any game page | Real-time FPS/frame time/physics/render overlay |
| Grafana: `game_tick_duration_seconds` | Per-tick latency histogram (p50/p95/p99) |
| Grafana: `game_broadcast_duration_seconds` | Broadcast serialization + send time |
| Grafana: `game_tick_overrun_total` | Counter of ticks exceeding 33ms budget |
