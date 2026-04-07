/**
 * パフォーマンスオーバーレイ
 *
 * Canvas上にFPS、フレーム時間グラフ、フレームグラフ風の内訳表示を描画する。
 * F3キーでトグル。
 */

import type { GameProfiler, FrameSample, ProfileStats } from "./profiler";

const OVERLAY_X = 8;
const OVERLAY_Y = 56; // スコア表示の下
const GRAPH_W = 180;
const GRAPH_H = 50;
const BAR_W = 1;
const MAX_MS = 33.3; // 30fps基準

const BG_COLOR = "rgba(0, 0, 0, 0.75)";
const TEXT_COLOR = "#00ff88";
const WARNING_COLOR = "#ffaa00";
const CRITICAL_COLOR = "#ff4444";
const PHYSICS_COLOR = "#4488ff";
const RENDER_COLOR = "#ff8844";
const OTHER_COLOR = "#888888";
const GRID_COLOR = "rgba(255, 255, 255, 0.1)";

function fpsColor(fps: number): string {
  if (fps >= 55) return TEXT_COLOR;
  if (fps >= 30) return WARNING_COLOR;
  return CRITICAL_COLOR;
}

function msColor(ms: number): string {
  if (ms <= 8) return TEXT_COLOR;
  if (ms <= 16.7) return WARNING_COLOR;
  return CRITICAL_COLOR;
}

export function renderPerfOverlay(
  ctx: CanvasRenderingContext2D,
  profiler: GameProfiler,
) {
  if (!profiler.isEnabled) return;

  const stats = profiler.getStats();
  const history = profiler.getHistory();

  ctx.save();

  // --- 統計テキスト ---
  const panelW = 200;
  const panelH = 160;
  ctx.fillStyle = BG_COLOR;
  ctx.roundRect(OVERLAY_X, OVERLAY_Y, panelW, panelH, 4);
  ctx.fill();

  ctx.font = "11px 'Courier New', monospace";
  ctx.textAlign = "left";

  let y = OVERLAY_Y + 14;
  const x = OVERLAY_X + 6;
  const lineH = 13;

  // FPS
  ctx.fillStyle = fpsColor(stats.fps);
  ctx.fillText(`FPS: ${stats.fps}`, x, y);
  y += lineH;

  // Frame time
  ctx.fillStyle = msColor(stats.avgFrameMs);
  ctx.fillText(`Frame: ${stats.avgFrameMs.toFixed(2)}ms`, x, y);
  y += lineH;

  // Physics
  ctx.fillStyle = PHYSICS_COLOR;
  ctx.fillText(`Physics: ${stats.avgPhysicsMs.toFixed(2)}ms`, x, y);
  y += lineH;

  // Render
  ctx.fillStyle = RENDER_COLOR;
  ctx.fillText(`Render: ${stats.avgRenderMs.toFixed(2)}ms`, x, y);
  y += lineH;

  // P95 / P99
  ctx.fillStyle = msColor(stats.p95FrameMs);
  ctx.fillText(
    `P95: ${stats.p95FrameMs.toFixed(1)}ms  P99: ${stats.p99FrameMs.toFixed(1)}ms`,
    x,
    y,
  );
  y += lineH;

  // Dropped frames
  const dropRate =
    stats.totalFrames > 0
      ? ((stats.droppedFrames / stats.totalFrames) * 100).toFixed(1)
      : "0.0";
  ctx.fillStyle =
    stats.droppedFrames > 0 ? WARNING_COLOR : TEXT_COLOR;
  ctx.fillText(
    `Dropped: ${stats.droppedFrames} (${dropRate}%)`,
    x,
    y,
  );
  y += lineH + 4;

  // --- フレーム時間グラフ ---
  renderFrameGraph(ctx, history, x, y);
  y += GRAPH_H + 6;

  // --- フレームグラフ風 内訳バー ---
  renderFlamebar(ctx, stats, x, y);

  ctx.restore();
}

