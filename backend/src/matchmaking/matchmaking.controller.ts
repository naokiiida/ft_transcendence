import { Controller, Get, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { MatchmakingService } from './matchmaking.service';
import type { MatchmakingStatus } from './matchmaking.service';
import { CurrentUser, RequireUser } from '../auth/decorators';
import type { User } from '../model/user.model';

@ApiTags('matchmaking')
@ApiCookieAuth('ft_session')
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
