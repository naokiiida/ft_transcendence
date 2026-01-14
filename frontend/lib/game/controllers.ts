//　入力生成 統一的なインターフェースと、CPUモードのロジック

import type { GameState, InputState } from "./engine";

// AI難易度設定
export type AiDifficultyConfig = {
  name: string;
  reactionDelayMs: number;
  decisionIntervalMs: number;
  aimNoisePx: number;
  missChance: number;
  deadZonePx: number;
};

// 既定のAI難易度設定
export const DEFAULT_AI_CONFIGS: Record<
  "easy" | "medium" | "hard",
  AiDifficultyConfig
> = {
  easy: {
    name: "Easy",
    reactionDelayMs: 180,
    decisionIntervalMs: 120,
    aimNoisePx: 24,
    missChance: 0.15,
    deadZonePx: 10,
  },
  medium: {
    name: "Medium",
    reactionDelayMs: 90,
    decisionIntervalMs: 80,
    aimNoisePx: 12,
    missChance: 0.05,
    deadZonePx: 8,
  },
  hard: {
    name: "Hard",
    reactionDelayMs: 40,
    decisionIntervalMs: 50,
    aimNoisePx: 4,
    missChance: 0.01,
    deadZonePx: 6,
  },
};

// バー入力を生成する戦略（人/AI/リモート）、将来性を考慮したインターフェース。
export interface PaddleController {
  getInput(state: GameState, dt: number): InputState;
}

// 外部入力（キーボード等）をそのまま渡すラッパー。
export class HumanController implements PaddleController {
  private input: InputState;

  constructor(input: InputState) {
    this.input = input;
  }

  getInput(_state: GameState, _dt: number) {
    return this.input;
  }
}

// 難易度設定で動作するAIコントローラ。
export class AIController implements PaddleController {
  private elapsedMs = 0; // 経過時間の累計
  private lastDecisionMs = 0; // 最後に判断を下した時間(判断を間引くため)
  private pendingInput: InputState = { up: false, down: false }; // 次に出す予定の入力
  private pendingReadyAt = 0; // 人間らしく少し遅延させるための時間

  constructor(
    private config: AiDifficultyConfig,
    private side: "player" | "cpu" = "cpu" // 操作するバーの側
  ) {}

  // ゲーム状態に基づいて入力を生成。
  getInput(state: GameState, dt: number) {
    this.elapsedMs += dt * 1000;
    // 一定間隔で判断を下す。
    if (
      this.elapsedMs - this.lastDecisionMs >=
      this.config.decisionIntervalMs
    ) {
      this.lastDecisionMs = this.elapsedMs;
      const paddle = state[this.side];
      const targetY = this.getTargetY(state); // ノイズ付き目標Y座標
      let input: InputState = { up: false, down: false };
      if (targetY > paddle.y + this.config.deadZonePx) {
        input.down = true;
      } else if (targetY < paddle.y - this.config.deadZonePx) {
        input.up = true;
      }
      if (Math.random() < this.config.missChance) {
        input = { up: false, down: false };
      }
      this.pendingInput = input;
      this.pendingReadyAt = this.elapsedMs + this.config.reactionDelayMs;
    }
    if (this.elapsedMs < this.pendingReadyAt) {
      return { up: false, down: false };
    }
    return this.pendingInput;
  }

  // 目標Y座標を取得（ノイズ付き）。
  private getTargetY(state: GameState) {
    const noise = (Math.random() * 2 - 1) * this.config.aimNoisePx;
    return state.ball.y + noise;
  }
}
