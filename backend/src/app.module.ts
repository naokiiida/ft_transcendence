import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';

@Module({
  imports: [AuthModule, UsersModule, GamesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
