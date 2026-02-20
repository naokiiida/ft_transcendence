process.env.API_KEY = 'test-api-key-for-e2e';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/db/migrate';
import { getDatabase, closeDatabase } from '../src/db/database';
import { users, sessions, games } from '../src/db/schema';
import { GamesService } from '../src/games/games.service';

const API_KEY = 'test-api-key-for-e2e';

describe('Games (e2e)', () => {
  let app: INestApplication<App>;
  let gamesService: GamesService;

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

    gamesService = app.get(GamesService);
  });

  beforeEach(() => {
    const db = getDatabase();
    db.delete(games).run();
    db.delete(sessions).run();
    db.delete(users).run();
  });

  afterAll(async () => {
    await app.close();
    closeDatabase();
  });

  // ─── GET /api/games/:id ─────────────────────────────────

  describe('GET /api/games/:id', () => {
    it('正常系: ゲームIDで詳細を取得できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const game = gamesService.createAndStartOnlineGame(alice.uuid, bob.uuid);

      const res = await request(app.getHttpServer())
        .get(`/api/games/${game.id}`)
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body).toMatchObject({
        id: game.id,
        player1_id: alice.uuid,
        player2_id: bob.uuid,
        game_type: 'online',
        status: 'playing',
      });
    });

    it('存在しないIDで 404', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .get('/api/games/00000000-0000-0000-0000-000000000000')
        .set('Cookie', alice.cookie)
        .expect(404);
    });
  });

  // ─── GET /api/games/history/:userId ─────────────────────

  describe('GET /api/games/history/:userId', () => {
    it('正常系: ページネーション付き対戦履歴を取得できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const game = gamesService.createAndStartOnlineGame(alice.uuid, bob.uuid);
      gamesService.completeGame({
        game_id: game.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 5,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/games/history/${alice.uuid}`)
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body).toMatchObject({
        total: 1,
        limit: 20,
        offset: 0,
      });
      expect(res.body.games).toHaveLength(1);
      expect(res.body.games[0]).toMatchObject({
        player1_id: alice.uuid,
        player2_id: bob.uuid,
        winner_id: alice.uuid,
        status: 'completed',
      });
    });

    it('limit / offset パラメータが動作する', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      // 3試合作成
      for (let i = 0; i < 3; i++) {
        const game = gamesService.createAndStartOnlineGame(
          alice.uuid,
          bob.uuid,
        );
        gamesService.completeGame({
          game_id: game.id,
          winner_id: alice.uuid,
          player1_score: 11,
          player2_score: i,
        });
      }

      const res = await request(app.getHttpServer())
        .get(`/api/games/history/${alice.uuid}?limit=2&offset=1`)
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body.games).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.limit).toBe(2);
      expect(res.body.offset).toBe(1);
    });

    it('player2側からも履歴に表示される', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const game = gamesService.createAndStartOnlineGame(alice.uuid, bob.uuid);
      gamesService.completeGame({
        game_id: game.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 5,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/games/history/${bob.uuid}`)
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body.games).toHaveLength(1);
      expect(res.body.games[0].player2_id).toBe(bob.uuid);
    });

    it('プレイヤーの display_name が含まれる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const game = gamesService.createAndStartOnlineGame(alice.uuid, bob.uuid);
      gamesService.completeGame({
        game_id: game.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 5,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/games/history/${alice.uuid}`)
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body.games[0]).toMatchObject({
        player1_display_name: 'Alice',
        player2_display_name: 'Bob',
      });
    });

    it('ゲームがないユーザーは空配列', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .get(`/api/games/history/${alice.uuid}`)
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body.games).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('limit > 100 で 400', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .get(`/api/games/history/${alice.uuid}?limit=101`)
        .set('Cookie', alice.cookie)
        .expect(400);
    });

    it('offset < 0 で 400', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      await request(app.getHttpServer())
        .get(`/api/games/history/${alice.uuid}?offset=-1`)
        .set('Cookie', alice.cookie)
        .expect(400);
    });
  });

  // ─── Score Calculation ──────────────────────────────────

  describe('スコア計算', () => {
    it('オンライン対戦: 勝者 +1 win +25 score / 敗者 +1 loss score MIN 0', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      const game = gamesService.createAndStartOnlineGame(alice.uuid, bob.uuid);
      gamesService.completeGame({
        game_id: game.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 5,
      });

      // Alice: 勝者
      const aliceRes = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(aliceRes.body.wins).toBe(1);
      expect(aliceRes.body.losses).toBe(0);
      expect(aliceRes.body.user_score).toBe(25);

      // Bob: 敗者（初期スコア0なのでMAX(0, 0-25) = 0）
      const bobRes = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', bob.cookie)
        .expect(200);

      expect(bobRes.body.wins).toBe(0);
      expect(bobRes.body.losses).toBe(1);
      expect(bobRes.body.user_score).toBe(0);
    });

    it('複数試合の累積が正しい', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      // Alice が2連勝
      for (let i = 0; i < 2; i++) {
        const game = gamesService.createAndStartOnlineGame(
          alice.uuid,
          bob.uuid,
        );
        gamesService.completeGame({
          game_id: game.id,
          winner_id: alice.uuid,
          player1_score: 11,
          player2_score: 3,
        });
      }

      const aliceRes = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(aliceRes.body.wins).toBe(2);
      expect(aliceRes.body.user_score).toBe(50);

      const bobRes = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', bob.cookie)
        .expect(200);

      expect(bobRes.body.losses).toBe(2);
      expect(bobRes.body.user_score).toBe(0); // MIN 0
    });

    it('AI ゲームではスコア未変動', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const game = gamesService.createGame({
        game_type: 'ai',
        player1_id: alice.uuid,
        ai_difficulty: 'medium',
      });
      const started = gamesService.startGame(game.id);
      gamesService.completeGame({
        game_id: started.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 3,
      });

      const res = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body.wins).toBe(0);
      expect(res.body.losses).toBe(0);
      expect(res.body.user_score).toBe(0);
    });

    it('ローカルゲームではスコア未変動', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const game = gamesService.createGame({
        game_type: 'local',
        player1_id: alice.uuid,
      });
      const started = gamesService.startGame(game.id);
      gamesService.completeGame({
        game_id: started.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 7,
      });

      const res = await request(app.getHttpServer())
        .get('/api/me')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body.wins).toBe(0);
      expect(res.body.losses).toBe(0);
      expect(res.body.user_score).toBe(0);
    });
  });
});
