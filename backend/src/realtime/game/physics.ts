// ゲームの物理・ルール関連。

import type { Ball, GameState, InputState, Paddle } from './state';

const BALL_SPEED = 320;
const BALL_SPEED_MAX = 520;

export function movePaddle(
  state: GameState,
  paddle: Paddle,
  input: InputState,
  dt: number,
) {
  if (input.up) {
    paddle.y -= paddle.speed * dt;
  }
  if (input.down) {
    paddle.y += paddle.speed * dt;
  }
  paddle.y = clamp(paddle.y, 12, state.height - paddle.h - 12);
}

export function moveBall(state: GameState, dt: number) {
  const ball = state.ball;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
  }
  if (ball.y + ball.r >= state.height) {
    ball.y = state.height - ball.r;
    ball.vy = -Math.abs(ball.vy);
  }

  if (hitsPaddle(ball, state.left)) {
    reflectFromPaddle(ball, state.left, 1);
  }
  if (hitsPaddle(ball, state.right)) {
    reflectFromPaddle(ball, state.right, -1);
  }

  if (ball.x + ball.r < 0) {
    state.score.right += 1;
    if (state.score.right >= state.maxScore) {
      state.gameOver = true;
      state.winner = 'right';
      return;
    }
    state.ball = spawnBall(state.width, state.height, 1);
  }
  if (ball.x - ball.r > state.width) {
    state.score.left += 1;
    if (state.score.left >= state.maxScore) {
      state.gameOver = true;
      state.winner = 'left';
      return;
    }
    state.ball = spawnBall(state.width, state.height, -1);
  }
}

export function spawnBall(
  width: number,
  height: number,
  direction: 1 | -1,
): Ball {
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  return {
    x: width / 2,
    y: height / 2,
    vx: Math.cos(angle) * BALL_SPEED * direction,
    vy: Math.sin(angle) * BALL_SPEED,
    r: 8,
  };
}

function hitsPaddle(ball: Ball, paddle: Paddle) {
  return (
    ball.x - ball.r <= paddle.x + paddle.w &&
    ball.x + ball.r >= paddle.x &&
    ball.y + ball.r >= paddle.y &&
    ball.y - ball.r <= paddle.y + paddle.h
  );
}

function reflectFromPaddle(ball: Ball, paddle: Paddle, direction: 1 | -1) {
  const center = paddle.y + paddle.h / 2;
  const offset = (ball.y - center) / (paddle.h / 2);
  const angle = clamp(offset, -1, 1) * 0.7;
  const speed = clamp(
    Math.hypot(ball.vx, ball.vy) + 18,
    BALL_SPEED,
    BALL_SPEED_MAX,
  );

  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;

  if (direction === 1) {
    ball.x = paddle.x + paddle.w + ball.r;
  } else {
    ball.x = paddle.x - ball.r;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
