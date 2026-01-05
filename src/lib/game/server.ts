/**
 * WebSocket Game Server
 *
 * Manages game rooms, player connections, and game loop.
 * Per Constitution: Server-authoritative state, WebSocket for real-time.
 */

import type { ServerWebSocket } from "bun";
import {
  GAME_CONFIG,
  type GameState,
  type ClientMessage,
  type Player,
  ClientMessageSchema,
  createServerMessage,
  createInitialGameState,
  createPlayer,
  type ConnectedPayload,
  type JoinedPayload,
  type PlayerJoinedPayload,
  type PlayerLeftPayload,
  type CountdownPayload,
  type StateUpdatePayload,
  type ScorePayload,
  type GameOverPayload,
  type ErrorPayload,
  type PongPayload,
} from "./types";
import {
  gameTick,
  startCountdown,
  tickCountdown,
  canStartGame,
} from "./engine";

// ============ WebSocket Data Types ============

export interface WebSocketData {
  userId: number;
  login: string;
  displayName: string;
  gameId: string | null;
  playerIndex: 0 | 1 | null;
  paddleDirection: "up" | "down" | "stop";
}

// ============ Game Room Management ============

interface GameRoom {
  state: GameState;
  sockets: Map<number, ServerWebSocket<WebSocketData>>; // userId -> socket
  gameLoop: ReturnType<typeof setInterval> | null;
  countdownLoop: ReturnType<typeof setInterval> | null;
}

// Active game rooms
const gameRooms = new Map<string, GameRoom>();

// Connected sockets by userId
const connectedUsers = new Map<number, ServerWebSocket<WebSocketData>>();

/**
 * Get or create a game room
 */
function getOrCreateRoom(gameId: string): GameRoom {
  let room = gameRooms.get(gameId);
  if (!room) {
    room = {
      state: createInitialGameState(gameId),
      sockets: new Map(),
      gameLoop: null,
      countdownLoop: null,
    };
    gameRooms.set(gameId, room);
  }
  return room;
}

/**
 * Broadcast message to all players in a room
 */
function broadcastToRoom(room: GameRoom, message: string): void {
  for (const socket of room.sockets.values()) {
    socket.send(message);
  }
}

/**
 * Start the game loop for a room
 */
function startGameLoop(room: GameRoom): void {
  if (room.gameLoop) return;

  const tickInterval = 1000 / GAME_CONFIG.TICK_RATE;
  let lastTick = Date.now();

  room.gameLoop = setInterval(() => {
    const now = Date.now();
    const deltaTime = (now - lastTick) / (1000 / GAME_CONFIG.TICK_RATE);
    lastTick = now;

    // Gather paddle inputs from connected players
    const paddleInputs: [("up" | "down" | "stop"), ("up" | "down" | "stop")] = ["stop", "stop"];

    for (const socket of room.sockets.values()) {
      if (socket.data.playerIndex !== null) {
        paddleInputs[socket.data.playerIndex] = socket.data.paddleDirection;
      }
    }

    // Run game tick
    const { scored, scorerIndex } = gameTick(room.state, paddleInputs, deltaTime);

    // Send state update to all players
    const [p1, p2] = room.state.players;
    if (p1 && p2) {
      const update: StateUpdatePayload = {
        ball: room.state.ball,
        paddles: [p1.paddle, p2.paddle],
        timestamp: now,
      };
      broadcastToRoom(room, createServerMessage("state_update", update));

      // If score occurred, send score update
      if (scored && scorerIndex !== -1) {
        const scorePayload: ScorePayload = {
          player1Score: p1.score,
          player2Score: p2.score,
          lastScorer: scorerIndex,
        };
        broadcastToRoom(room, createServerMessage("score", scorePayload));

        // Check for game over
        if (room.state.status === "finished" && room.state.winner !== null) {
          const winner = room.state.players.find(p => p?.id === room.state.winner);
          if (winner) {
            const gameOverPayload: GameOverPayload = {
              winnerId: winner.id,
              winnerLogin: winner.login,
              finalScore: [p1.score, p2.score],
            };
            broadcastToRoom(room, createServerMessage("game_over", gameOverPayload));
            stopGameLoop(room);
          }
        }
      }
    }
  }, tickInterval);
}

