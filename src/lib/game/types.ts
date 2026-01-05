/**
 * Game state and WebSocket message types
 *
 * Per Constitution III: All external inputs validated using Zod schemas
 * Per Constitution I: Game state uses WebSocket, HTTP polling prohibited
 */

import { z } from "zod";

// ============ Game Constants ============

export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 100,
  PADDLE_SPEED: 8,
  BALL_RADIUS: 10,
  BALL_INITIAL_SPEED: 5,
  BALL_MAX_SPEED: 12,
  BALL_SPEED_INCREMENT: 0.5,
  WINNING_SCORE: 11,
  TICK_RATE: 60, // Server updates per second
} as const;

// ============ Game State Types ============

export interface Vector2D {
  x: number;
  y: number;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
}

export interface Player {
  id: number;
  login: string;
  displayName: string;
  paddle: Paddle;
  score: number;
  ready: boolean;
}

export type GameStatus = "waiting" | "countdown" | "playing" | "paused" | "finished";

export interface GameState {
  id: string;
  status: GameStatus;
  players: [Player | null, Player | null];
  ball: Ball;
  countdown: number; // Countdown timer before game starts
  winner: number | null; // Player ID of winner
  createdAt: number;
  updatedAt: number;
}

// ============ WebSocket Message Types ============

// Client -> Server messages
export const ClientMessageSchema = z.discriminatedUnion("type", [
  // Join a game room
  z.object({
    type: z.literal("join"),
    gameId: z.string(),
  }),
  // Leave current game
  z.object({
    type: z.literal("leave"),
  }),
  // Player ready to start
  z.object({
    type: z.literal("ready"),
  }),
  // Paddle movement input
  z.object({
    type: z.literal("input"),
    direction: z.enum(["up", "down", "stop"]),
  }),
  // Ping for latency measurement
  z.object({
    type: z.literal("ping"),
    timestamp: z.number(),
  }),
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// Server -> Client messages
export interface ServerMessage {
  type: ServerMessageType;
  payload: unknown;
}

export type ServerMessageType =
  | "connected" // Connection established
  | "joined" // Successfully joined game
  | "left" // Left game
  | "player_joined" // Another player joined
  | "player_left" // Another player left
  | "player_ready" // Player ready state changed
  | "countdown" // Game starting countdown
  | "game_state" // Full game state update
  | "state_update" // Partial state update (optimized)
  | "score" // Score update
  | "game_over" // Game finished
  | "error" // Error message
  | "pong"; // Response to ping

// Typed server message constructors
export interface ConnectedPayload {
  userId: number;
  login: string;
}

export interface JoinedPayload {
  gameId: string;
  playerIndex: 0 | 1;
  gameState: GameState;
}

export interface PlayerJoinedPayload {
  playerIndex: 0 | 1;
  player: Player;
}

export interface PlayerLeftPayload {
  playerIndex: 0 | 1;
}

export interface CountdownPayload {
  seconds: number;
}

export interface GameStatePayload {
  state: GameState;
}

export interface StateUpdatePayload {
  ball: Ball;
  paddles: [Paddle, Paddle];
  timestamp: number;
}

export interface ScorePayload {
  player1Score: number;
  player2Score: number;
  lastScorer: 0 | 1;
}

export interface GameOverPayload {
  winnerId: number;
  winnerLogin: string;
  finalScore: [number, number];
}

export interface ErrorPayload {
  code: string;
  message: string;
}

export interface PongPayload {
  clientTimestamp: number;
  serverTimestamp: number;
}

// ============ Helper Functions ============

export function createServerMessage<T>(type: ServerMessageType, payload: T): string {
  return JSON.stringify({ type, payload });
}

export function createInitialBall(): Ball {
  // Random direction for initial ball
  const angle = (Math.random() * Math.PI / 4) - Math.PI / 8; // -22.5 to 22.5 degrees
  const direction = Math.random() > 0.5 ? 1 : -1;

  return {
    x: GAME_CONFIG.CANVAS_WIDTH / 2,
    y: GAME_CONFIG.CANVAS_HEIGHT / 2,
    radius: GAME_CONFIG.BALL_RADIUS,
    velocityX: GAME_CONFIG.BALL_INITIAL_SPEED * direction * Math.cos(angle),
    velocityY: GAME_CONFIG.BALL_INITIAL_SPEED * Math.sin(angle),
  };
}

export function createPaddle(playerIndex: 0 | 1): Paddle {
  const x = playerIndex === 0
    ? GAME_CONFIG.PADDLE_WIDTH // Left paddle
    : GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.PADDLE_WIDTH * 2; // Right paddle

  return {
    x,
    y: (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PADDLE_HEIGHT) / 2,
    width: GAME_CONFIG.PADDLE_WIDTH,
    height: GAME_CONFIG.PADDLE_HEIGHT,
  };
}

export function createPlayer(id: number, login: string, displayName: string, playerIndex: 0 | 1): Player {
  return {
    id,
    login,
    displayName,
    paddle: createPaddle(playerIndex),
    score: 0,
    ready: false,
  };
}

export function createInitialGameState(gameId: string): GameState {
  return {
    id: gameId,
    status: "waiting",
    players: [null, null],
    ball: createInitialBall(),
    countdown: 3,
    winner: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
