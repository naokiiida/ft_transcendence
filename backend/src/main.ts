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
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // OpenAPI ドキュメント生成
  const config = new DocumentBuilder()
    .setTitle('ft_transcendence API')
    .setDescription('Pong game backend API')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('session', 'Session management')
    .addCookieAuth('ft_session')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Scalar API Reference UI を /reference に配置
  app.use(
    '/reference',
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
