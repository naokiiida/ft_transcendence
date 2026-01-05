/**
 * Game Engine - Pong physics and collision detection
 *
 * Server-authoritative game state management.
 * Updates at TICK_RATE per second, sends state to clients.
 */

import {
  GAME_CONFIG,
  type GameState,
  type Ball,
  type Paddle,
  createInitialBall,
} from "./types";

// ============ Physics ============

/**
 * Update ball position based on velocity
 */
export function updateBallPosition(ball: Ball, deltaTime: number): void {
  ball.x += ball.velocityX * deltaTime;
  ball.y += ball.velocityY * deltaTime;
}

/**
 * Check and handle wall collisions (top/bottom)
 */
export function handleWallCollision(ball: Ball): void {
  const { CANVAS_HEIGHT, BALL_RADIUS } = GAME_CONFIG;

  // Top wall
  if (ball.y - BALL_RADIUS <= 0) {
    ball.y = BALL_RADIUS;
    ball.velocityY = Math.abs(ball.velocityY); // Bounce down
  }

  // Bottom wall
  if (ball.y + BALL_RADIUS >= CANVAS_HEIGHT) {
    ball.y = CANVAS_HEIGHT - BALL_RADIUS;
    ball.velocityY = -Math.abs(ball.velocityY); // Bounce up
  }
}

/**
 * Check if ball collides with paddle using AABB collision
 */
export function checkPaddleCollision(ball: Ball, paddle: Paddle): boolean {
  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;
  const ballTop = ball.y - ball.radius;
  const ballBottom = ball.y + ball.radius;

  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + paddle.width;
  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + paddle.height;

  return (
    ballRight >= paddleLeft &&
    ballLeft <= paddleRight &&
    ballBottom >= paddleTop &&
    ballTop <= paddleBottom
  );
}

/**
 * Handle paddle collision with angle-based reflection
 * The ball bounces off at an angle based on where it hits the paddle
 */
export function handlePaddleCollision(ball: Ball, paddle: Paddle, isLeftPaddle: boolean): void {
  if (!checkPaddleCollision(ball, paddle)) return;

  // Calculate where on the paddle the ball hit (0 = top, 1 = bottom)
  const hitPosition = (ball.y - paddle.y) / paddle.height;

  // Map hit position to angle (-45 to +45 degrees from horizontal)
  const angle = (hitPosition - 0.5) * (Math.PI / 2);

  // Calculate new velocity with slight speed increase
  const currentSpeed = Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2);
  const newSpeed = Math.min(
    currentSpeed + GAME_CONFIG.BALL_SPEED_INCREMENT,
    GAME_CONFIG.BALL_MAX_SPEED
  );

  // Reflect ball direction based on which paddle was hit
  const direction = isLeftPaddle ? 1 : -1;
  ball.velocityX = direction * newSpeed * Math.cos(angle);
  ball.velocityY = newSpeed * Math.sin(angle);

  // Push ball out of paddle to prevent multiple collisions
  if (isLeftPaddle) {
    ball.x = paddle.x + paddle.width + ball.radius;
  } else {
    ball.x = paddle.x - ball.radius;
  }
}

/**
 * Check if ball went past paddle (score)
 * Returns: 0 if player 2 scored (left goal), 1 if player 1 scored (right goal), -1 if no score
 */
export function checkScore(ball: Ball): -1 | 0 | 1 {
  const { CANVAS_WIDTH, BALL_RADIUS } = GAME_CONFIG;

  // Ball passed left edge -> Player 2 scores
  if (ball.x - BALL_RADIUS <= 0) {
    return 1;
  }

  // Ball passed right edge -> Player 1 scores
  if (ball.x + BALL_RADIUS >= CANVAS_WIDTH) {
    return 0;
  }

  return -1;
}

/**
 * Update paddle position based on input
 */
export function updatePaddlePosition(
  paddle: Paddle,
  direction: "up" | "down" | "stop",
  deltaTime: number
): void {
  const { CANVAS_HEIGHT, PADDLE_HEIGHT, PADDLE_SPEED } = GAME_CONFIG;

  if (direction === "stop") return;

  const movement = PADDLE_SPEED * deltaTime;

  if (direction === "up") {
    paddle.y = Math.max(0, paddle.y - movement);
  } else {
    paddle.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddle.y + movement);
  }
}

// ============ Game State Management ============

/**
 * Reset ball to center with new random direction
 */
export function resetBall(state: GameState): void {
  const newBall = createInitialBall();
  state.ball = newBall;
}

/**
 * Run one game tick
 * Returns true if a score occurred
 */
export function gameTick(
  state: GameState,
  paddleInputs: [("up" | "down" | "stop"), ("up" | "down" | "stop")],
  deltaTime: number
): { scored: boolean; scorerIndex: 0 | 1 | -1 } {
  if (state.status !== "playing") {
    return { scored: false, scorerIndex: -1 };
  }

  const [p1, p2] = state.players;
  if (!p1 || !p2) {
    return { scored: false, scorerIndex: -1 };
  }

  // Update paddle positions
  updatePaddlePosition(p1.paddle, paddleInputs[0], deltaTime);
  updatePaddlePosition(p2.paddle, paddleInputs[1], deltaTime);

  // Update ball position
  updateBallPosition(state.ball, deltaTime);

  // Handle wall collisions
  handleWallCollision(state.ball);

  // Handle paddle collisions
  handlePaddleCollision(state.ball, p1.paddle, true);
  handlePaddleCollision(state.ball, p2.paddle, false);

  // Check for score
  const scorerIndex = checkScore(state.ball);

  if (scorerIndex !== -1) {
    const scoringPlayer = state.players[scorerIndex];
    if (scoringPlayer) {
      scoringPlayer.score++;

      // Check for game over
      if (scoringPlayer.score >= GAME_CONFIG.WINNING_SCORE) {
        state.status = "finished";
        state.winner = scoringPlayer.id;
      } else {
        // Reset ball for next round
        resetBall(state);
      }
    }

    return { scored: true, scorerIndex };
  }

  state.updatedAt = Date.now();
  return { scored: false, scorerIndex: -1 };
}

/**
 * Start countdown and transition to playing
 */
export function startCountdown(state: GameState): void {
  state.status = "countdown";
  state.countdown = 3;
}

/**
 * Decrement countdown, returns true when countdown finished
 */
export function tickCountdown(state: GameState): boolean {
  if (state.status !== "countdown") return false;

  state.countdown--;

  if (state.countdown <= 0) {
    state.status = "playing";
    resetBall(state);
    return true;
  }

  return false;
}

/**
 * Check if game can start (both players ready)
 */
export function canStartGame(state: GameState): boolean {
  const [p1, p2] = state.players;
  return (
    state.status === "waiting" &&
    p1 !== null &&
    p2 !== null &&
    p1.ready &&
    p2.ready
  );
}
