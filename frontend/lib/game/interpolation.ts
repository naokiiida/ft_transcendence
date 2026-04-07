/**
 * クライアントサイド状態補間
 *
 * サーバーから60Hzで受信した状態を、120fpsの描画フレーム間で
 * 線形補間してスムーズな動きを実現する。
 */

import type { GameState } from "./state";

/**
 * 2つのGameState間を線形補間して新しいGameStateを返す。
 * t=0 で prev、t=1 で next を返す。t>1 は外挿（予測）。
 */
export function lerpGameState(
  prev: GameState,
  next: GameState,
  t: number,
): GameState {
  const clamped = Math.max(0, Math.min(t, 1.5)); // 外挿は1.5倍まで

  return {
    ...next,
    left: {
      ...next.left,
      y: lerp(prev.left.y, next.left.y, clamped),
    },
    right: {
      ...next.right,
      y: lerp(prev.right.y, next.right.y, clamped),
    },
    ball: {
      ...next.ball,
      x: lerp(prev.ball.x, next.ball.x, clamped),
      y: lerp(prev.ball.y, next.ball.y, clamped),
    },
    // score, gameOver, winner はスナップショット（補間しない）
    score: next.score,
    gameOver: next.gameOver,
    winner: next.winner,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
