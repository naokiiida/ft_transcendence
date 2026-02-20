import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/db/migrate';
import { getDatabase, closeDatabase } from '../src/db/database';
import { users, sessions, games, friendships } from '../src/db/schema';

describe('Profile (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  beforeEach(() => {
    const db = getDatabase();
    db.delete(games).run();
    db.delete(friendships).run();
    db.delete(sessions).run();
    db.delete(users).run();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  // ─── Update Profile ─────────────────────────────────────

  describe('PATCH /api/me/profile', () => {
    it('正常系: display_name を更新できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .patch('/api/me/profile')
        .set('Cookie', alice.cookie)
        .send({ display_name: 'AliceNew' })
        .expect(200);

      expect(res.body).toMatchObject({
        uuid: alice.uuid,
        display_name: 'AliceNew',
      });
      expect(res.body.password_hash).toBeUndefined();
    });

    it('更新後に GET /api/me で反映を確認', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .patch('/api/me/profile')
        .set('Cookie', alice.cookie)
        .send({ display_name: 'AliceUpdated' })
        .expect(200);

      const me = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(me.body.display_name).toBe('AliceUpdated');
    });

    it('display_name の前後空白が trim される', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .patch('/api/me/profile')
        .set('Cookie', alice.cookie)
        .send({ display_name: '  NewName  ' })
        .expect(200);

      expect(res.body.display_name).toBe('NewName');
    });

    it('重複 display_name で 409 Conflict', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      await registerUser('bob@test.com', 'Bob');

      await request(app.getHttpServer())
        .patch('/api/me/profile')
        .set('Cookie', alice.cookie)
        .send({ display_name: 'Bob' })
        .expect(409);
    });

    it('空 display_name で 400 Bad Request', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .patch('/api/me/profile')
        .set('Cookie', alice.cookie)
        .send({ display_name: '' })
        .expect(400);
    });

    it('未認証で 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .patch('/api/me/profile')
        .send({ display_name: 'Hacker' })
        .expect(401);
    });
  });

  // ─── Test Score ──────────────────────────────────────────

  describe('POST /api/me/test-score', () => {
    it('正常系: win で wins+1 と score 更新', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .post('/api/me/test-score')
        .set('Cookie', alice.cookie)
        .send({ result: 'win', score_delta: 25 })
        .expect(201);

      expect(res.body).toMatchObject({
        uuid: alice.uuid,
        wins: 1,
        losses: 0,
        user_score: 25,
      });
    });

    it('正常系: loss で losses+1 と score 減算', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      // まず勝って score を上げる
      await request(app.getHttpServer())
        .post('/api/me/test-score')
        .set('Cookie', alice.cookie)
        .send({ result: 'win', score_delta: 50 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/me/test-score')
        .set('Cookie', alice.cookie)
        .send({ result: 'loss', score_delta: 20 })
        .expect(201);

      expect(res.body).toMatchObject({
        uuid: alice.uuid,
        wins: 1,
        losses: 1,
        user_score: 30,
      });
    });

    it('未認証で 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/api/me/test-score')
        .send({ result: 'win', score_delta: 10 })
        .expect(401);
    });
  });
});
