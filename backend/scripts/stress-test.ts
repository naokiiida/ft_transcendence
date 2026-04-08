/**
 * ゲームサーバー負荷テスト
 *
 * 複数の同時WebSocketゲームセッションをシミュレートし、
 * サーバーの60Hzティックレートが制限リソース下で維持できるか確認する。
 *
 * 使い方:
 *   npx ts-node scripts/stress-test.ts [sessions] [duration_sec]
 *
 * 例:
 *   npx ts-node scripts/stress-test.ts 5 30    # 5セッション × 30秒
 *   npx ts-node scripts/stress-test.ts 10 60   # 10セッション × 60秒
 *
 * 前提: バックエンドが localhost:3001 で動作中
 *       テスト用ユーザーが認証なしでWS接続可能（APIキー認証等）
 *
 * 出力:
 *   - 各セッションの受信レート (state messages/sec)
 *   - レイテンシ統計
 *   - ドロップ/遅延の検出
 */

import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://localhost:3001/api/ws';
const NUM_SESSIONS = parseInt(process.argv[2] || '5', 10);
const DURATION_SEC = parseInt(process.argv[3] || '30', 10);
const TARGET_BROADCAST_HZ = 60;

type SessionStats = {
  matchId: string;
  stateMessages: number;
  firstStateAt: number;
  lastStateAt: number;
  intervals: number[];
  errors: number;
};

function createFakeSession(matchId: string): Promise<SessionStats> {
  return new Promise((resolve) => {
    const stats: SessionStats = {
      matchId,
      stateMessages: 0,
      firstStateAt: 0,
      lastStateAt: 0,
      intervals: [],
      errors: 0,
    };

    let lastMsgTime = 0;

    const ws = new WebSocket(`${WS_URL}?matchId=${matchId}`);

    ws.on('open', () => {
      // Join as left player
      ws.send(JSON.stringify({ type: 'join', matchId }));

      // Send periodic input and pings
      const inputTimer = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'input', up: Math.random() > 0.5, down: Math.random() > 0.5, seq: Date.now() }));
      }, 50);

      const pingTimer = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'ping' }));
      }, 2000);

      setTimeout(() => {
        clearInterval(inputTimer);
        clearInterval(pingTimer);
        ws.close();
      }, DURATION_SEC * 1000);
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'state') {
          const now = performance.now();
          stats.stateMessages++;
          if (stats.firstStateAt === 0) stats.firstStateAt = now;
          stats.lastStateAt = now;
          if (lastMsgTime > 0) {
            stats.intervals.push(now - lastMsgTime);
          }
          lastMsgTime = now;
        }
      } catch {
        stats.errors++;
      }
    });

    ws.on('error', () => {
      stats.errors++;
    });

    ws.on('close', () => {
      resolve(stats);
    });
  });
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

async function main() {
  console.log(`\n=== Pong Server Stress Test ===`);
  console.log(`  Sessions:  ${NUM_SESSIONS}`);
  console.log(`  Duration:  ${DURATION_SEC}s`);
  console.log(`  Target:    ${TARGET_BROADCAST_HZ}Hz broadcast`);
  console.log(`  Server:    ${WS_URL}`);
  console.log(`\nStarting sessions...\n`);

  // Note: この簡易テストでは実際の2人対戦セッションではなく、
  // 1人だけjoinした状態のセッションを大量に作る。
  // サーバーはjoinTimeout (60s)後にabortするが、
  // その前にstartはしない（2人揃わないため）。
  //
  // 実際のtickループをテストするには、各セッションに2クライアント必要。
  // ここではWebSocket接続+メッセージ処理のオーバーヘッドを計測する。

  const matchIds = Array.from({ length: NUM_SESSIONS }, (_, i) => `stress-test-${i}-${Date.now()}`);
  const promises = matchIds.map((id) => createFakeSession(id));

  const results = await Promise.all(promises);

  console.log(`\n=== Results ===\n`);
  console.log(`${'Match'.padEnd(40)} ${'Msgs'.padStart(6)} ${'Hz'.padStart(8)} ${'Avg(ms)'.padStart(10)} ${'P95(ms)'.padStart(10)} ${'P99(ms)'.padStart(10)} ${'Errs'.padStart(6)}`);
  console.log('-'.repeat(90));

  let totalMessages = 0;
  let totalErrors = 0;
  const allIntervals: number[] = [];

  for (const s of results) {
    const sorted = [...s.intervals].sort((a, b) => a - b);
    const durationMs = s.lastStateAt - s.firstStateAt;
    const hz = durationMs > 0 ? (s.stateMessages / (durationMs / 1000)).toFixed(1) : '0';
    const avg = sorted.length > 0 ? (sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(1) : '-';
    const p95 = percentile(sorted, 0.95).toFixed(1);
    const p99 = percentile(sorted, 0.99).toFixed(1);

    console.log(`${s.matchId.padEnd(40)} ${String(s.stateMessages).padStart(6)} ${hz.padStart(8)} ${avg.padStart(10)} ${p95.padStart(10)} ${p99.padStart(10)} ${String(s.errors).padStart(6)}`);

    totalMessages += s.stateMessages;
    totalErrors += s.errors;
    allIntervals.push(...s.intervals);
  }

  console.log('-'.repeat(90));

  const sortedAll = [...allIntervals].sort((a, b) => a - b);
  const globalAvg = sortedAll.length > 0 ? (sortedAll.reduce((a, b) => a + b, 0) / sortedAll.length).toFixed(1) : '-';
  const targetIntervalMs = 1000 / TARGET_BROADCAST_HZ;
  const overruns = sortedAll.filter((i) => i > targetIntervalMs * 1.5).length;
  const overrunPct = sortedAll.length > 0 ? ((overruns / sortedAll.length) * 100).toFixed(1) : '0';

  console.log(`\nSummary:`);
  console.log(`  Total state messages: ${totalMessages}`);
  console.log(`  Total errors:         ${totalErrors}`);
  console.log(`  Global avg interval:  ${globalAvg}ms (target: ${targetIntervalMs.toFixed(1)}ms)`);
  console.log(`  Global P95:           ${percentile(sortedAll, 0.95).toFixed(1)}ms`);
  console.log(`  Global P99:           ${percentile(sortedAll, 0.99).toFixed(1)}ms`);
  console.log(`  Overruns (>1.5x):     ${overruns} / ${sortedAll.length} (${overrunPct}%)`);
  console.log(`\n  Note: Sessions without 2 players won't start the tick loop.`);
  console.log(`  For full load testing, use the paired variant or play manually.\n`);
}

main().catch(console.error);
