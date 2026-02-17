// ゲーム状態の型定義。

// 入力は上下の押下状態のみ（同時押しも可能）。
export type InputState = {
  up: boolean;
  down: boolean;
};

// パドルの矩形と速度（速度は px/秒）。
export type Paddle = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
};

// ボールの位置・速度・半径。
export type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

// スコアは左右それぞれ。
export type Score = {
  left: number;
  right: number;
};

// ゲーム全体の状態。描画や判定はこれを参照する。
export type GameState = {
  width: number;
  height: number;
  left: Paddle;
  right: Paddle;
  ball: Ball;
  score: Score;
  maxScore: number;
  gameOver: boolean;
  winner: "left" | "right" | "manual_end" | null;
};
