// ゲームの初期化、メインループ、状態更新ロジックを担当する。

import type { GameState, InputState } from './state';
import { moveBall, movePaddle, spawnBall } from './physics';

export class PongEngine {
  createState(width: number, height: number) {
    return createGameState(width, height);
  }

  step(
    state: GameState,
    playerInput: InputState,
    cpuInput: InputState,
    dt: number,
  ) {
    updateGameWithInputs(state, playerInput, cpuInput, dt);
  }
}

const PADDLE_SPEED = 420;
const CPU_SPEED = 420;
const MAX_SCORE = 5;

export function createGameState(width: number, height: number): GameState {
  const paddleWidth = 12;
  const paddleHeight = 90;
  return {
    width,
    height,
    left: {
      x: 32,
      y: height / 2 - paddleHeight / 2,
      w: paddleWidth,
      h: paddleHeight,
      speed: PADDLE_SPEED,
    },
    right: {
      x: width - 32 - paddleWidth,
      y: height / 2 - paddleHeight / 2,
      w: paddleWidth,
      h: paddleHeight,
      speed: CPU_SPEED,
    },
    ball: spawnBall(width, height, 1),
    score: {
      left: 0,
      right: 0,
    },
    maxScore: MAX_SCORE,
    gameOver: false,
    winner: null,
  };
}

export function updateGameWithInputs(
  state: GameState,
  playerInput: InputState,
  cpuInput: InputState,
  dt: number,
) {
  if (state.gameOver) return;
  movePaddle(state, state.left, playerInput, dt);
  movePaddle(state, state.right, cpuInput, dt);
  moveBall(state, dt);
}
