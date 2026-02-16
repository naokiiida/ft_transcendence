// API_KEY を auth.guard.ts がモジュール読み込み時に参照するため、import 前に設定
process.env.API_KEY = 'test-api-key-for-e2e';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/db/migrate';
import { closeDatabase, getDatabase } from '../src/db/database';
import { users, sessions } from '../src/db/schema';

describe('API Key Auth (e2e)', () => {
  let app: INestApplication<App>;
  const API_KEY = 'test-api-key-for-e2e';

  beforeAll(async () => {
    runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.init();
  });

  beforeEach(() => {
    const db = getDatabase();
    db.delete(sessions).run();
    db.delete(users).run();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  // ─── @Public() エンドポイント ─────────────────────────

  it('@Public() エンドポイントは API キーなしでもアクセス可能', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
  });

  // ─── 保護エンドポイント × API キー ───────────────────

  it('API キーなしで保護エンドポイントにアクセス → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/users/leaderboard')
      .expect(401);
  });

  it('不正な API キーで保護エンドポイントにアクセス → 401', async () => {
    await request(app.getHttpServer())
      .get('/api/users/leaderboard')
      .set('X-API-Key', 'wrong-key')
      .expect(401);
  });

  it('正しい API キーで保護エンドポイントにアクセス → 200', async () => {
    await request(app.getHttpServer())
      .get('/api/users/leaderboard')
      .set('X-API-Key', API_KEY)
      .expect(200);
  });

  // ─── セッション認証との共存 ──────────────────────────

  it('セッション認証も引き続き動作する', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'apitest@test.com',
        password: 'test1234',
        display_name: 'ApiTester',
      })
      .expect(201);

    const cookies = registerRes.headers['set-cookie'] as unknown as string[];
    const sessionCookie = cookies.find((c: string) =>
      c.startsWith('ft_session='),
    );

    const res = await request(app.getHttpServer())
      .get('/api/me')
      .set('Cookie', sessionCookie!)
      .expect(200);

    expect(res.body.display_name).toBe('ApiTester');
  });

  // ─── @RequireUser() エンドポイント × API キー → 403 ──

  it('API キーで GET /api/me にアクセス → 403', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/me')
      .set('X-API-Key', API_KEY)
      .expect(403);

    expect(res.body.message).toContain('session authentication');
  });

  it('API キーで DELETE /api/me にアクセス → 403', async () => {
    await request(app.getHttpServer())
      .delete('/api/me')
      .set('X-API-Key', API_KEY)
      .expect(403);
  });

  it('API キーで POST /api/me/test-score にアクセス → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/me/test-score')
      .set('X-API-Key', API_KEY)
      .send({ result: 'win', score_delta: 10 })
      .expect(403);
  });

  it('API キーで POST /api/friendships にアクセス → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/friendships')
      .set('X-API-Key', API_KEY)
      .send({ addressee_id: '00000000-0000-0000-0000-000000000000' })
      .expect(403);
  });

  it('API キーで POST /api/matchmaking/join にアクセス → 403', async () => {
    await request(app.getHttpServer())
      .post('/api/matchmaking/join')
      .set('X-API-Key', API_KEY)
      .expect(403);
  });

  // ─── データ系エンドポイント × API キー → 引き続き 200 ─

  it('API キーで GET /api/users/search にアクセス → 200', async () => {
    await request(app.getHttpServer())
      .get('/api/users/search')
      .set('X-API-Key', API_KEY)
      .query({ display_name: 'test', limit: 10 })
      .expect(200);
  });

  it('API キーで GET /api/users/leaderboard にアクセス → 200', async () => {
    await request(app.getHttpServer())
      .get('/api/users/leaderboard')
      .set('X-API-Key', API_KEY)
      .expect(200);
  });
});
