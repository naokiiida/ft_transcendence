import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';
import { AuthService } from '../auth/auth.service';
import { readCookie } from '../auth/cookie.utils';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { MetricsService } from '../observability/metrics.service';
import { GameSessionService } from './game-session.service';

type ConnectionInfo = {
  userId: string;
  matchId: string | null;
  side: 'left' | 'right' | null;
};

type ClientMessage =
  | { type: 'join'; matchId: string }
  | { type: 'input'; up: boolean; down: boolean; seq?: number };

@WebSocketGateway({ path: '/api/ws' })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly connections = new Map<WebSocket, ConnectionInfo>();

  constructor(
    private readonly authService: AuthService,
    private readonly matchmakingService: MatchmakingService,
    private readonly sessionService: GameSessionService,
    private readonly metricsService: MetricsService,
  ) {}

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

  private handleMessage(client: WebSocket, data: unknown) {
    const info = this.connections.get(client);
    if (!info) return;
    let message: ClientMessage;
    try {
      const text = typeof data === 'string' ? data : data.toString();
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
    this.safeSend(client, {
      type: 'welcome',
      matchId,
      side: assignment.side,
      state: session.state,
    });
  }

  private safeSend(client: WebSocket, payload: unknown) {
    if (client.readyState !== 1) return;
    client.send(JSON.stringify(payload));
  }
}
