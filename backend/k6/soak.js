/**
 * k6 ソークテスト (長時間安定性テスト)
 *
 * 低〜中負荷を5分間維持し、メモリリーク・GC圧力・レイテンシ劣化を検出。
 *
 * 使い方:
 *   k6 run backend/k6/soak.js
 *   k6 run --env BASE_URL=http://localhost:3001 backend/k6/soak.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";

const healthTrend = new Trend("health_over_time", true);

export const options = {
  scenarios: {
    soak: {
      executor: "constant-vus",
      vus: 10,
      duration: "5m",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"],
    "health_over_time": ["p(99)<300"],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  healthTrend.add(res.timings.duration);

  check(res, {
    "status 200": (r) => r.status === 200,
  });

  // メモリ使用量も定期チェック
  if (__ITER % 50 === 0) {
    const metrics = http.get(`${BASE_URL}/api/metrics`);
    const heapMatch = metrics.body.match(
      /nodejs_heap_size_used_bytes (\d+)/,
    );
    if (heapMatch) {
      const heapMB = parseInt(heapMatch[1]) / 1024 / 1024;
      console.log(
        `[VU${__VU}] iter=${__ITER} heap=${heapMB.toFixed(1)}MB latency=${res.timings.duration.toFixed(1)}ms`,
      );
    }
  }

  sleep(0.5);
}
