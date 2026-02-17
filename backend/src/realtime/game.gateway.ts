import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { OnModuleDestroy } from '@nestjs/common';
import type { IncomingMessage } from 'http';
import type { RawData, WebSocket } from 'ws';
import { AuthService } from '../auth/auth.service';
import { readCookie } from '../auth/cookie.utils';
import { MatchmakingService } from '../matchmaking/matchmaking.service';
import { MetricsService } from '../observability/metrics.service';
import { UsersService } from '../users/users.service';
import { GameSessionService } from './game-session.service';
import { ChatService } from './chat.service';

type ConnectionInfo = {
  // 1クライアントに紐づく認証/マッチ情報
  userId: string;
  displayName: string;
  matchId: string | null;
  side: 'left' | 'right' | null;
};

type ClientMessage =
  // クライアントから届く WebSocket メッセージ
  | { type: 'join'; matchId: string }
  | { type: 'input'; up: boolean; down: boolean; seq?: number }
  | { type: 'ping' }
  | { type: 'chat_message'; content: string };

@WebSocketGateway({ path: '/api/ws' })
export class GameGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  // 接続中のクライアントとそのメタ情報
  private readonly connections = new Map<WebSocket, ConnectionInfo>();
  // マッチが解散された通知を受け取るためのハンドラ
  private readonly matchDissolvedHandler: (payload: {
    opponentId: string;
    matchId: string;
    reason: 'opponent_left';
  }) => void;

  constructor(
    private readonly authService: AuthService,
    private readonly matchmakingService: MatchmakingService,
    private readonly sessionService: GameSessionService,
    private readonly metricsService: MetricsService,
    private readonly usersService: UsersService,
    private readonly chatService: ChatService,
  ) {
    this.matchDissolvedHandler = (payload: {
      opponentId: string;
      matchId: string;
      reason: 'opponent_left';
    }) => {
      this.notifyMatchDissolved(payload);
    };
    // マッチングサービスのイベントを購読
    this.matchmakingService.events.on(
      'match_dissolved',
      this.matchDissolvedHandler,
    );
  }

  onModuleDestroy() {
    // モジュール破棄時にイベント購読を解除
    this.matchmakingService.events.off(
      'match_dissolved',
      this.matchDissolvedHandler,
    );
  }

  handleConnection(client: WebSocket, request: IncomingMessage) {
    // Cookie のセッションIDからユーザーを特定
    const sessionId = readCookie(request.headers.cookie, 'ft_session');
    const user = sessionId ? this.authService.findUserBySession(sessionId) : null;
    if (!user) {
      client.close();
      return;
    }

    this.metricsService.websocketConnections.inc();
    this.metricsService.connectedUsersCount.inc();
    this.connections.set(client, {
      userId: user.uuid,
      displayName: user.display_name,
      matchId: null,
      side: null,
    });

    // 生の ws イベントからメッセージを受け取る
    client.on('message', (data) => this.handleMessage(client, data));
  }

  handleDisconnect(client: WebSocket) {
    const info = this.connections.get(client);
    if (!info) return;
    // 切断時にチャット/セッションの後処理
    this.chatService.clearUser(info.userId);
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
      // ws の RawData を文字列化して JSON 解析
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

    // メッセージ種別ごとに処理
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
      return;
    }

    if (message.type === 'chat_message') {
      this.handleChatMessage(client, info, message);
    }
  }

  private handleJoin(client: WebSocket, info: ConnectionInfo, matchId: string) {
    // 既に参加済みなら無視
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
      info.displayName,
      client,
    );
    const opponent = this.usersService.findByUuid(assignment.opponentId);
    // 初期状態をクライアントに送信
    this.safeSend(client, {
      type: 'welcome',
      matchId,
      side: assignment.side,
      state: session.state,
      opponentName: opponent?.display_name ?? null,
    });
  }

  private handleChatMessage(
    client: WebSocket,
    info: ConnectionInfo,
    raw: { type: 'chat_message'; content: string },
  ) {
    if (!info.matchId || !info.side) return;

    // バリデーション（レート制限/長さなど）
    const result = this.chatService.validate(info.userId, raw);
    if (!result.ok) {
      this.safeSend(client, {
        type: 'error',
        code: result.error.includes('Rate limited') ? 'RATE_LIMITED' : 'INVALID_MESSAGE',
        message: result.error,
      });
      return;
    }

    const sender = this.usersService.findByUuid(info.userId);
    // 試合参加者へブロードキャスト
    this.sessionService.broadcastToMatch(info.matchId, {
      type: 'chat_received',
      game_id: info.matchId,
      sender: {
        id: info.userId,
        display_name: sender?.display_name ?? 'Unknown',
      },
      content: result.content,
      timestamp: Date.now(),
    });
  }

  private safeSend(client: WebSocket, payload: unknown) {
    // readyState: 1 = OPEN
    if (client.readyState !== 1) return;
    client.send(JSON.stringify(payload));
  }

  private notifyMatchDissolved(payload: {
    opponentId: string;
    matchId: string;
    reason: 'opponent_left';
  }) {
    // 相手が離脱した場合の通知
    this.sessionService.removePlayerByUser(payload.opponentId);
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
