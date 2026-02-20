import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/db/migrate';
import { getDatabase, closeDatabase } from '../src/db/database';
import { users, sessions, games } from '../src/db/schema';
import { MatchmakingService } from '../src/matchmaking/matchmaking.service';

describe('Matchmaking (e2e)', () => {
  let app: INestApplication<App>;
  let matchmakingService: MatchmakingService;

  /** ユーザー登録してセッションクッキーを返すヘルパー */
  async function registerUser(email: string, displayName: string) {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'test1234', display_name: displayName })
      .expect(201);

    const cookies = res.headers['set-cookie'] as unknown as string[];
    const sessionCookie = cookies.find((c: string) =>
      c.startsWith('ft_session='),
    );
    return { uuid: res.body.uuid as string, cookie: sessionCookie! };
  }

  beforeAll(async () => {
    runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useWebSocketAdapter(new WsAdapter(app));
    await app.init();

    matchmakingService = app.get(MatchmakingService);
  });

  beforeEach(() => {
    const db = getDatabase();
    db.delete(games).run();
    db.delete(sessions).run();
    db.delete(users).run();

    // インメモリキュー・アサインメントをクリア
    const svc = matchmakingService as any;
    svc.queue.clear();
    svc.assignments.clear();
    svc.dissolvedNotices.clear();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  // ─── POST /api/matchmaking/join ─────────────────────────

  describe('POST /api/matchmaking/join', () => {
    it('正常系: キューに参加できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', alice.cookie)
        .expect(201);

      expect(res.body).toMatchObject({
        in_queue: true,
        players_in_queue: 1,
        matched: false,
        match_id: null,
      });
    });

    it('未認証で 401', async () => {
      await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .expect(401);
    });

    it('2人参加で自動マッチング', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      // Alice がキューに参加
      await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', alice.cookie)
        .expect(201);

      // Bob がキューに参加 → 自動マッチ
      const bobRes = await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', bob.cookie)
        .expect(201);

      expect(bobRes.body.matched).toBe(true);
      expect(bobRes.body.match_id).not.toBeNull();
      expect(bobRes.body.side).toBeDefined();
      expect(bobRes.body.in_queue).toBe(false);

      // Alice のステータスもマッチ済みになっている
      const aliceStatus = await request(app.getHttpServer())
        .get('/api/matchmaking/status')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(aliceStatus.body.matched).toBe(true);
      expect(aliceStatus.body.match_id).toBe(bobRes.body.match_id);
    });

    it('マッチ済みユーザーが再度 join しても状態が保持される', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', alice.cookie)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', bob.cookie)
        .expect(201);

      // Alice が再度 join → マッチ状態がそのまま
      const res = await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', alice.cookie)
        .expect(201);

      expect(res.body.matched).toBe(true);
    });
  });

  // ─── POST /api/matchmaking/leave ────────────────────────

  describe('POST /api/matchmaking/leave', () => {
    it('正常系: キューから離脱できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', alice.cookie)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/matchmaking/leave')
        .set('Cookie', alice.cookie)
        .expect(201);

      expect(res.body).toMatchObject({
        in_queue: false,
        matched: false,
      });
    });

    it('未認証で 401', async () => {
      await request(app.getHttpServer())
        .post('/api/matchmaking/leave')
        .expect(401);
    });

    it('マッチ後の離脱でマッチ解消', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      // マッチング
      await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', alice.cookie)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', bob.cookie)
        .expect(201);

      // Alice が離脱 → マッチ解消
      const leaveRes = await request(app.getHttpServer())
        .post('/api/matchmaking/leave')
        .set('Cookie', alice.cookie)
        .expect(201);

      expect(leaveRes.body.matched).toBe(false);
      expect(leaveRes.body.in_queue).toBe(false);

      // Bob のマッチも解消され、キューに戻される
      const bobStatus = await request(app.getHttpServer())
        .get('/api/matchmaking/status')
        .set('Cookie', bob.cookie)
        .expect(200);

      expect(bobStatus.body.matched).toBe(false);
      expect(bobStatus.body.in_queue).toBe(true);
      expect(bobStatus.body.notice_reason).toBe('opponent_left');
    });
  });

  // ─── GET /api/matchmaking/status ────────────────────────

  describe('GET /api/matchmaking/status', () => {
    it('正常系: 未参加ユーザーのアイドル状態', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .get('/api/matchmaking/status')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body).toMatchObject({
        in_queue: false,
        players_in_queue: 0,
        matched: false,
        match_id: null,
        side: null,
      });
    });

    it('未認証で 401', async () => {
      await request(app.getHttpServer())
        .get('/api/matchmaking/status')
        .expect(401);
    });

    it('キュー参加後のステータスが正しい', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .post('/api/matchmaking/join')
        .set('Cookie', alice.cookie)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/matchmaking/status')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body.in_queue).toBe(true);
      expect(res.body.queued_at).not.toBeNull();
      expect(res.body.matched).toBe(false);
    });
  });
});
