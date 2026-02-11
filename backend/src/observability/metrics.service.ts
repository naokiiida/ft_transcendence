import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();

  // HTTP リクエストメトリクス
  readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });

  readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  // アプリケーションメトリクス
  readonly activeSessionsCount = new Gauge({
    name: 'active_sessions_count',
    help: 'Number of active user sessions',
    registers: [this.registry],
  });

  // 将来のGame/WebSocket機能用（初期値0で事前登録）
  readonly activeGamesCount = new Gauge({
    name: 'active_games_count',
    help: 'Number of currently active games',
    registers: [this.registry],
  });

  readonly connectedUsersCount = new Gauge({
    name: 'connected_users_count',
    help: 'Number of connected users via WebSocket',
    registers: [this.registry],
  });

  readonly matchesCompletedTotal = new Counter({
    name: 'matches_completed_total',
    help: 'Total number of completed matches',
    registers: [this.registry],
  });

  readonly websocketConnections = new Gauge({
    name: 'websocket_connections',
    help: 'Number of active WebSocket connections',
    registers: [this.registry],
  });

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
