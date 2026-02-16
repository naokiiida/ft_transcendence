import { Injectable } from '@nestjs/common';
import type { WebSocket } from 'ws';
import { MetricsService } from '../observability/metrics.service';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { GamesService } from '../games/games.service';
import { createGameState, PongEngine } from './game/engine';
import type { GameState, InputState } from './game/state';

type PlayerSide = 'left' | 'right';

type PlayerSlot = {
  userId: string;
  socket: WebSocket;
  input: InputState;
  lastSeen: number;
};

type GameSession = {
  matchId: string;
  gameId: string | null;
  state: GameState;
  engine: PongEngine;
  players: Partial<Record<PlayerSide, PlayerSlot>>;
  tick: number;
  started: boolean;
  completed: boolean;
  tickTimer: ReturnType<typeof setInterval> | null;
  broadcastTimer: ReturnType<typeof setInterval> | null;
  joinTimeout: ReturnType<typeof setTimeout> | null;
};

const TICK_RATE = 30;
const BROADCAST_RATE = 15;
const HEARTBEAT_TIMEOUT_MS = 5000;
const JOIN_TIMEOUT_MS = 60000;

@Injectable()
export class GameSessionService {
  private readonly sessions = new Map<string, GameSession>();
  private readonly userIndex = new Map<string, { matchId: string; side: PlayerSide }>();

  constructor(
    private readonly metricsService: MetricsService,
    private readonly matchmakingService: MatchmakingService,
    private readonly gamesService: GamesService,
  ) {}

  addPlayer(matchId: string, side: PlayerSide, userId: string, socket: WebSocket) {
    const session = this.getOrCreate(matchId);
    session.players[side] = {
      userId,
      socket,
      input: { up: false, down: false },
      lastSeen: Date.now(),
    };
    this.userIndex.set(userId, { matchId, side });
    if (this.isReady(session) && !session.started) {
      this.clearJoinTimeout(session);
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
    slot.lastSeen = Date.now();
  }

  recordHeartbeat(matchId: string, side: PlayerSide) {
    const session = this.sessions.get(matchId);
    if (!session) return;
    const slot = session.players[side];
    if (!slot) return;
    slot.lastSeen = Date.now();
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
      gameId: null,
      state: createGameState(800, 500),
      engine: new PongEngine(),
      players: {},
      tick: 0,
      started: false,
      completed: false,
      tickTimer: null,
      broadcastTimer: null,
      joinTimeout: null,
    };
    session.joinTimeout = setTimeout(() => {
      if (session.started) return;
      if (!this.isReady(session)) {
        this.broadcast(session, {
          type: 'match_aborted',
          reason: 'no_opponent',
          message: 'Opponent did not join in time.',
        });
        this.stopSession(matchId);
      }
    }, JOIN_TIMEOUT_MS);
    this.sessions.set(matchId, session);
    return session;
  }

  private isReady(session: GameSession) {
    return Boolean(session.players.left && session.players.right);
  }

  private startSession(session: GameSession) {
    session.started = true;
    this.metricsService.activeGamesCount.inc();

    if (!this.initializeGameRecord(session)) {
      return;
    }

    const tickInterval = Math.round(1000 / TICK_RATE);
    const broadcastInterval = Math.round(1000 / BROADCAST_RATE);
    session.tickTimer = setInterval(() => {
      if (this.handleHeartbeatTimeout(session)) {
        return;
      }
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
        this.completeGameRecord(session, this.toWinnerSide(session.state.winner));
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
    this.completeGameRecord(session, remainingSide);
    this.stopSession(session.matchId);
  }

  private stopSession(matchId: string) {
    const session = this.sessions.get(matchId);
    if (!session) return;
    this.clearJoinTimeout(session);
    if (session.tickTimer) clearInterval(session.tickTimer);
    if (session.broadcastTimer) clearInterval(session.broadcastTimer);
    session.tickTimer = null;
    session.broadcastTimer = null;
    if (session.started) {
      this.metricsService.activeGamesCount.dec();
    }
    this.matchmakingService.clearAssignmentByMatchId(matchId);
    this.sessions.delete(matchId);
  }

  private clearJoinTimeout(session: GameSession) {
    if (!session.joinTimeout) return;
    clearTimeout(session.joinTimeout);
    session.joinTimeout = null;
  }

  private handleHeartbeatTimeout(session: GameSession) {
    const now = Date.now();
    const leftStale =
      session.players.left && now - session.players.left.lastSeen > HEARTBEAT_TIMEOUT_MS;
    const rightStale =
      session.players.right &&
      now - session.players.right.lastSeen > HEARTBEAT_TIMEOUT_MS;
    if (!leftStale && !rightStale) return false;

    this.broadcast(session, {
      type: 'match_aborted',
      reason: 'timeout',
      message: 'Connection timeout.',
    });
    this.completeGameRecord(session, null);
    this.stopSession(session.matchId);
    return true;
  }

  private initializeGameRecord(session: GameSession) {
    if (session.gameId) return true;
    const leftId = session.players.left?.userId;
    const rightId = session.players.right?.userId;
    if (!leftId || !rightId) {
      this.broadcast(session, {
        type: 'error',
        message: 'Match setup failed.',
      });
      this.stopSession(session.matchId);
      return false;
    }
    try {
      const game = this.gamesService.createAndStartOnlineGame(leftId, rightId);
      session.gameId = game.id;
      return true;
    } catch {
      this.broadcast(session, {
        type: 'error',
        message: 'Match setup failed.',
      });
      this.stopSession(session.matchId);
      return false;
    }
  }

  private toWinnerSide(winner: GameState['winner']): PlayerSide | null {
    if (winner === 'left' || winner === 'right') return winner;
    return null;
  }

  private completeGameRecord(session: GameSession, winnerSide: PlayerSide | null) {
    if (session.completed) return;
    session.completed = true;
    if (!session.gameId) return;
    const winnerId = winnerSide ? session.players[winnerSide]?.userId ?? null : null;
    try {
      this.gamesService.completeGame({
        game_id: session.gameId,
        winner_id: winnerId,
        player1_score: session.state.score.left,
        player2_score: session.state.score.right,
      });
    } catch {
      // avoid crashing realtime loop
    }
  }

  broadcastToMatch(matchId: string, payload: unknown): void {
    const session = this.sessions.get(matchId);
    if (!session) return;
    this.broadcast(session, payload);
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
