import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/db/migrate';
import { getDatabase, closeDatabase } from '../src/db/database';
import { users, sessions } from '../src/db/schema';

describe('Auth (e2e)', () => {
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

  beforeEach(() => {
    const db = getDatabase();
    db.delete(sessions).run();
    db.delete(users).run();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  // ─── Register ────────────────────────────────────────────

  describe('POST /api/auth/register', () => {
    const validBody = {
      email: 'p1@test.com',
      password: 'test1234',
      display_name: 'Player1',
    };

    it('正常系: ユーザー登録して PublicUser + セッションクッキーを返す', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validBody)
        .expect(201);

      // レスポンスに PublicUser のフィールドが含まれる
      expect(res.body).toMatchObject({
        email: 'p1@test.com',
        display_name: 'Player1',
        method: 'email',
        wins: 0,
        losses: 0,
        user_score: 1000,
      });
      expect(res.body.uuid).toBeDefined();
      // password_hash は返されない
      expect(res.body.password_hash).toBeUndefined();

      // ft_session クッキーが httpOnly で設定される
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const sessionCookie = cookies.find((c: string) =>
        c.startsWith('ft_session='),
      );
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('Path=/');
    });

    it('email の toLowerCase が適用される', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validBody, email: 'P1@Test.COM' })
        .expect(201);

      expect(res.body.email).toBe('p1@test.com');
    });

    it('display_name の前後空白が trim される', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validBody, display_name: '  Player1  ' })
        .expect(201);

      expect(res.body.display_name).toBe('Player1');
    });

    it('重複メールで 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validBody)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validBody, display_name: 'Other' })
        .expect(409);
    });

    it('重複 display_name で 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validBody)
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validBody, email: 'other@test.com' })
        .expect(409);
    });

    it('不正なメールで 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validBody, email: 'not-an-email' })
        .expect(400);
    });

    it('短すぎるパスワード (< 8文字) で 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validBody, password: 'short' })
        .expect(400);
    });

    it('空の display_name で 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validBody, display_name: '' })
        .expect(400);
    });

    it('body が空で 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({})
        .expect(400);
    });
  });

  // ─── Login ───────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    // 各 login テスト前にユーザーを登録しておく
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'p1@test.com',
          password: 'test1234',
          display_name: 'Player1',
        });
    });

    it('正常系: ログインして PublicUser + セッションクッキーを返す', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'p1@test.com', password: 'test1234' })
        .expect(201);

      expect(res.body).toMatchObject({
        email: 'p1@test.com',
        display_name: 'Player1',
      });
      expect(res.body.password_hash).toBeUndefined();

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const sessionCookie = cookies.find((c: string) =>
        c.startsWith('ft_session='),
      );
      expect(sessionCookie).toBeDefined();
    });

    it('大文字メールでもログインできる (case-insensitive)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'P1@TEST.COM', password: 'test1234' })
        .expect(201);
    });

    it('間違ったパスワードで 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'p1@test.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('存在しないメールで 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'test1234' })
        .expect(401);
    });

    it('パスワードなしで 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'p1@test.com' })
        .expect(400);
    });
  });
});