/**
 * Stop the game loop
 */
function stopGameLoop(room: GameRoom): void {
  if (room.gameLoop) {
    clearInterval(room.gameLoop);
    room.gameLoop = null;
  }
}

/**
 * Start countdown and then game
 */
function startCountdownSequence(room: GameRoom): void {
  startCountdown(room.state);

  // Send initial countdown
  const countdownPayload: CountdownPayload = { seconds: room.state.countdown };
  broadcastToRoom(room, createServerMessage("countdown", countdownPayload));

  room.countdownLoop = setInterval(() => {
    const finished = tickCountdown(room.state);

    if (finished) {
      // Countdown finished, start game
      if (room.countdownLoop) {
        clearInterval(room.countdownLoop);
        room.countdownLoop = null;
      }
      broadcastToRoom(room, createServerMessage("countdown", { seconds: 0 }));
      startGameLoop(room);
    } else {
      // Send countdown update
      const payload: CountdownPayload = { seconds: room.state.countdown };
      broadcastToRoom(room, createServerMessage("countdown", payload));
    }
  }, 1000);
}

/**
 * Clean up empty game room
 */
function cleanupRoom(gameId: string): void {
  const room = gameRooms.get(gameId);
  if (!room) return;

  if (room.sockets.size === 0) {
    stopGameLoop(room);
    if (room.countdownLoop) {
      clearInterval(room.countdownLoop);
    }
    gameRooms.delete(gameId);
  }
}

// ============ WebSocket Handlers ============

export function handleOpen(ws: ServerWebSocket<WebSocketData>): void {
  const { userId, login } = ws.data;

  // Track connected user
  connectedUsers.set(userId, ws);

  // Send connected confirmation
  const payload: ConnectedPayload = { userId, login };
  ws.send(createServerMessage("connected", payload));

  console.log(`WebSocket: User ${login} (${userId}) connected`);
}

export function handleMessage(ws: ServerWebSocket<WebSocketData>, message: string | Buffer): void {
  try {
    const data = typeof message === "string" ? message : message.toString();
    const parsed = JSON.parse(data);

    // Validate message with Zod (Constitution III)
    const result = ClientMessageSchema.safeParse(parsed);
    if (!result.success) {
      const errorPayload: ErrorPayload = {
        code: "INVALID_MESSAGE",
        message: "Invalid message format",
      };
      ws.send(createServerMessage("error", errorPayload));
      return;
    }

    const msg: ClientMessage = result.data;
    const { userId, login, displayName } = ws.data;

    switch (msg.type) {
      case "join": {
        handleJoin(ws, msg.gameId, userId, login, displayName);
        break;
      }

      case "leave": {
        handleLeave(ws);
        break;
      }

      case "ready": {
        handleReady(ws);
        break;
      }

      case "input": {
        ws.data.paddleDirection = msg.direction;
        break;
      }

      case "ping": {
        const pongPayload: PongPayload = {
          clientTimestamp: msg.timestamp,
          serverTimestamp: Date.now(),
        };
        ws.send(createServerMessage("pong", pongPayload));
        break;
      }
    }
  } catch (error) {
    console.error("WebSocket message error:", error);
    const errorPayload: ErrorPayload = {
      code: "PARSE_ERROR",
      message: "Failed to parse message",
    };
    ws.send(createServerMessage("error", errorPayload));
  }
}

