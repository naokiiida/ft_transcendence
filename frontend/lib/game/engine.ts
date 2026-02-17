// ゲームの初期化、メインループ、状態更新ロジック、手動終了を担当するエンジン層。

import type { GameState, InputState } from "./state";
import { moveBall, movePaddle, spawnBall } from "./physics";

// ここがメイン
export class PongEngine {
  // 外部から呼び出される初期化入口。
  createState(width: number, height: number) {
    return createGameState(width, height);
  }

  // match.tickが、呼ぶ役になる。
  step(
    state: GameState,
    playerInput: InputState,
    cpuInput: InputState,
    dt: number,
  ) {
    // 1フレーム分の更新（dt は秒）。
    updateGameWithInputs(state, playerInput, cpuInput, dt);
  }
}

// 定数
// 速度は px/秒 を想定。
const PADDLE_SPEED = 420;
const CPU_SPEED = 340;
const MAX_SCORE = 5;

// ゲーム状態の初期化
export function createGameState(width: number, height: number): GameState {
  const paddleWidth = 12;
  const paddleHeight = 90;
  return {
    width,
    height,
    left: {
      // 左パドル（ローカルの人間）
      x: 32,
      y: height / 2 - paddleHeight / 2,
      w: paddleWidth,
      h: paddleHeight,
      speed: PADDLE_SPEED,
    },
    right: {
      // 右パドル（ローカルのCPU）
      x: width - 32 - paddleWidth,
      y: height / 2 - paddleHeight / 2,
      w: paddleWidth,
      h: paddleHeight,
      speed: CPU_SPEED,
    },
    // 初期ボールは右方向に出す（第3引数の向き）。
    ball: spawnBall(width, height, 1), // ボールの初期位置
    score: {
      left: 0,
      right: 0,
    },
    maxScore: MAX_SCORE,
    gameOver: false,
    winner: null,
  };
}

// 両パドルの入力を受け取る汎用更新、 pongEngine.step から呼び出される。
export function updateGameWithInputs(
  state: GameState,
  playerInput: InputState,
  cpuInput: InputState,
  dt: number,
) {
  // 終了済みなら更新しない（入力も無視）。
  if (state.gameOver) {
    return;
  }
  // 入力は {up, down} のフラグで、movePaddle が速度と境界処理を行う。
  movePaddle(state, state.left, playerInput, dt); // 左パドルの移動
  movePaddle(state, state.right, cpuInput, dt); // 右パドルの移動
  // moveBall 内で壁反射や得点判定が行われる想定。
  moveBall(state, dt); // ボールの移動
}

// ゲームの手動終了。
export function endGame(state: GameState) {
  // UI 側で「中断」などの理由表示に使えるよう winner に種別を入れる。
  state.gameOver = true;
  state.winner = "manual_end";
}

// 以前の仕様のAIの仕様
// function getDefaultAiInput(state: GameState): InputState {
//   const target = state.ball.y - state.right.h / 2;　//バトルの中心にボールを合わせたい。
//   const deadZone = 6;// デッドゾーンをもうけて、近い時は、動かさない。
//   return {
//     up: target < state.right.y - deadZone,//目標がパドルの上なら上へ
//     down: target > state.right.y + deadZone,//目標がパドルの下なら下へ
//   };
// }
