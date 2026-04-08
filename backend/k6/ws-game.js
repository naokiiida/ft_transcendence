/**
 * k6 WebSocket ゲームセッション負荷テスト
 *
 * WebSocket接続を大量に作成し、ゲームセッションの入力送信・状態受信・
 * ハートビートをシミュレートして60Hzティックレートの安定性を計測。
 *
 * 使い方:
 *   k6 run backend/k6/ws-game.js
 *   k6 run --vus 20 --duration 30s backend/k6/ws-game.js
 *   k6 run --env WS_URL=wss://pong.taiida.com/api/ws backend/k6/ws-game.js
 */

import ws from "k6/ws";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const WS_URL = __ENV.WS_URL || "ws://localhost:3001/api/ws";

// カスタムメトリクス
const wsMessageInterval = new Trend("ws_message_interval", true);
const wsStateMessages = new Counter("ws_state_messages");
const wsErrors = new Counter("ws_errors");
const wsConnectionRate = new Rate("ws_connection_success");

export const options = {
  scenarios: {
    // 同時接続ユーザーを段階的に増加
    ws_sessions: {
      executor: "ramping-vus",
      startVUs: 2,
      stages: [
        { duration: "5s", target: 10 },
        { duration: "15s", target: 10 },
        { duration: "5s", target: 20 },
        { duration: "15s", target: 20 },
        { duration: "5s", target: 0 },
      ],
    },
  },
  thresholds: {
    ws_connection_success: ["rate>0.9"],
    ws_errors: ["count<50"],
  },
};

export default function () {
  const matchId = `k6-${__VU}-${__ITER}-${Date.now()}`;
  const url = `${WS_URL}?matchId=${matchId}`;

  let lastMsgTime = 0;

  ws.connect(url, {}, function (socket) {
    socket.on("open", function () {
      wsConnectionRate.add(1);

      // Join
      socket.send(JSON.stringify({ type: "join", matchId }));

      // 入力を定期送信 (60Hz想定)
      socket.setInterval(function () {
        socket.send(
          JSON.stringify({
            type: "input",
            up: Math.random() > 0.5,
            down: Math.random() > 0.5,
            seq: Date.now(),
          }),
        );
      }, 16);

      // Heartbeat ping (2秒毎)
      socket.setInterval(function () {
        socket.send(JSON.stringify({ type: "ping" }));
      }, 2000);

      // 15秒後に切断
      socket.setTimeout(function () {
        socket.close();
      }, 15000);
    });

    socket.on("message", function (data) {
      try {
        const msg = JSON.parse(data);
        if (msg.type === "state") {
          wsStateMessages.add(1);
          const now = Date.now();
          if (lastMsgTime > 0) {
            wsMessageInterval.add(now - lastMsgTime);
          }
          lastMsgTime = now;
        }
      } catch (e) {
        wsErrors.add(1);
      }
    });

    socket.on("error", function () {
      wsErrors.add(1);
      wsConnectionRate.add(0);
    });

    socket.on("close", function () {
      // 接続完了
    });
  });

  sleep(1);
}
