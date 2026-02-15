import { Injectable } from '@nestjs/common';
import type { WebSocket } from 'ws';
import { MetricsService } from '../observability/metrics.service';
import { createGameState, PongEngine } from './game/engine';
import type { GameState, InputState } from './game/state';

type PlayerSide = 'left' | 'right';

type PlayerSlot = {
  userId: string;
  socket: WebSocket;
  input: InputState;
};

type GameSession = {
  matchId: string;
  state: GameState;
  engine: PongEngine;
  players: Partial<Record<PlayerSide, PlayerSlot>>;
  tick: number;
  started: boolean;
  tickTimer: ReturnType<typeof setInterval> | null;
  broadcastTimer: ReturnType<typeof setInterval> | null;
};

const TICK_RATE = 30;
const BROADCAST_RATE = 15;

@Injectable()
export class GameSessionService {
  private readonly sessions = new Map<string, GameSession>();
  private readonly userIndex = new Map<string, { matchId: string; side: PlayerSide }>();

  constructor(private readonly metricsService: MetricsService) {}

  addPlayer(matchId: string, side: PlayerSide, userId: string, socket: WebSocket) {
    const session = this.getOrCreate(matchId);
    session.players[side] = {
      userId,
      socket,
      input: { up: false, down: false },
    };
    this.userIndex.set(userId, { matchId, side });
    if (this.isReady(session) && !session.started) {
      this.startSession(session);
    }
    return session;
  }

  updateInput(matchId: string, side: PlayerSide, input: InputState) {
    const session = this.sessions.get(matchId);
    if (!session) return;
    const slot = session.players[side];
    if (!slot) return;
    slot.input = input;
  }

  removePlayerByUser(userId: string) {
    const entry = this.userIndex.get(userId);
    if (!entry) return;
    this.userIndex.delete(userId);
    const session = this.sessions.get(entry.matchId);
    if (!session) return;
    this.removePlayer(session, entry.side);
  }

  private getOrCreate(matchId: string): GameSession {
    const existing = this.sessions.get(matchId);
    if (existing) return existing;
    const session: GameSession = {
      matchId,
      state: createGameState(800, 500),
      engine: new PongEngine(),
      players: {},
      tick: 0,
      started: false,
      tickTimer: null,
      broadcastTimer: null,
    };
    this.sessions.set(matchId, session);
    return session;
  }

  private isReady(session: GameSession) {
    return Boolean(session.players.left && session.players.right);
  }

  private startSession(session: GameSession) {
    session.started = true;
    this.metricsService.activeGamesCount.inc();

    const tickInterval = Math.round(1000 / TICK_RATE);
    const broadcastInterval = Math.round(1000 / BROADCAST_RATE);
    session.tickTimer = setInterval(() => {
      const leftInput = session.players.left?.input ?? { up: false, down: false };
      const rightInput = session.players.right?.input ?? { up: false, down: false };
      session.engine.step(session.state, leftInput, rightInput, 1 / TICK_RATE);
      session.tick += 1;
      if (session.state.gameOver) {
        this.broadcast(session, {
          type: 'game_over',
          winner: session.state.winner,
          score: session.state.score,
        });
        this.stopSession(session.matchId);
      }
    }, tickInterval);

    session.broadcastTimer = setInterval(() => {
      this.broadcast(session, {
        type: 'state',
        tick: session.tick,
        state: session.state,
      });
    }, broadcastInterval);
  }

  private removePlayer(session: GameSession, side: PlayerSide) {
    const slot = session.players[side];
    if (!slot) return;
    delete session.players[side];
    this.userIndex.delete(slot.userId);

    const remainingSide: PlayerSide | null = session.players.left
      ? 'left'
      : session.players.right
        ? 'right'
        : null;

    if (remainingSide) {
      this.broadcast(session, {
        type: 'player_left',
        winner: remainingSide,
      });
    }
    this.stopSession(session.matchId);
  }

  private stopSession(matchId: string) {
    const session = this.sessions.get(matchId);
    if (!session) return;
    if (session.tickTimer) clearInterval(session.tickTimer);
    if (session.broadcastTimer) clearInterval(session.broadcastTimer);
    session.tickTimer = null;
    session.broadcastTimer = null;
    if (session.started) {
      this.metricsService.activeGamesCount.dec();
    }
    this.sessions.delete(matchId);
  }

  private broadcast(session: GameSession, payload: unknown) {
    const message = JSON.stringify(payload);
    const targets = [session.players.left?.socket, session.players.right?.socket];
    for (const socket of targets) {
      if (!socket) continue;
      if (socket.readyState === 1) {
        socket.send(message);
      }
    }
  }
}
