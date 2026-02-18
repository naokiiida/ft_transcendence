import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/db/migrate';
import { closeDatabase } from '../src/db/database';

describe('Observability (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  // ─── Health ────────────────────────────────────────────

  describe('GET /api/health', () => {
    it('200 を返し、レスポンス形状が正しい', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(res.body).toMatchObject({
        status: expect.any(String),
        components: {
          database: expect.objectContaining({ status: expect.any(String) }),
        },
      });
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.version).toBeDefined();
      expect(res.body.uptime).toBeDefined();
    });

    it('認証なしでアクセスできる', async () => {
      await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
    });
  });

  // ─── Metrics ───────────────────────────────────────────

  describe('GET /api/metrics', () => {
    it('200 を返し、Prometheus 形式のメトリクスを含む', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/metrics')
        .expect(200);

      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('http_requests_total');
      expect(res.text).toContain('http_request_duration_seconds');
      expect(res.text).toContain('logged_in_sessions');
    });

    it('認証なしでアクセスできる', async () => {
      await request(app.getHttpServer())
        .get('/api/metrics')
        .expect(200);
    });
  });
});
