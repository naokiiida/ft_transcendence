// ゲームの物理・ルール関連。

import type { Ball, GameState, InputState, Paddle } from "./state";

const BALL_SPEED = 320; // 基準速度
const BALL_SPEED_MAX = 520; // 最高速度(反射時に加速するため）

//入力に応じて、パドルを移動。
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
  paddle.y = clamp(paddle.y, 12, state.height - paddle.h - 12); //マージン12を確保して、それ以上にはみ出させない。
}

/*
vxは方向速度
rは、ボールの半径

*/

//ボールの移動と、衝突判定（上下と左右バー）とゴール通過時の得点処理を行う。
export function moveBall(state: GameState, dt: number) {
  const ball = state.ball;
  // ボールの位置更新(速度に時間をかけて移動量を算出)
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  //上端が0以下なら
  if (ball.y - ball.r <= 0) {
    ball.y = ball.r; // 上端に衝突したら、上端に位置を戻す。ボールの半径だとめり込まない。
    ball.vy = Math.abs(ball.vy); // 速度を反転させる（下向きにする）。
  }
  if (ball.y + ball.r >= state.height) {
    ball.y = state.height - ball.r;
    ball.vy = -Math.abs(ball.vy);
  }

  //　パドルに衝突したら、反射させる。
  if (hitsPaddle(ball, state.left)) {
    reflectFromPaddle(ball, state.left, 1);
  }
  if (hitsPaddle(ball, state.right)) {
    reflectFromPaddle(ball, state.right, -1);
  }

  //ボールが、左側をはみ出したら、右の得点。
  if (ball.x + ball.r < 0) {
    state.score.right += 1;
    // 最大得点に達したら、ゲームオーバー。
    if (state.score.right >= state.maxScore) {
      state.gameOver = true;
      state.winner = "right";
      return;
    }
    // ボールを中央にリスポーン。
    state.ball = spawnBall(state.width, state.height, 1);
  }
  if (ball.x - ball.r > state.width) {
    state.score.left += 1;
    if (state.score.left >= state.maxScore) {
      state.gameOver = true;
      state.winner = "left";
      return;
    }
    state.ball = spawnBall(state.width, state.height, -1);
  }
}

// ボールのリスポーン。
export function spawnBall(
  width: number,
  height: number,
  direction: 1 | -1,
): Ball {
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // -0.3π〜+0.3πの範囲でランダムな角度。
  return {
    //画面中央から
    x: width / 2,
    y: height / 2,
    // アングルと方向に基づく速度で初期化
    vx: Math.cos(angle) * BALL_SPEED * direction,
    vy: Math.sin(angle) * BALL_SPEED,
    r: 8, //どっかで定数化したほうがええ？
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

// パドルからの反射処理。
function reflectFromPaddle(ball: Ball, paddle: Paddle, direction: 1 | -1) {
  const center = paddle.y + paddle.h / 2;
  const offset = (ball.y - center) / (paddle.h / 2); // -1 〜 +1 の範囲に正規化された衝突位置
  const angle = offset * 0.7; // 反射角度（最大±0.7ラジアン、約40度）
  const speed = clamp(
    Math.hypot(ball.vx, ball.vy) + 18, // 今の速度に少し足して、でも最低と最高の間に収める。
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
