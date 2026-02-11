import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UnauthorizedException,
  UsePipes,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { readCookie } from '../auth/cookie.utils';
import { GamesService } from './games.service';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import {
  matchHistoryQuerySchema,
  type MatchHistoryQuery,
} from '../model/game.model';

const SESSION_COOKIE = 'ft_session';

@ApiTags('games')
@Controller('api/games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly authService: AuthService,
  ) {}

  // GET /api/games/:id — ゲーム詳細
  @Get(':id')
  getGame(@Req() req: Request, @Param('id') id: string) {
    this.requireAuth(req);
    const game = this.gamesService.findById(id);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    return game;
  }

  // GET /api/games/history/:userId — ユーザーの対戦履歴
  @Get('history/:userId')
  @UsePipes(new ZodValidationPipe(matchHistoryQuerySchema))
  getMatchHistory(
    @Req() req: Request,
    @Param('userId') userId: string,
    @Query() query: MatchHistoryQuery,
  ) {
    this.requireAuth(req);
    return this.gamesService.getMatchHistory(userId, query.limit, query.offset);
  }

  private requireAuth(req: Request) {
    const sessionId = readCookie(req.headers.cookie ?? '', SESSION_COOKIE);
    if (!sessionId) {
      throw new UnauthorizedException('Not authenticated');
    }
    const user = this.authService.findUserBySession(sessionId);
    if (!user) {
      throw new UnauthorizedException('Invalid session');
    }
    return user;
  }
}
