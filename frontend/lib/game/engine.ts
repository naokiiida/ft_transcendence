// プレーヤーの入力状態
export type InputState = {
  up: boolean;
  down: boolean;
};

// 棒の状態
type Paddle = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
};

// ボールの状態
type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

type Score = {
  player: number;
  cpu: number;
};

// ゲーム全体の状態
export type GameState = {
  width: number;
  height: number;
  player: Paddle;
  cpu: Paddle;
  ball: Ball;
  score: Score;
  maxScore: number;
  gameOver: boolean;
  winner: "player" | "cpu" | "manual" | null;
};

// 定数
const BALL_SPEED = 320;
const BALL_SPEED_MAX = 520;
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
    player: {
      x: 32,
      y: height / 2 - paddleHeight / 2,
      w: paddleWidth,
      h: paddleHeight,
      speed: PADDLE_SPEED,
    },
    cpu: {
      x: width - 32 - paddleWidth,
      y: height / 2 - paddleHeight / 2,
      w: paddleWidth,
      h: paddleHeight,
      speed: CPU_SPEED,
    },
    ball: spawnBall(width, height, 1),
    score: {
      player: 0,
      cpu: 0,
    },
    maxScore: MAX_SCORE,
    gameOver: false,
    winner: null,
  };
}

// ゲーム状態の更新
export function updateGame(state: GameState, input: InputState, dt: number) {
  if (state.gameOver) {
    return;
  }
  movePlayer(state, input, dt);
  moveCpu(state, dt);
  moveBall(state, dt);
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.fillStyle = "#1f1f1f";
  const dashHeight = 14;
  for (let y = 12; y < state.height; y += dashHeight * 2) {
    ctx.fillRect(state.width / 2 - 2, y, 4, dashHeight);
  }

  ctx.fillStyle = "#eaeaea";
  drawPaddle(ctx, state.player);
  drawPaddle(ctx, state.cpu);

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#9ca3af";
  ctx.font = "24px 'DotGothic16', monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    `${state.score.player} : ${state.score.cpu}`,
    state.width / 2,
    36
  );

  if (state.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#fef3c7";
    ctx.font = "32px 'DotGothic16', monospace";
    ctx.fillText("GAME OVER", state.width / 2, state.height / 2 - 10);
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "18px 'DotGothic16', monospace";
    const label = state.winner
      ? `Winner: ${state.winner.toUpperCase()}`
      : "Winner: -";
    ctx.fillText(label, state.width / 2, state.height / 2 + 24);
  }
}

export function endGame(state: GameState) {
  state.gameOver = true;
  state.winner = "manual";
}

function movePlayer(state: GameState, input: InputState, dt: number) {
  if (input.up) {
    state.player.y -= state.player.speed * dt;
  }
  if (input.down) {
    state.player.y += state.player.speed * dt;
  }
  state.player.y = clamp(
    state.player.y,
    12,
    state.height - state.player.h - 12
  );
}

function moveCpu(state: GameState, dt: number) {
  const target = state.ball.y - state.cpu.h / 2;
  if (target > state.cpu.y + 6) {
    state.cpu.y += state.cpu.speed * dt;
  } else if (target < state.cpu.y - 6) {
    state.cpu.y -= state.cpu.speed * dt;
  }
  state.cpu.y = clamp(state.cpu.y, 12, state.height - state.cpu.h - 12);
}

function moveBall(state: GameState, dt: number) {
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

  if (hitsPaddle(ball, state.player)) {
    reflectFromPaddle(ball, state.player, 1);
  }

  if (hitsPaddle(ball, state.cpu)) {
    reflectFromPaddle(ball, state.cpu, -1);
  }

  if (ball.x + ball.r < 0) {
    state.score.cpu += 1;
    if (state.score.cpu >= state.maxScore) {
      state.gameOver = true;
      state.winner = "cpu";
      return;
    }
    state.ball = spawnBall(state.width, state.height, 1);
  }

  if (ball.x - ball.r > state.width) {
    state.score.player += 1;
    if (state.score.player >= state.maxScore) {
      state.gameOver = true;
      state.winner = "player";
      return;
    }
    state.ball = spawnBall(state.width, state.height, -1);
  }
}

function drawPaddle(ctx: CanvasRenderingContext2D, paddle: Paddle) {
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
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
  const angle = offset * 0.7;
  const speed = clamp(
    Math.hypot(ball.vx, ball.vy) + 18,
    BALL_SPEED,
    BALL_SPEED_MAX
  );

  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;

  if (direction === 1) {
    ball.x = paddle.x + paddle.w + ball.r;
  } else {
    ball.x = paddle.x - ball.r;
  }
}

function spawnBall(width: number, height: number, direction: 1 | -1): Ball {
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  return {
    x: width / 2,
    y: height / 2,
    vx: Math.cos(angle) * BALL_SPEED * direction,
    vy: Math.sin(angle) * BALL_SPEED,
    r: 8,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
