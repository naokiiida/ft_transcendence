import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
} from 'prom-client';
import { sql, gt } from 'drizzle-orm';
import { getDatabase } from '../db/database';
import { sessions } from '../db/schema';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
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

  readonly httpResponseSize = new Histogram({
    name: 'http_response_size_bytes',
    help: 'HTTP response size in bytes',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000],
    registers: [this.registry],
  });

  readonly dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation'] as const,
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5],
    registers: [this.registry],
  });

  // アプリケーションメトリクス
  readonly loggedInSessions = new Gauge({
    name: 'logged_in_sessions',
    help: 'Number of logged-in sessions (unexpired session records)',
    registers: [this.registry],
    collect() {
      const db = getDatabase();
      const now = new Date().toISOString();
      const result = db
        .select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(gt(sessions.expires_at, now))
        .get();
      this.set(result?.count ?? 0);
    },
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

  onModuleDestroy() {
    this.registry.clear();
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
