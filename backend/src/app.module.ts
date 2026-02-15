import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ObservabilityModule } from './observability/observability.module';
import { UsersModule } from './users/users.module';
import { GamesModule } from './games/games.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ObservabilityModule,
    AuthModule,
    UsersModule,
    GamesModule,
    FriendshipsModule,
    MatchmakingModule,
    RealtimeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
