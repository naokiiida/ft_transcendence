import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'http';
import type { RawData, WebSocket } from 'ws';
import { AuthService } from '../auth/auth.service';
import { readCookie } from '../auth/cookie.utils';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { MetricsService } from '../observability/metrics.service';
import { UsersService } from '../users/users.service';
import { GameSessionService } from './game-session.service';

type ConnectionInfo = {
  userId: string;
  matchId: string | null;
  side: 'left' | 'right' | null;
};

type ClientMessage =
  | { type: 'join'; matchId: string }
  | { type: 'input'; up: boolean; down: boolean; seq?: number }
  | { type: 'ping' };

@WebSocketGateway({ path: '/api/ws' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly connections = new Map<WebSocket, ConnectionInfo>();

  constructor(
    private readonly authService: AuthService,
    private readonly matchmakingService: MatchmakingService,
    private readonly sessionService: GameSessionService,
    private readonly metricsService: MetricsService,
    private readonly usersService: UsersService,
  ) {
    this.matchmakingService.events.on(
      'match_dissolved',
      (payload: { opponentId: string; matchId: string; reason: 'opponent_left' }) => {
        this.notifyMatchDissolved(payload);
      },
    );
  }

  handleConnection(client: WebSocket, request: IncomingMessage) {
    const sessionId = readCookie(request.headers.cookie, 'ft_session');
    const user = sessionId ? this.authService.findUserBySession(sessionId) : null;
    if (!user) {
      client.close();
      return;
    }

    this.metricsService.websocketConnections.inc();
    this.metricsService.connectedUsersCount.inc();
    this.connections.set(client, { userId: user.uuid, matchId: null, side: null });

    client.on('message', (data) => this.handleMessage(client, data));
  }

  handleDisconnect(client: WebSocket) {
    const info = this.connections.get(client);
    if (!info) return;
    this.sessionService.removePlayerByUser(info.userId);
    this.connections.delete(client);
    this.metricsService.websocketConnections.dec();
    this.metricsService.connectedUsersCount.dec();
  }

  private handleMessage(client: WebSocket, data: RawData) {
    const info = this.connections.get(client);
    if (!info) return;
    let message: ClientMessage;
    try {
      let text: string;
      if (typeof data === 'string') {
        text = data;
      } else if (data instanceof Buffer) {
        text = data.toString();
      } else if (data instanceof ArrayBuffer) {
        text = Buffer.from(data).toString();
      } else if (Array.isArray(data)) {
        text = Buffer.concat(data).toString();
      } else {
        return;
      }
      message = JSON.parse(text) as ClientMessage;
    } catch {
      return;
    }

    if (message.type === 'join') {
      this.handleJoin(client, info, message.matchId);
      return;
    }

    if (message.type === 'input') {
      if (!info.matchId || !info.side) return;
      this.sessionService.updateInput(info.matchId, info.side, {
        up: Boolean(message.up),
        down: Boolean(message.down),
      });
      return;
    }

    if (message.type === 'ping') {
      if (!info.matchId || !info.side) return;
      this.sessionService.recordHeartbeat(info.matchId, info.side);
    }
  }

  private handleJoin(client: WebSocket, info: ConnectionInfo, matchId: string) {
    if (info.matchId) return;
    const assignment = this.matchmakingService.getAssignment(info.userId);
    if (!assignment || assignment.matchId !== matchId) {
      this.safeSend(client, { type: 'error', message: 'Invalid match.' });
      return;
    }
    info.matchId = matchId;
    info.side = assignment.side;

    const session = this.sessionService.addPlayer(
      matchId,
      assignment.side,
      info.userId,
      client,
    );
    const opponent = this.usersService.findByUuid(assignment.opponentId);
    this.safeSend(client, {
      type: 'welcome',
      matchId,
      side: assignment.side,
      state: session.state,
      opponentName: opponent?.display_name ?? null,
    });
  }

  private safeSend(client: WebSocket, payload: unknown) {
    if (client.readyState !== 1) return;
    client.send(JSON.stringify(payload));
  }

  private notifyMatchDissolved(payload: {
    opponentId: string;
    matchId: string;
    reason: 'opponent_left';
  }) {
    for (const [client, info] of this.connections.entries()) {
      if (info.userId !== payload.opponentId) continue;
      if (info.matchId !== payload.matchId) continue;
      this.safeSend(client, {
        type: 'match_dissolved',
        reason: payload.reason,
        message: 'Match canceled by opponent.',
      });
      return;
    }
  }
}
