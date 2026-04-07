# Performance Profiling Findings & TODO

Date: 2026-04-08

## Profiling Summary

### Frontend (Canvas Game Loop)
- **FPS**: 185+ fps on Local PvP, well above 60fps target
- **Frame time**: 0.48ms avg (budget: 16.7ms at 60fps) — **97% headroom**
- **Physics**: 0.02ms avg — negligible cost
- **Render**: 0.20ms avg — Canvas 2D is very efficient for Pong
- **P95/P99**: 0.8ms / 0.8ms — no tail latency spikes
- **Dropped frames**: 0 (0.0%)

### Backend (V8 CPU Profile, 431 ticks)
- **JavaScript**: 4.2% of CPU — almost no time in user JS code
- **C++ (V8 internals)**: 87.5% — dominated by module loading at startup
- **GC**: 2.6% — healthy, no pressure
- **Top hotspot**: `__hash_table::~__hash_table()` at 43.6% — V8 internal hash map teardown during CJS module compilation (`wrapSafe` → `Module._compile`)
- **Second hotspot**: `_mach_absolute_time` at 22.3% — system time calls (prom-client `collectDefaultMetrics`)

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