function handleJoin(
  ws: ServerWebSocket<WebSocketData>,
  gameId: string,
  userId: number,
  login: string,
  displayName: string
): void {
  // Leave current game if in one
  if (ws.data.gameId) {
    handleLeave(ws);
  }

  const room = getOrCreateRoom(gameId);
  const state = room.state;

  // Find available slot
  let playerIndex: 0 | 1 | null = null;
  if (state.players[0] === null) {
    playerIndex = 0;
  } else if (state.players[1] === null) {
    playerIndex = 1;
  }

  if (playerIndex === null) {
    const errorPayload: ErrorPayload = {
      code: "GAME_FULL",
      message: "Game room is full",
    };
    ws.send(createServerMessage("error", errorPayload));
    return;
  }

  // Create player and add to game
  const player = createPlayer(userId, login, displayName, playerIndex);
  state.players[playerIndex] = player;

  // Update socket data
  ws.data.gameId = gameId;
  ws.data.playerIndex = playerIndex;
  ws.data.paddleDirection = "stop";

  // Add to room sockets
  room.sockets.set(userId, ws);

  // Send joined confirmation to joining player
  const joinedPayload: JoinedPayload = {
    gameId,
    playerIndex,
    gameState: state,
  };
  ws.send(createServerMessage("joined", joinedPayload));

  // Broadcast to other players in room
  const playerJoinedPayload: PlayerJoinedPayload = {
    playerIndex,
    player,
  };
  for (const [socketUserId, socket] of room.sockets) {
    if (socketUserId !== userId) {
      socket.send(createServerMessage("player_joined", playerJoinedPayload));
    }
  }

  console.log(`WebSocket: User ${login} joined game ${gameId} as player ${playerIndex + 1}`);
}

function handleLeave(ws: ServerWebSocket<WebSocketData>): void {
  const { gameId, playerIndex, userId, login } = ws.data;

  if (!gameId || playerIndex === null) return;

  const room = gameRooms.get(gameId);
  if (!room) return;

  // Remove player from game state
  room.state.players[playerIndex] = null;

  // Remove from room sockets
  room.sockets.delete(userId);

  // Reset socket data
  ws.data.gameId = null;
  ws.data.playerIndex = null;
  ws.data.paddleDirection = "stop";

  // Send left confirmation
  ws.send(createServerMessage("left", {}));

  // Broadcast to remaining players
  const playerLeftPayload: PlayerLeftPayload = { playerIndex };
  broadcastToRoom(room, createServerMessage("player_left", playerLeftPayload));

  // Stop game if in progress
  if (room.state.status === "playing" || room.state.status === "countdown") {
    room.state.status = "waiting";
    stopGameLoop(room);
    if (room.countdownLoop) {
      clearInterval(room.countdownLoop);
      room.countdownLoop = null;
    }
  }

  // Cleanup empty room
  cleanupRoom(gameId);

  console.log(`WebSocket: User ${login} left game ${gameId}`);
}

function handleReady(ws: ServerWebSocket<WebSocketData>): void {
  const { gameId, playerIndex } = ws.data;

  if (!gameId || playerIndex === null) return;

  const room = gameRooms.get(gameId);
  if (!room) return;

  const player = room.state.players[playerIndex];
  if (!player) return;

  // Toggle ready state
  player.ready = !player.ready;

  // Broadcast ready state change
  broadcastToRoom(
    room,
    createServerMessage("player_ready", {
      playerIndex,
      ready: player.ready,
    })
  );

  // Check if game can start
  if (canStartGame(room.state)) {
    startCountdownSequence(room);
  }
}

export function handleClose(ws: ServerWebSocket<WebSocketData>): void {
  const { userId, login } = ws.data;

  // Handle leaving game
  handleLeave(ws);

  // Remove from connected users
  connectedUsers.delete(userId);

  console.log(`WebSocket: User ${login} (${userId}) disconnected`);
}

// ============ Exports ============

export const websocketHandlers = {
  open: handleOpen,
  message: handleMessage,
  close: handleClose,
};

/**
 * Create quick match - finds or creates an available game
 */
export function findOrCreateQuickMatch(): string {
  // Find a game waiting for a player
  for (const [gameId, room] of gameRooms) {
    if (
      room.state.status === "waiting" &&
      (room.state.players[0] === null || room.state.players[1] === null)
    ) {
      return gameId;
    }
  }

  // Create new game
  const gameId = `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  getOrCreateRoom(gameId);
  return gameId;
}

/**
 * Get active game rooms info (for debugging/admin)
 */
export function getGameRoomsInfo(): Array<{ id: string; playerCount: number; status: string }> {
  return Array.from(gameRooms.entries()).map(([id, room]) => ({
    id,
    playerCount: room.sockets.size,
    status: room.state.status,
  }));
}
