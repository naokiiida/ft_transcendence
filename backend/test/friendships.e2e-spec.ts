import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/db/migrate';
import { getDatabase, closeDatabase } from '../src/db/database';
import { users, sessions, friendships } from '../src/db/schema';

describe('Friendships (e2e)', () => {
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

  /** Alice→Bob のフレンドリクエストを送信して friendship id を返す */
  async function sendRequest(senderCookie: string, addresseeId: string) {
    const res = await request(app.getHttpServer())
      .post('/api/friendships')
      .set('Cookie', senderCookie)
      .send({ addressee_id: addresseeId })
      .expect(201);
    return res.body;
  }

  /** フレンドリクエストに応答する */
  async function respond(
    friendshipId: string,
    responderCookie: string,
    response: 'accepted' | 'declined',
  ) {
    return request(app.getHttpServer())
      .patch(`/api/friendships/${friendshipId}`)
      .set('Cookie', responderCookie)
      .send({ response })
      .expect(200);
  }

  beforeAll(async () => {
    runMigrations();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    const db = getDatabase();
    db.delete(friendships).run();
    db.delete(sessions).run();
    db.delete(users).run();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  // ─── Send Request ──────────────────────────────────────

  describe('POST /api/friendships', () => {
    it('正常系: フレンドリクエストを送信できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const res = await request(app.getHttpServer())
        .post('/api/friendships')
        .set('Cookie', alice.cookie)
        .send({ addressee_id: bob.uuid })
        .expect(201);

      expect(res.body).toMatchObject({
        requester_id: alice.uuid,
        addressee_id: bob.uuid,
        status: 'pending',
      });
      expect(res.body.id).toBeDefined();
    });

    it('自分自身へのリクエストで 400', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .post('/api/friendships')
        .set('Cookie', alice.cookie)
        .send({ addressee_id: alice.uuid })
        .expect(400);
    });

    it('存在しないユーザーへのリクエストで 404', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .post('/api/friendships')
        .set('Cookie', alice.cookie)
        .send({ addressee_id: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('重複リクエストで 409 Conflict', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      await sendRequest(alice.cookie, bob.uuid);

      await request(app.getHttpServer())
        .post('/api/friendships')
        .set('Cookie', alice.cookie)
        .send({ addressee_id: bob.uuid })
        .expect(409);
    });

    it('逆方向の pending リクエストがあると自動 accept', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      // Bob → Alice (pending)
      await sendRequest(bob.cookie, alice.uuid);

      // Alice → Bob → 自動 accept
      const res = await request(app.getHttpServer())
        .post('/api/friendships')
        .set('Cookie', alice.cookie)
        .send({ addressee_id: bob.uuid })
        .expect(201);

      expect(res.body.status).toBe('accepted');
    });

    it('既にフレンドの場合 409 Conflict', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);
      await respond(friendship.id, bob.cookie, 'accepted');

      await request(app.getHttpServer())
        .post('/api/friendships')
        .set('Cookie', alice.cookie)
        .send({ addressee_id: bob.uuid })
        .expect(409);
    });

    it('decline 後に再リクエストできる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);
      await respond(friendship.id, bob.cookie, 'declined');

      // 再リクエスト
      const res = await request(app.getHttpServer())
        .post('/api/friendships')
        .set('Cookie', alice.cookie)
        .send({ addressee_id: bob.uuid })
        .expect(201);

      expect(res.body.status).toBe('pending');
    });

    it('未認証で 401', async () => {
      await request(app.getHttpServer())
        .post('/api/friendships')
        .send({ addressee_id: '00000000-0000-0000-0000-000000000000' })
        .expect(401);
    });

    it('不正な addressee_id で 400', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .post('/api/friendships')
        .set('Cookie', alice.cookie)
        .send({ addressee_id: 'not-a-uuid' })
        .expect(400);
    });
  });

  // ─── Respond to Request ────────────────────────────────

  describe('PATCH /api/friendships/:id', () => {
    it('正常系: accept でフレンドになれる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);

      const res = await request(app.getHttpServer())
        .patch(`/api/friendships/${friendship.id}`)
        .set('Cookie', bob.cookie)
        .send({ response: 'accepted' })
        .expect(200);

      expect(res.body.status).toBe('accepted');
    });

    it('正常系: decline できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);

      const res = await request(app.getHttpServer())
        .patch(`/api/friendships/${friendship.id}`)
        .set('Cookie', bob.cookie)
        .send({ response: 'declined' })
        .expect(200);

      expect(res.body.status).toBe('declined');
    });

    it('requester が応答しようとすると 403', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);

      await request(app.getHttpServer())
        .patch(`/api/friendships/${friendship.id}`)
        .set('Cookie', alice.cookie)
        .send({ response: 'accepted' })
        .expect(403);
    });

    it('既に応答済みのリクエストに再応答で 409', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);
      await respond(friendship.id, bob.cookie, 'accepted');

      await request(app.getHttpServer())
        .patch(`/api/friendships/${friendship.id}`)
        .set('Cookie', bob.cookie)
        .send({ response: 'declined' })
        .expect(409);
    });

    it('存在しないリクエストに 404', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .patch('/api/friendships/00000000-0000-0000-0000-000000000000')
        .set('Cookie', alice.cookie)
        .send({ response: 'accepted' })
        .expect(404);
    });

    it('不正な response 値で 400', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);

      await request(app.getHttpServer())
        .patch(`/api/friendships/${friendship.id}`)
        .set('Cookie', bob.cookie)
        .send({ response: 'maybe' })
        .expect(400);
    });
  });

  // ─── Get Friends ───────────────────────────────────────

  describe('GET /api/friendships', () => {
    it('正常系: フレンド一覧を取得できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);
      await respond(friendship.id, bob.cookie, 'accepted');

      const res = await request(app.getHttpServer())
        .get('/api/friendships')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        friend_id: bob.uuid,
        display_name: 'Bob',
      });
    });

    it('pending のフレンドは一覧に含まれない', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      await sendRequest(alice.cookie, bob.uuid);

      const res = await request(app.getHttpServer())
        .get('/api/friendships')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('フレンドがいない場合は空配列', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .get('/api/friendships')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('双方向で見える（addressee 側からも取得できる）', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);
      await respond(friendship.id, bob.cookie, 'accepted');

      // Bob's friends list should also show Alice
      const res = await request(app.getHttpServer())
        .get('/api/friendships')
        .set('Cookie', bob.cookie)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        friend_id: alice.uuid,
        display_name: 'Alice',
      });
    });
  });

  // ─── Get Pending Requests ──────────────────────────────

  describe('GET /api/friendships/pending', () => {
    it('正常系: 受信した保留中リクエスト一覧', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      await sendRequest(alice.cookie, bob.uuid);

      const res = await request(app.getHttpServer())
        .get('/api/friendships/pending')
        .set('Cookie', bob.cookie)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        requester_id: alice.uuid,
        display_name: 'Alice',
      });
    });

    it('送信したリクエストは pending に含まれない', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      await sendRequest(alice.cookie, bob.uuid);

      // Alice は送信者なので pending には出ない
      const res = await request(app.getHttpServer())
        .get('/api/friendships/pending')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('保留中リクエストがない場合は空配列', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .get('/api/friendships/pending')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  // ─── Remove Friend ────────────────────────────────────

  describe('DELETE /api/friendships/:id', () => {
    it('正常系: requester がフレンド解除できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);
      await respond(friendship.id, bob.cookie, 'accepted');

      await request(app.getHttpServer())
        .delete(`/api/friendships/${friendship.id}`)
        .set('Cookie', alice.cookie)
        .expect(200);

      // フレンド一覧が空になっている
      const res = await request(app.getHttpServer())
        .get('/api/friendships')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('addressee 側からもフレンド解除できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const friendship = await sendRequest(alice.cookie, bob.uuid);
      await respond(friendship.id, bob.cookie, 'accepted');

      await request(app.getHttpServer())
        .delete(`/api/friendships/${friendship.id}`)
        .set('Cookie', bob.cookie)
        .expect(200);
    });

    it('無関係のユーザーが解除しようとすると 403', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');
      const charlie = await registerUser('charlie@test.com', 'Charlie');

      const friendship = await sendRequest(alice.cookie, bob.uuid);
      await respond(friendship.id, bob.cookie, 'accepted');

      await request(app.getHttpServer())
        .delete(`/api/friendships/${friendship.id}`)
        .set('Cookie', charlie.cookie)
        .expect(403);
    });

    it('存在しないフレンドシップで 404', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .delete('/api/friendships/00000000-0000-0000-0000-000000000000')
        .set('Cookie', alice.cookie)
        .expect(404);
    });
  });
});
