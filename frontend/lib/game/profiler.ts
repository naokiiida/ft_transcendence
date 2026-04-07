/**
 * ゲームループ パフォーマンスプロファイラー
 *
 * フレーム時間、物理演算時間、描画時間を計測し、
 * リアルタイムの統計情報とフレーム履歴を提供する。
 */

export type FrameSample = {
  timestamp: number;
  totalMs: number;
  physicsMs: number;
  renderMs: number;
};

export type ProfileStats = {
  fps: number;
  avgFrameMs: number;
  avgPhysicsMs: number;
  avgRenderMs: number;
  maxFrameMs: number;
  p95FrameMs: number;
  p99FrameMs: number;
  droppedFrames: number;
  totalFrames: number;
};

const HISTORY_SIZE = 300; // ~5秒分 (60fps)
const STATS_WINDOW = 60; // 直近60フレームで統計計算
const DROPPED_FRAME_THRESHOLD_MS = 20; // 20ms以上 = ドロップフレーム

export class GameProfiler {
  private history: FrameSample[] = [];
  private droppedFrames = 0;
  private totalFrames = 0;
  private enabled = false;

  // 現在のフレーム計測用
  private frameStart = 0;
  private physicsStart = 0;
  private physicsEnd = 0;
  private renderStart = 0;
  private renderEnd = 0;

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  get isEnabled() {
    return this.enabled;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  reset() {
    this.history = [];
    this.droppedFrames = 0;
    this.totalFrames = 0;
  }

  /** フレーム開始時に呼ぶ */
  beginFrame() {
    if (!this.enabled) return;
    this.frameStart = performance.now();
  }

  /** 物理演算の前後で呼ぶ */
  beginPhysics() {
    if (!this.enabled) return;
    this.physicsStart = performance.now();
  }

  endPhysics() {
    if (!this.enabled) return;
    this.physicsEnd = performance.now();
  }

  /** 描画の前後で呼ぶ */
  beginRender() {
    if (!this.enabled) return;
    this.renderStart = performance.now();
  }

  endRender() {
    if (!this.enabled) return;
    this.renderEnd = performance.now();
  }

  /** フレーム終了時に呼ぶ。サンプルを記録する */
  endFrame() {
    if (!this.enabled) return;

    const now = performance.now();
    const totalMs = now - this.frameStart;
    const physicsMs = this.physicsEnd - this.physicsStart;
    const renderMs = this.renderEnd - this.renderStart;

    const sample: FrameSample = {
      timestamp: now,
      totalMs,
      physicsMs: Math.max(0, physicsMs),
      renderMs: Math.max(0, renderMs),
    };

    this.history.push(sample);
    if (this.history.length > HISTORY_SIZE) {
      this.history.shift();
    }

    this.totalFrames++;
    if (totalMs > DROPPED_FRAME_THRESHOLD_MS) {
      this.droppedFrames++;
    }
  }

  /** 直近のフレーム履歴を取得 */
  getHistory(): readonly FrameSample[] {
    return this.history;
  }

  /** 統計情報を計算 */
  getStats(): ProfileStats {
    const window = this.history.slice(-STATS_WINDOW);
    if (window.length === 0) {
      return {
        fps: 0,
        avgFrameMs: 0,
        avgPhysicsMs: 0,
        avgRenderMs: 0,
        maxFrameMs: 0,
        p95FrameMs: 0,
        p99FrameMs: 0,
        droppedFrames: this.droppedFrames,
        totalFrames: this.totalFrames,
      };
    }

    const frameTimes = window.map((s) => s.totalMs);
    const sorted = [...frameTimes].sort((a, b) => a - b);

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    // FPS: 直近ウィンドウの時間幅から計算
    const timeSpanMs =
      window[window.length - 1].timestamp - window[0].timestamp;
    const fps = timeSpanMs > 0 ? ((window.length - 1) / timeSpanMs) * 1000 : 0;

    return {
      fps: Math.round(fps),
      avgFrameMs: sum(frameTimes) / frameTimes.length,
      avgPhysicsMs:
        sum(window.map((s) => s.physicsMs)) / window.length,
      avgRenderMs:
        sum(window.map((s) => s.renderMs)) / window.length,
      maxFrameMs: Math.max(...frameTimes),
      p95FrameMs: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      p99FrameMs: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
      droppedFrames: this.droppedFrames,
      totalFrames: this.totalFrames,
    };
  }
}
