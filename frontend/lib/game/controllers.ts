//　入力生成 統一的なインターフェースと、CPUモードのロジック

import type { GameState, InputState } from "./state";

// AI難易度設定
export type AiDifficultyConfig = {
  name: string;
  reactionDelayMs: number;
  decisionIntervalMs: number;
  aimNoisePx: number;
  missChance: number;
  deadZonePx: number;
};

// DEFAULT_AI_CONFIGS のキー（"easy" | "medium" | ...）を型として再利用。
export type AiDifficultyId = keyof typeof DEFAULT_AI_CONFIGS;

// 隠し難易度の解放フラグ。将来増えることを想定してオブジェクト型にしている。
export type AiUnlockState = {
  europeanHard: boolean;
};

export const DEFAULT_AI_UNLOCKS: AiUnlockState = {
  europeanHard: false,
};

// 既定のAI難易度設定
export const DEFAULT_AI_CONFIGS: Record<
  "easy" | "medium" | "hard" | "EuropeanHard",
  AiDifficultyConfig
> = {
  easy: {
    name: "Easy",
    reactionDelayMs: 120, //反応速度
    decisionIntervalMs: 140, //判断間隔
    aimNoisePx: 18, //照準ノイズ
    missChance: 0.5, //ミス確率
    deadZonePx: 10, //デッドゾーンとは、パドル中央からの距離がこの値以内なら入力しない設定。小さいほどシビアで、難易度が上がる。
  },
  medium: {
    name: "Medium",
    reactionDelayMs: 70, //反応速度
    decisionIntervalMs: 90, //判断間隔
    aimNoisePx: 12, //照準ノイズ
    missChance: 0.25, //ミス確率
    deadZonePx: 8, //デッドゾーン
  },
  hard: {
    name: "Hard",
    reactionDelayMs: 40, //反応速度
    decisionIntervalMs: 70, //判断間隔
    aimNoisePx: 6, //照準ノイズ
    missChance: 0.1, //ミス確率
    deadZonePx: 5, //デッドゾーン
  },
  EuropeanHard: {
    name: "European Hard",
    reactionDelayMs: 40, //反応速度
    decisionIntervalMs: 70, //判断間隔
    aimNoisePx: 6, //照準ノイズ
    missChance: 0.02, //ミス確率
    deadZonePx: 5, //デッドゾーン
  },
};

// UI表示用の難易度一覧。hidden は未解放の場合に非表示。
const AI_LEVELS: Array<{
  id: AiDifficultyId;
  hidden?: boolean;
  unlockKey?: keyof AiUnlockState;
}> = [
  { id: "easy" },
  { id: "medium" },
  { id: "hard" },
  { id: "EuropeanHard", hidden: true, unlockKey: "europeanHard" },
];

// 解放済みの難易度だけを返すユーティリティ。
export function getAvailableAiLevels(unlocks: AiUnlockState) {
  return AI_LEVELS.filter((level) => {
    if (!level.hidden) return true;
    if (!level.unlockKey) return false;
    return unlocks[level.unlockKey];
  });
}

// バー入力を生成する戦略（人/AI/リモート）、将来性を考慮したインターフェース。
export interface PaddleController {
  // dt: 前回フレームからの経過時間（秒）
  getInput(state: GameState, dt: number): InputState;
}

// 外部入力（キーボード等）をそのまま渡すラッパー。
export class HumanController implements PaddleController {
  // 外部入力をそのまま保持して返すだけ。
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
  // ms単位で内部時間を管理（dt は秒なので変換が必要）。
  private elapsedMs = 0; // 経過時間の累計
  private lastDecisionMs = 0; // 最後に判断を下した時間(判断を間引くため)
  private activeInput: InputState = { up: false, down: false }; // 現在出している入力
  private pendingInput: InputState = { up: false, down: false }; // 次に出す予定の入力
  private pendingReadyAt = 0; // 人間らしく少し遅延させるための時間

  constructor(
    private config: AiDifficultyConfig,
    private side: "left" | "right" = "right", // 操作するバーの側
  ) {}

  // ゲーム状態に基づいて入力を生成。
  getInput(state: GameState, dt: number) {
    // dt(秒) -> ms 変換。AIの各種設定がms単位なので合わせる。
    this.elapsedMs += dt * 1000; // msに変換して加算

    // 遅延時間が経過したら、保留中の入力をアクティブにする。
    if (this.elapsedMs >= this.pendingReadyAt) {
      this.activeInput = this.pendingInput;
      this.pendingReadyAt = 0;
    }

    // 指定の判断間隔ごとに新しい入力を決定する。
    if (
      this.elapsedMs - this.lastDecisionMs >=
      this.config.decisionIntervalMs
    ) {
      this.lastDecisionMs = this.elapsedMs;
      const paddle = state[this.side];
      // パドル中央を基準に上下どちらに動くか判断する。
      const paddleCenter = paddle.y + paddle.h / 2;
      const targetY = this.getTargetY(state); // ノイズ付き目標Y座標
      let input: InputState = { up: false, down: false };

      // 目標に基づいて上下の入力を決定。
      if (targetY > paddleCenter + this.config.deadZonePx) {
        input.down = true;
      } else if (targetY < paddleCenter - this.config.deadZonePx) {
        input.up = true;
      }
      if (Math.random() < this.config.missChance) {
        input = { up: false, down: false };
      }
      // 新しい入力を保留し、反応遅延時間後にアクティブにする。
      this.pendingInput = input;
      this.pendingReadyAt = this.elapsedMs + this.config.reactionDelayMs;
    }

    return this.activeInput;
  }

  // 目標Y座標を取得（ノイズ付き）。
  private getTargetY(state: GameState) {
    // 照準ブレを付与して「完璧すぎない」挙動にする。
    const noise = (Math.random() * 2 - 1) * this.config.aimNoisePx;
    return state.ball.y + noise;
  }
}
