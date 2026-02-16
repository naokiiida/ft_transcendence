import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { runMigrations } from '../src/db/migrate';
import { closeDatabase } from '../src/db/database';

describe('Rate Limiting (e2e)', () => {
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

  it('リミット内のリクエストは 200 を返す', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
  });

  it('リミット超過 (100 req/min) で 429 Too Many Requests を返す', async () => {
    const server = app.getHttpServer();
    // 順次リクエストでリミットを消費（前のテストの1回分を含む）
    for (let i = 0; i < 99; i++) {
      await request(server).get('/api/health');
    }

    // 101回目のリクエストは 429 になるはず
    await request(server)
      .get('/api/health')
      .expect(429);
  }, 30_000);
});
