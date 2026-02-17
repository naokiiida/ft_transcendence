import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchmakingModule } from '../matchmaking/matchmaking.module';
import { GamesModule } from '../games/games.module';
import { UsersModule } from '../users/users.module';
import { ObservabilityModule } from '../observability/observability.module';
import { GameGateway } from './game.gateway';
import { GameSessionService } from './game-session.service';
import { ChatService } from './chat.service';

@Module({
  // WebSocket関連の依存関係をまとめるモジュール
  imports: [AuthModule, MatchmakingModule, GamesModule, UsersModule, ObservabilityModule],
  providers: [GameGateway, GameSessionService, ChatService],
})
export class RealtimeModule {}