function renderFrameGraph(
  ctx: CanvasRenderingContext2D,
  history: readonly FrameSample[],
  gx: number,
  gy: number,
) {
  // 背景
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(gx, gy, GRAPH_W, GRAPH_H);

  // グリッドライン (16.7ms = 60fps, 33.3ms = 30fps)
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 0.5;
  for (const threshold of [16.7, 33.3]) {
    const lineY = gy + GRAPH_H - (threshold / MAX_MS) * GRAPH_H;
    if (lineY >= gy) {
      ctx.beginPath();
      ctx.moveTo(gx, lineY);
      ctx.lineTo(gx + GRAPH_W, lineY);
      ctx.stroke();
    }
  }

  // ラベル
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "8px monospace";
  ctx.textAlign = "right";
  ctx.fillText("60fps", gx + GRAPH_W - 2, gy + GRAPH_H - (16.7 / MAX_MS) * GRAPH_H - 1);
  ctx.fillText("30fps", gx + GRAPH_W - 2, gy + GRAPH_H - (33.3 / MAX_MS) * GRAPH_H - 1);

  // スタックドバー (Physics + Render + Other)
  const startIdx = Math.max(0, history.length - GRAPH_W);
  for (let i = startIdx; i < history.length; i++) {
    const sample = history[i];
    const barX = gx + (i - startIdx) * BAR_W;

    const physH = Math.min((sample.physicsMs / MAX_MS) * GRAPH_H, GRAPH_H);
    const renderH = Math.min((sample.renderMs / MAX_MS) * GRAPH_H, GRAPH_H - physH);
    const otherMs = Math.max(0, sample.totalMs - sample.physicsMs - sample.renderMs);
    const otherH = Math.min((otherMs / MAX_MS) * GRAPH_H, GRAPH_H - physH - renderH);

    let barY = gy + GRAPH_H;

    // Physics (下)
    ctx.fillStyle = PHYSICS_COLOR;
    ctx.fillRect(barX, barY - physH, BAR_W, physH);
    barY -= physH;

    // Render (中)
    ctx.fillStyle = RENDER_COLOR;
    ctx.fillRect(barX, barY - renderH, BAR_W, renderH);
    barY -= renderH;

    // Other (上)
    ctx.fillStyle = OTHER_COLOR;
    ctx.fillRect(barX, barY - otherH, BAR_W, otherH);
  }
}

function renderFlamebar(
  ctx: CanvasRenderingContext2D,
  stats: ProfileStats,
  fx: number,
  fy: number,
) {
  const barH = 14;
  const totalW = GRAPH_W;

  if (stats.avgFrameMs <= 0) return;

  const physFrac = stats.avgPhysicsMs / stats.avgFrameMs;
  const renderFrac = stats.avgRenderMs / stats.avgFrameMs;

  const physW = Math.round(physFrac * totalW);
  const renderW = Math.round(renderFrac * totalW);
  const otherW = totalW - physW - renderW;

  let bx = fx;

  // Physics
  ctx.fillStyle = PHYSICS_COLOR;
  ctx.fillRect(bx, fy, physW, barH);
  if (physW > 30) {
    ctx.fillStyle = "#fff";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("physics", bx + physW / 2, fy + 10);
  }
  bx += physW;

  // Render
  ctx.fillStyle = RENDER_COLOR;
  ctx.fillRect(bx, fy, renderW, barH);
  if (renderW > 30) {
    ctx.fillStyle = "#fff";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("render", bx + renderW / 2, fy + 10);
  }
  bx += renderW;

  // Other
  if (otherW > 0) {
    ctx.fillStyle = OTHER_COLOR;
    ctx.fillRect(bx, fy, otherW, barH);
    if (otherW > 30) {
      ctx.fillStyle = "#fff";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("other", bx + otherW / 2, fy + 10);
    }
  }
}
