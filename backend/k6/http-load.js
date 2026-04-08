/**
 * k6 HTTP負荷テスト
 *
 * バックエンドのHTTPエンドポイントに対する負荷テスト。
 * Health check、Metrics、Users APIのレイテンシとスループットを計測。
 *
 * 使い方:
 *   k6 run backend/k6/http-load.js
 *   k6 run --vus 50 --duration 60s backend/k6/http-load.js
 *   k6 run --env BASE_URL=https://pong.taiida.com backend/k6/http-load.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";

// カスタムメトリクス
const healthLatency = new Trend("health_latency", true);
const metricsLatency = new Trend("metrics_latency", true);
const errorRate = new Rate("error_rate");

// テストシナリオ
export const options = {
  scenarios: {
    // ステージ1: ウォームアップ
    warmup: {
      executor: "constant-vus",
      vus: 5,
      duration: "10s",
      startTime: "0s",
      tags: { phase: "warmup" },
    },
    // ステージ2: 通常負荷
    normal: {
      executor: "constant-vus",
      vus: 20,
      duration: "20s",
      startTime: "10s",
      tags: { phase: "normal" },
    },
    // ステージ3: ピーク負荷
    peak: {
      executor: "ramping-vus",
      startVUs: 20,
      stages: [
        { duration: "10s", target: 50 },
        { duration: "10s", target: 50 },
        { duration: "5s", target: 0 },
      ],
      startTime: "30s",
      tags: { phase: "peak" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"],
    health_latency: ["p(95)<100", "p(99)<200"],
    error_rate: ["rate<0.01"],
  },
};

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  healthLatency.add(healthRes.timings.duration);
  check(healthRes, {
    "health: status 200": (r) => r.status === 200,
    "health: body has status": (r) => r.json().status === "healthy",
  }) || errorRate.add(1);

  sleep(0.1);

  // Metrics endpoint
  const metricsRes = http.get(`${BASE_URL}/api/metrics`);
  metricsLatency.add(metricsRes.timings.duration);
  check(metricsRes, {
    "metrics: status 200": (r) => r.status === 200,
    "metrics: has game_tick": (r) =>
      r.body.includes("game_tick_duration_seconds"),
  }) || errorRate.add(1);

  sleep(0.1);

  // Leaderboard (public API)
  const leaderboardRes = http.get(`${BASE_URL}/api/users/leaderboard`);
  check(leaderboardRes, {
    "leaderboard: status 200": (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(0.2);
}
