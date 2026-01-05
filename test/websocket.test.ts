/**
 * WebSocket Connection Test
 *
 * Modular test to verify WebSocket server functionality without browser complexity.
 * Run with: bun test test/websocket.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const WS_URL = "ws://localhost:3000/ws";
const API_URL = "http://localhost:3000";

// Test 1: Verify server is running
describe("Server Health", () => {
  test("health endpoint returns ok", async () => {
    const response = await fetch(`${API_URL}/health`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe("ok");
  });
});

// Test 2: WebSocket requires authentication
describe("WebSocket Authentication", () => {
  test("rejects connection without session cookie", async () => {
    const response = await fetch(`${API_URL}/ws`, {
      headers: {
        "Upgrade": "websocket",
        "Connection": "Upgrade",
      },
    });
    // Should return 401 Unauthorized
    expect(response.status).toBe(401);
  });
});

// Test 3: Game rooms API
describe("Game Rooms API", () => {
  test("game rooms endpoint returns empty array initially", async () => {
    const response = await fetch(`${API_URL}/api/game/rooms`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.rooms).toEqual([]);
  });

  test("quick-match requires authentication", async () => {
    const response = await fetch(`${API_URL}/api/game/quick-match`);
    expect(response.status).toBe(401);
  });
});

// Test 4: WebSocket message validation (mock test)
describe("WebSocket Message Validation", () => {
  test("ClientMessageSchema validates join message", async () => {
    // Import the schema
    const { ClientMessageSchema } = await import("../src/lib/game/types");

    // Valid message
    const validJoin = { type: "join", gameId: "test-game-123" };
    const validResult = ClientMessageSchema.safeParse(validJoin);
    expect(validResult.success).toBe(true);

    // Valid input message
    const validInput = { type: "input", direction: "up" };
    const inputResult = ClientMessageSchema.safeParse(validInput);
    expect(inputResult.success).toBe(true);

    // Invalid message (missing gameId)
    const invalidJoin = { type: "join" };
    const invalidResult = ClientMessageSchema.safeParse(invalidJoin);
    expect(invalidResult.success).toBe(false);

    // Invalid message (wrong direction)
    const invalidInput = { type: "input", direction: "left" };
    const invalidInputResult = ClientMessageSchema.safeParse(invalidInput);
    expect(invalidInputResult.success).toBe(false);
  });
});

// Test 5: Game engine physics
describe("Game Engine", () => {
  test("ball bounces off walls", async () => {
    const { updateBallPosition, handleWallCollision, GAME_CONFIG } = await import("../src/lib/game/engine");
    const { createInitialBall } = await import("../src/lib/game/types");

    // Create ball at top edge moving up
    const ball = createInitialBall();
    ball.y = 5; // Near top
    ball.velocityY = -10; // Moving up

    handleWallCollision(ball);

    // Ball should bounce down (positive velocity)
    expect(ball.velocityY).toBeGreaterThan(0);
  });

  test("paddle collision reflects ball", async () => {
    const { checkPaddleCollision, handlePaddleCollision, GAME_CONFIG } = await import("../src/lib/game/engine");
    const { createInitialBall, createPaddle } = await import("../src/lib/game/types");

    // Create ball hitting left paddle
    const paddle = createPaddle(0);
    const ball = createInitialBall();
    ball.x = paddle.x + paddle.width + 5; // Just past paddle
    ball.y = paddle.y + paddle.height / 2; // Center of paddle
    ball.velocityX = -10; // Moving left

    // Position ball to collide
    ball.x = paddle.x + paddle.width + ball.radius / 2;

    const collides = checkPaddleCollision(ball, paddle);
    expect(collides).toBe(true);

    // Handle collision
    handlePaddleCollision(ball, paddle, true);

    // Ball should now be moving right
    expect(ball.velocityX).toBeGreaterThan(0);
  });

  test("score detection works", async () => {
    const { checkScore } = await import("../src/lib/game/engine");
    const { createInitialBall, GAME_CONFIG } = await import("../src/lib/game/types");

    // Ball past left edge - Player 2 scores (returns 1)
    const ball1 = createInitialBall();
    ball1.x = -20;
    expect(checkScore(ball1)).toBe(1);

    // Ball past right edge - Player 1 scores (returns 0)
    const ball2 = createInitialBall();
    ball2.x = GAME_CONFIG.CANVAS_WIDTH + 20;
    expect(checkScore(ball2)).toBe(0);

    // Ball in play - no score
    const ball3 = createInitialBall();
    ball3.x = GAME_CONFIG.CANVAS_WIDTH / 2;
    expect(checkScore(ball3)).toBe(-1);
  });
});

console.log("\n📋 WebSocket Test Suite");
console.log("========================\n");
console.log("To test full WebSocket connection with authentication:");
console.log("1. Log in via browser at http://localhost:3000");
console.log("2. Open DevTools → Network → WS tab");
console.log("3. Click 'Play Game' to connect to WebSocket");
console.log("4. Observe connection status and messages\n");
