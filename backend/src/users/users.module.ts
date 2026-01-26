import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  //HTTPリクエストを処理するコントローラーを登録
  controllers: [UsersController],
  //ビジネスロジックを提供するプロバイダーを登録
  providers: [UsersService],
  //他のモジュールでUsersServiceを使用できるようにエクスポート
  exports: [UsersService],
})
export class UsersModule {}
