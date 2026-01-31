import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { runMigrations } from './db/migrate';

async function bootstrap() {
  // データベースマイグレーションを実行
  runMigrations();

  const app = await NestFactory.create(AppModule);
  // CORS設定、credentialsをtrueにしないとクッキーが送信されない
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  const envPort = process.env.PORT;
  const parsedPort = envPort ? Number(envPort) : NaN;
  const port = Number.isFinite(parsedPort) ? parsedPort : 3001;
  await app.listen(port);
}
bootstrap();
