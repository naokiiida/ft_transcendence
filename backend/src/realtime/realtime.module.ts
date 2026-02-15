import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchmakingModule } from '../matchmaking/matchmaking.module';
import { ObservabilityModule } from '../observability/observability.module';
import { GameGateway } from './game.gateway';
import { GameSessionService } from './game-session.service';

@Module({
  imports: [AuthModule, MatchmakingModule, ObservabilityModule],
  providers: [GameGateway, GameSessionService],
})
export class RealtimeModule {}
