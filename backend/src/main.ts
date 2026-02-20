import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WsAdapter } from '@nestjs/platform-ws';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { runMigrations } from './db/migrate';

async function bootstrap() {
  // データベースマイグレーションを実行
  runMigrations();

  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  // CORS設定、credentialsをtrueにしないとクッキーが送信されない
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // OpenAPI ドキュメント生成
  const config = new DocumentBuilder()
    .setTitle('ft_transcendence API')
    .setDescription('Pong game backend API')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('observability', 'Health checks and metrics')
    .addTag('session', 'Session management')
    .addTag('users', 'User search and leaderboard')
    .addTag('games', 'Game history and details')
    .addTag('friendships', 'Friend management')
    .addTag('matchmaking', 'Matchmaking queue')
    .addCookieAuth('ft_session')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .addExtension('x-tagGroups', [
      { name: 'Public', tags: ['auth', 'observability'] },
      { name: 'Private（認証必須）', tags: ['session', 'users', 'games', 'friendships', 'matchmaking'] },
    ])
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Scalar API Reference UI を /api/reference に配置
  app.use(
    '/api/reference',
    apiReference({
      content: document,
      theme: 'default',
    }),
  );

  const envPort = process.env.PORT;
  const parsedPort = envPort ? Number(envPort) : NaN;
  const port = Number.isFinite(parsedPort) ? parsedPort : 3001;
  await app.listen(port);
}
bootstrap();
