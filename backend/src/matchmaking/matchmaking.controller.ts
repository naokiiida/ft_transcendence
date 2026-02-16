import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MatchmakingService } from './matchmaking.service';
import type { MatchmakingStatus } from './matchmaking.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, RequireUser } from '../auth/decorators';
import type { User } from '../model/user.model';

@UseGuards(AuthGuard)
@RequireUser()
@Controller('api/matchmaking')
export class MatchmakingController {
  constructor(private readonly matchmakingService: MatchmakingService) {}

  @Post('join')
  join(@CurrentUser() user: User): MatchmakingStatus {
    return this.matchmakingService.join(user.uuid);
  }

  @Post('leave')
  leave(@CurrentUser() user: User): MatchmakingStatus {
    return this.matchmakingService.leave(user.uuid);
  }

  @Get('status')
  status(@CurrentUser() user: User): MatchmakingStatus {
    return this.matchmakingService.status(user.uuid);
  }
}
