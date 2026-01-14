//

import type { GameState, InputState } from "./engine";
import { PongEngine } from "./engine";
import type { AiDifficultyConfig, PaddleController } from "./controllers";
import { AIController, HumanController } from "./controllers";

// エンジンと左右のコントローラを結びつけるマッチ層。
export class Match {
  constructor(
    private engine: PongEngine,
    private left: PaddleController,
    private right: PaddleController
  ) {}
  // ゲーム状態を1ステップ進める。
  tick(state: GameState, dt: number) {
    const leftInput = this.left.getInput(state, dt);
    const rightInput = this.right.getInput(state, dt);
    this.engine.step(state, leftInput, rightInput, dt);
  }
}

// ローカルマッチ = 人間 vs AI（共通エンジン使用）。
export class LocalMatch extends Match {
  constructor(
    engine: PongEngine,
    playerInput: InputState,
    ai: AiDifficultyConfig
  ) {
    super(
      engine,
      new HumanController(playerInput),
      new AIController(ai, "cpu")
    );
  }
}
