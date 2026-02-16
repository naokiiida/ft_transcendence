// ゲーム状態の型定義（サーバー側）

export type InputState = {
  up: boolean;
  down: boolean;
};

export type Paddle = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
};

export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export type Score = {
  left: number;
  right: number;
};

export type GameState = {
  width: number;
  height: number;
  left: Paddle;
  right: Paddle;
  ball: Ball;
  score: Score;
  maxScore: number;
  gameOver: boolean;
  winner: 'left' | 'right' | 'manual_end' | null;
};
