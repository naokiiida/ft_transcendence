import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WebSocket } from 'ws';
import type { Server } from 'ws';

type ClientMessage =
  | { type: 'ping'; timestamp: number }
  | {
      type: 'game_input';
      game_id: string;
      input: { direction: 'up' | 'down' | 'none'; timestamp: number };
    }
  | { type: string; [key: string]: unknown };

type GameStateMessage = {
  type: 'game_state';
  game_id: string;
  state: {
    ball: { x: number; y: number; vx: number; vy: number };
    paddle1: { y: number };
    paddle2: { y: number };
    score: { player1: number; player2: number };
    status: 'playing';
    timestamp: number;
  };
};

type PongMessage = {
  type: 'pong';
  timestamp: number;
  server_time: number;
};

type GameJoinedMessage = {
  type: 'game_joined';
  game_id: string;
  player_number: 1 | 2 | null;
  role: 'player' | 'spectator';
  opponent: null;
  player: { id: string; display_name: string };
};

const GAME_ID = 'test';
const CANVAS = { width: 800, height: 600 };
const BALL = { radius: 8, speed: 6 };
const PADDLE = { height: 100, width: 10, margin: 20, speed: 360 };
const SERVER_TICK_MS = 33;

@WebSocketGateway({ path: '/api/ws' })
export class WsGateway {
  @WebSocketServer()
  server!: Server;

  private clients = new Map<
    WebSocket,
    {
      id: string;
      name: string;
      role: 'player' | 'spectator';
      playerNumber: 1 | 2 | null;
      lastInputAt: number;
    }
  >();
  private tickHandle: NodeJS.Timeout | null = null;
  private state = {
    ball: { x: CANVAS.width / 2, y: CANVAS.height / 2, vx: BALL.speed, vy: BALL.speed * 0.6 },
    paddle1: { y: CANVAS.height / 2 - PADDLE.height / 2 },
    paddle2: { y: CANVAS.height / 2 - PADDLE.height / 2 },
    score: { player1: 0, player2: 0 },
    status: 'playing' as const,
  };

  handleConnection(client: WebSocket) {
    const id = `guest-${Math.random().toString(36).slice(2, 8)}`;
    const name = `Guest-${id.slice(-4)}`;
    const playerCount = Array.from(this.clients.values()).filter((entry) => entry.role === 'player').length;
    const isPlayer = playerCount < 2;
    const role: 'player' | 'spectator' = isPlayer ? 'player' : 'spectator';
    const playerNumber = role === 'player' ? (playerCount === 0 ? 1 : 2) : null;
    this.clients.set(client, { id, name, role, playerNumber, lastInputAt: 0 });
    const joined: GameJoinedMessage = {
      type: 'game_joined',
      game_id: GAME_ID,
      player_number: playerNumber,
      role,
      opponent: null,
      player: { id, display_name: name },
    };
    client.send(JSON.stringify(joined));

    client.on('message', (raw) => {
      this.handleMessage(client, raw.toString());
    });

    client.on('close', () => {
      this.clients.delete(client);
      if (this.clients.size === 0) {
        this.stopTick();
      }
    });

    if (!this.tickHandle) {
      this.startTick();
    }
  }

  private handleMessage(client: WebSocket, raw: string) {
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (isPingMessage(payload)) {
      const pong: PongMessage = {
        type: 'pong',
        timestamp: payload.timestamp,
        server_time: Date.now(),
      };
      client.send(JSON.stringify(pong));
      return;
    }

    if (isGameInputMessage(payload)) {
      if (payload.game_id !== GAME_ID) return;
      const entry = this.clients.get(client);
      if (!entry || entry.playerNumber === null) return;
      this.applyPlayerInput(entry, payload.input.direction);
    }
  }

  private startTick() {
    this.tickHandle = setInterval(() => {
      this.step();
      const message: GameStateMessage = {
        type: 'game_state',
        game_id: GAME_ID,
        state: {
          ball: { ...this.state.ball },
          paddle1: { ...this.state.paddle1 },
          paddle2: { ...this.state.paddle2 },
          score: { ...this.state.score },
          status: this.state.status,
          timestamp: Date.now(),
        },
      };
      const encoded = JSON.stringify(message);
      for (const client of this.clients.keys()) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(encoded);
        }
      }
    }, SERVER_TICK_MS);
  }

  private stopTick() {
    if (this.tickHandle) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  private step() {
    const ball = this.state.ball;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.y - BALL.radius <= 0 || ball.y + BALL.radius >= CANVAS.height) {
      ball.vy *= -1;
    }

    if (ball.x - BALL.radius <= 0 || ball.x + BALL.radius >= CANVAS.width) {
      ball.vx *= -1;
    }
  }

  private applyPlayerInput(
    entry: { playerNumber: 1 | 2 | null; lastInputAt: number },
    direction: 'up' | 'down' | 'none'
  ) {
    if (entry.playerNumber === null || direction === 'none') return;
    const now = Date.now();
    const dt =
      entry.lastInputAt === 0
        ? SERVER_TICK_MS / 1000
        : Math.min((now - entry.lastInputAt) / 1000, 0.05);
    entry.lastInputAt = now;

    const paddle = entry.playerNumber === 1 ? this.state.paddle1 : this.state.paddle2;
    if (direction === 'up') {
      paddle.y -= PADDLE.speed * dt;
    } else if (direction === 'down') {
      paddle.y += PADDLE.speed * dt;
    }
    paddle.y = clamp(paddle.y, 0, CANVAS.height - PADDLE.height);
  }
}

function isPingMessage(payload: unknown): payload is Extract<ClientMessage, { type: 'ping' }> {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as { type?: unknown; timestamp?: unknown };
  return candidate.type === 'ping' && typeof candidate.timestamp === 'number';
}

function isGameInputMessage(
  payload: unknown
): payload is Extract<ClientMessage, { type: 'game_input' }> {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as {
    type?: unknown;
    game_id?: unknown;
    input?: { direction?: unknown; timestamp?: unknown };
  };
  const direction = candidate.input?.direction;
  return (
    candidate.type === 'game_input' &&
    typeof candidate.game_id === 'string' &&
    (direction === 'up' || direction === 'down' || direction === 'none') &&
    typeof candidate.input?.timestamp === 'number'
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
