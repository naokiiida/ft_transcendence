// API_KEY はモジュール読み込み前に設定する必要がある
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

describe('Game Statistics (e2e)', () => {
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

  // ─── GET /api/users/leaderboard ─────────────────────────

  describe('GET /api/users/leaderboard', () => {
    it('正常系: スコア降順のランキングを取得できる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');
      const charlie = await registerUser('charlie@test.com', 'Charlie');

      // Alice が Bob に勝利 → Alice: 25pt
      const game1 = gamesService.createAndStartOnlineGame(
        alice.uuid,
        bob.uuid,
      );
      gamesService.completeGame({
        game_id: game1.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 5,
      });

      // Charlie が Bob に勝利 → Charlie: 25pt
      const game2 = gamesService.createAndStartOnlineGame(
        charlie.uuid,
        bob.uuid,
      );
      gamesService.completeGame({
        game_id: game2.id,
        winner_id: charlie.uuid,
        player1_score: 11,
        player2_score: 3,
      });

      // Alice がもう一勝 → Alice: 50pt
      const game3 = gamesService.createAndStartOnlineGame(
        alice.uuid,
        charlie.uuid,
      );
      gamesService.completeGame({
        game_id: game3.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 7,
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/leaderboard')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body).toMatchObject({
        total: 3,
        limit: 20,
        offset: 0,
      });
      expect(res.body.entries).toHaveLength(3);

      // スコア降順: Alice(50) > Bob(0) = Charlie(0)
      // Charlie は1勝(+25)1敗(-25)=0, Bob は2敗で0(MIN 0)
      expect(res.body.entries[0].display_name).toBe('Alice');
      expect(res.body.entries[0].user_score).toBe(50);
      expect(res.body.entries[0].position).toBe(1);
    });

    it('ページネーションが動作する', async () => {
      // 3人登録
      await registerUser('alice@test.com', 'Alice');
      await registerUser('bob@test.com', 'Bob');
      await registerUser('charlie@test.com', 'Charlie');

      const res = await request(app.getHttpServer())
        .get('/api/users/leaderboard?limit=2&offset=0')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body.entries).toHaveLength(2);
      expect(res.body.total).toBe(3);
      expect(res.body.limit).toBe(2);
      expect(res.body.offset).toBe(0);

      // offset=2 で残り1件
      const res2 = await request(app.getHttpServer())
        .get('/api/users/leaderboard?limit=2&offset=2')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res2.body.entries).toHaveLength(1);
    });

    it('セッション認証でもアクセスできる', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .get('/api/users/leaderboard')
        .set('Cookie', alice.cookie)
        .expect(200);

      expect(res.body.entries).toBeDefined();
    });

    it('APIキー認証でアクセスできる', async () => {
      await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .get('/api/users/leaderboard')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body.entries).toBeDefined();
    });
  });

  // ─── GET /api/users/search ──────────────────────────────

  describe('GET /api/users/search', () => {
    it('正常系: 表示名の部分一致検索', async () => {
      await registerUser('alice@test.com', 'Alice');
      await registerUser('bob@test.com', 'Bob');
      await registerUser('alice2@test.com', 'AliceInWonderland');

      const res = await request(app.getHttpServer())
        .get('/api/users/search?display_name=Alice')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body).toHaveLength(2);
      const names = res.body.map((u: { display_name: string }) => u.display_name);
      expect(names).toContain('Alice');
      expect(names).toContain('AliceInWonderland');
    });

    it('認証済みの場合、自分自身を除外', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      await registerUser('alice2@test.com', 'AliceBob');

      const res = await request(app.getHttpServer())
        .get('/api/users/search?display_name=Alice')
        .set('Cookie', alice.cookie)
        .expect(200);

      // Alice 自身は除外される
      expect(res.body).toHaveLength(1);
      expect(res.body[0].display_name).toBe('AliceBob');
    });

    it('マッチなしで空配列', async () => {
      await registerUser('alice@test.com', 'Alice');

      const res = await request(app.getHttpServer())
        .get('/api/users/search?display_name=NoMatch')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('APIキー認証では自分除外なし（全結果を返す）', async () => {
      await registerUser('alice@test.com', 'Alice');
      await registerUser('alice2@test.com', 'AliceBob');

      const res = await request(app.getHttpServer())
        .get('/api/users/search?display_name=Alice')
        .set('X-API-Key', API_KEY)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });
  });

  // ─── Score Integrity ────────────────────────────────────

  describe('スコア整合性', () => {
    it('オンライン対戦後のリーダーボード反映確認', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      // 対戦前: 全員0pt
      const before = await request(app.getHttpServer())
        .get('/api/users/leaderboard')
        .set('X-API-Key', API_KEY)
        .expect(200);

      const aliceBefore = before.body.entries.find(
        (e: { uuid: string }) => e.uuid === alice.uuid,
      );
      expect(aliceBefore.user_score).toBe(0);

      // Alice が勝利
      const game = gamesService.createAndStartOnlineGame(
        alice.uuid,
        bob.uuid,
      );
      gamesService.completeGame({
        game_id: game.id,
        winner_id: alice.uuid,
        player1_score: 11,
        player2_score: 5,
      });

      // 対戦後: Alice 25pt, Bob 0pt
      const after = await request(app.getHttpServer())
        .get('/api/users/leaderboard')
        .set('X-API-Key', API_KEY)
        .expect(200);

      const aliceAfter = after.body.entries.find(
        (e: { uuid: string }) => e.uuid === alice.uuid,
      );
      expect(aliceAfter.user_score).toBe(25);
      expect(aliceAfter.position).toBe(1);
    });

    it('スコアが0未満にならない', async () => {
      const alice = await registerUser('alice@test.com', 'Alice');
      const bob = await registerUser('bob@test.com', 'Bob');

      // Bob（初期スコア0）が負ける
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

      const leaderboard = await request(app.getHttpServer())
        .get('/api/users/leaderboard')
        .set('X-API-Key', API_KEY)
        .expect(200);

      const bob_entry = leaderboard.body.entries.find(
        (e: { uuid: string }) => e.uuid === bob.uuid,
      );
      expect(bob_entry.user_score).toBe(0); // MAX(0, 0-25) = 0
    });
  });
});
