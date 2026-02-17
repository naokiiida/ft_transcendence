//エンジンから組み合わせを分離するマッチ層。
//様々な組み合わせを、共通したインターフェースで扱う。

import type { GameState, InputState } from "./state";
import { PongEngine } from "./engine";
import type { AiDifficultyConfig, PaddleController } from "./controllers";
import { AIController, HumanController } from "./controllers";

// エンジンと左右のコントローラを結びつけるマッチ層。
export class Match {
  constructor(
    private engine: PongEngine,
    private left: PaddleController,
    private right: PaddleController,
  ) {}
  // ゲーム状態を1ステップ進める。requestAnimationFrameループ等から呼び出す。
  // page.tsx の matchTick から呼ばれる想定。
  tick(state: GameState, dt: number) {
    // 左右の入力生成はコントローラ側の責務（人/AI/リモートなど）。
    const leftInput = this.left.getInput(state, dt);
    const rightInput = this.right.getInput(state, dt);
    // エンジンに入力を渡して物理・スコアなどを更新。
    this.engine.step(state, leftInput, rightInput, dt);
  }
}

// ローカルマッチ用、マッチでまとめてもいいが、簡易ラッパーを用意。
export class LocalMatch extends Match {
  constructor(
    engine: PongEngine,
    playerInput: InputState,
    ai: AiDifficultyConfig,
  ) {
    // 左は人、右はAIというローカル用の固定構成。
    super(
      engine,
      new HumanController(playerInput),
      new AIController(ai, "right"),
    );
  }
}
